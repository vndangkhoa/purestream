"""
Auth API routes - simplified to use PlaywrightManager.
"""

from fastapi import APIRouter, Form, HTTPException
from pydantic import BaseModel
import os
import json

from core.playwright_manager import PlaywrightManager, COOKIES_FILE

router = APIRouter()


class BrowserLoginResponse(BaseModel):
    status: str
    message: str
    cookie_count: int = 0


from typing import Any

class CredentialsRequest(BaseModel):
    credentials: Any  # Accept both dict and list


class CredentialLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=BrowserLoginResponse)
async def credential_login(request: CredentialLoginRequest):
    """
    Login with TikTok username/email and password.
    Uses headless browser - works on Docker/NAS.
    """
    try:
        result = await PlaywrightManager.credential_login(
            username=request.username,
            password=request.password,
            timeout_seconds=60
        )
        return BrowserLoginResponse(
            status=result["status"],
            message=result["message"],
            cookie_count=result.get("cookie_count", 0)
        )
    except Exception as e:
        print(f"DEBUG: Credential login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/browser-login", response_model=BrowserLoginResponse)
async def browser_login():
    """
    Open a visible browser window for user to login to TikTok via SSL.
    Waits for login completion (detected via sessionid cookie) and captures cookies.
    """
    try:
        result = await PlaywrightManager.browser_login(timeout_seconds=180)
        return BrowserLoginResponse(
            status=result["status"],
            message=result["message"],
            cookie_count=result.get("cookie_count", 0)
        )
    except Exception as e:
        print(f"DEBUG: Browser login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credentials")
async def save_credentials(request: CredentialsRequest):
    """
    Save JSON credentials (advanced login option).
    Accepts the http.headers.Cookie format.
    """
    try:
        cookies, user_agent = PlaywrightManager.parse_json_credentials(request.credentials)
        
        if not cookies:
            raise HTTPException(status_code=400, detail="No cookies found in credentials")
        
        # Save full cookie list with domains/paths preserved
        PlaywrightManager.save_credentials(cookies, user_agent)
        
        return {
            "status": "success",
            "message": f"Saved {len(cookies)} cookies",
            "cookie_count": len(cookies)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def auth_status():
    """Check if we have stored cookies."""
    if os.path.exists(COOKIES_FILE) and os.path.getsize(COOKIES_FILE) > 0:
        try:
            with open(COOKIES_FILE, "r") as f:
                cookies = json.load(f)
                has_session = "sessionid" in cookies
                return {
                    "authenticated": has_session,
                    "cookie_count": len(cookies)
                }
        except:
            pass
    return {"authenticated": False, "cookie_count": 0}


@router.post("/logout")
async def logout():
    """Clear stored credentials."""
    if os.path.exists(COOKIES_FILE):
        os.remove(COOKIES_FILE)
    return {"status": "success", "message": "Logged out"}


@router.post("/start-vnc")
async def start_vnc_login():
    """
    Start VNC login - opens a visible browser via noVNC.
    Users interact with the browser stream to login.
    """
    result = await PlaywrightManager.start_vnc_login()
    return result


@router.get("/check-vnc")
async def check_vnc_login():
    """
    Check if VNC login is complete (sessionid cookie detected).
    Frontend polls this endpoint.
    """
    result = await PlaywrightManager.check_vnc_login()
    return result


@router.post("/stop-vnc")
async def stop_vnc_login():
    """Stop the VNC login browser."""
    result = await PlaywrightManager.stop_vnc_login()
    return result


# ========== ADMIN ENDPOINTS ==========

# Admin password from environment variable
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# Simple in-memory admin sessions (resets on restart, that's fine for this use case)
_admin_sessions: set = set()


class AdminLoginRequest(BaseModel):
    password: str


class AdminCookiesRequest(BaseModel):
    cookies: list | dict  # Accept both array (Cookie-Editor) or object format


@router.post("/admin-login")
async def admin_login(request: AdminLoginRequest):
    """Login as admin with password."""
    if request.password == ADMIN_PASSWORD:
        import secrets
        session_token = secrets.token_urlsafe(32)
        _admin_sessions.add(session_token)
        return {"status": "success", "token": session_token}
    raise HTTPException(status_code=401, detail="Invalid password")


@router.get("/admin-check")
async def admin_check(token: str = ""):
    """Check if admin session is valid."""
    return {"valid": token in _admin_sessions}


@router.post("/admin-update-cookies")
async def admin_update_cookies(request: AdminCookiesRequest, token: str = ""):
    """Update cookies (admin only)."""
    if token not in _admin_sessions:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        cookies = request.cookies
        
        # Preserve list if it contains metadata (like domain)
        if isinstance(cookies, list):
            # Check if this is a simple name-value list or full objects
            if len(cookies) > 0 and isinstance(cookies[0], dict) and "domain" not in cookies[0]:
                cookie_dict = {}
                for c in cookies:
                    if isinstance(c, dict) and "name" in c and "value" in c:
                        cookie_dict[c["name"]] = c["value"]
                cookies = cookie_dict
        
        if not isinstance(cookies, (dict, list)):
            raise HTTPException(status_code=400, detail="Invalid cookies format")
        
        # Check for sessionid in both formats
        has_session = False
        if isinstance(cookies, dict):
            has_session = "sessionid" in cookies
        else:
            has_session = any(c.get("name") == "sessionid" for c in cookies if isinstance(c, dict))
            
        if not has_session:
            raise HTTPException(status_code=400, detail="Missing 'sessionid' cookie - this is required")
        
        # Save cookies (either dict or list)
        PlaywrightManager.save_credentials(cookies, None)
        
        return {
            "status": "success",
            "message": f"Saved {len(cookies)} cookies",
            "cookie_count": len(cookies)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin-get-cookies")
async def admin_get_cookies(token: str = ""):
    """Get current cookies (admin only, for display)."""
    if token not in _admin_sessions:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if os.path.exists(COOKIES_FILE):
        try:
            with open(COOKIES_FILE, "r") as f:
                cookies = json.load(f)
                # Mask sensitive values for display
                masked = {}
                for key, value in cookies.items():
                    if key == "sessionid":
                        masked[key] = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
                    else:
                        masked[key] = value[:20] + "..." if len(str(value)) > 20 else value
                return {"cookies": masked, "raw_count": len(cookies)}
        except:
            pass
    return {"cookies": {}, "raw_count": 0}

