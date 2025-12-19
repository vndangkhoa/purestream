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


class CredentialsRequest(BaseModel):
    credentials: dict  # JSON credentials in http.headers format


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
        
        # Convert to dict format for storage
        cookie_dict = {c["name"]: c["value"] for c in cookies}
        PlaywrightManager.save_credentials(cookie_dict, user_agent)
        
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
