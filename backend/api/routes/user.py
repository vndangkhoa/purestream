"""
User profile API - fetch real TikTok user data.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
import asyncio

from core.playwright_manager import PlaywrightManager

router = APIRouter()


class UserProfile(BaseModel):
    """TikTok user profile data."""
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    followers: Optional[int] = None
    following: Optional[int] = None
    likes: Optional[int] = None
    verified: bool = False


@router.get("/profile")
async def get_user_profile(username: str = Query(..., description="TikTok username (without @)")):
    """
    Fetch real TikTok user profile data.
    """
    username = username.replace("@", "")
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Build cookie header
    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    
    headers = {
        "User-Agent": user_agent or PlaywrightManager.DEFAULT_USER_AGENT,
        "Referer": "https://www.tiktok.com/",
        "Cookie": cookie_str,
        "Accept": "application/json",
    }
    
    # Try to fetch user data from TikTok's internal API
    profile_url = f"https://www.tiktok.com/api/user/detail/?uniqueId={username}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(profile_url, headers=headers)
            
            if response.status_code != 200:
                # Fallback - return basic info
                return UserProfile(username=username)
            
            data = response.json()
            user_info = data.get("userInfo", {})
            user = user_info.get("user", {})
            stats = user_info.get("stats", {})
            
            return UserProfile(
                username=username,
                nickname=user.get("nickname"),
                avatar=user.get("avatarLarger") or user.get("avatarMedium"),
                bio=user.get("signature"),
                followers=stats.get("followerCount"),
                following=stats.get("followingCount"),
                likes=stats.get("heartCount"),
                verified=user.get("verified", False)
            )
            
    except Exception as e:
        print(f"Error fetching profile for {username}: {e}")
        # Return basic fallback
        return UserProfile(username=username)


@router.get("/profiles")
async def get_multiple_profiles(usernames: str = Query(..., description="Comma-separated usernames")):
    """
    Fetch multiple TikTok user profiles at once.
    """
    username_list = [u.strip().replace("@", "") for u in usernames.split(",") if u.strip()]
    
    if len(username_list) > 20:
        raise HTTPException(status_code=400, detail="Max 20 usernames at once")
    
    # Fetch all profiles concurrently
    tasks = [get_user_profile(u) for u in username_list]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    profiles = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            profiles.append(UserProfile(username=username_list[i]))
        else:
            profiles.append(result)
    
    return profiles


@router.get("/videos")
async def get_user_videos(
    username: str = Query(..., description="TikTok username (without @)"),
    limit: int = Query(10, description="Max videos to fetch", ge=1, le=30)
):
    """
    Fetch videos from a TikTok user's profile.
    Uses Playwright to crawl the user's page for reliable results.
    """
    username = username.replace("@", "")
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Fetching videos for @{username}...")
    
    try:
        videos = await PlaywrightManager.fetch_user_videos(username, cookies, user_agent, limit)
        return {"username": username, "videos": videos, "count": len(videos)}
    except Exception as e:
        print(f"Error fetching videos for {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_videos(
    query: str = Query(..., description="Search keyword or hashtag"),
    limit: int = Query(12, description="Max videos to fetch", ge=1, le=30)
):
    """
    Search for videos by keyword or hashtag.
    Uses Playwright to crawl TikTok search results for reliable data.
    """
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Searching for: {query}...")
    
    try:
        videos = await PlaywrightManager.search_videos(query, cookies, user_agent, limit)
        return {"query": query, "videos": videos, "count": len(videos)}
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Cache for suggested accounts
_suggested_cache = {
    "accounts": [],
    "updated_at": 0
}
CACHE_TTL = 3600  # 1 hour cache


@router.get("/suggested")
async def get_suggested_accounts(
    limit: int = Query(50, description="Max accounts to return", ge=10, le=100)
):
    """
    Fetch trending/suggested Vietnamese TikTok creators.
    Uses TikTok's discover API and caches results for 1 hour.
    """
    import time
    
    # Check cache
    if _suggested_cache["accounts"] and (time.time() - _suggested_cache["updated_at"]) < CACHE_TTL:
        print("Returning cached suggested accounts")
        return {"accounts": _suggested_cache["accounts"][:limit], "cached": True}
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        # Return fallback static list if not authenticated
        return {"accounts": get_fallback_accounts()[:limit], "cached": False, "fallback": True}
    
    print("Fetching fresh suggested accounts from TikTok...")
    
    try:
        accounts = await PlaywrightManager.fetch_suggested_accounts(cookies, user_agent, limit)
        
        if accounts:
            _suggested_cache["accounts"] = accounts
            _suggested_cache["updated_at"] = time.time()
            return {"accounts": accounts[:limit], "cached": False}
        else:
            # Fallback if API fails
            return {"accounts": get_fallback_accounts()[:limit], "cached": False, "fallback": True}
            
    except Exception as e:
        print(f"Error fetching suggested accounts: {e}")
        return {"accounts": get_fallback_accounts()[:limit], "cached": False, "fallback": True}


def get_fallback_accounts():
    """Static fallback list of popular Vietnamese TikTokers."""
    return [
        {"username": "ciin_rubi", "nickname": "👑 CiiN - Lisa of Vietnam", "region": "VN"},
        {"username": "hoaa.hanassii", "nickname": "💃 Hoa Hanassii", "region": "VN"},
        {"username": "hoa_2309", "nickname": "🔥 Ngô Ngọc Hòa", "region": "VN"},
        {"username": "minah.ne", "nickname": "🎵 Minah", "region": "VN"},
        {"username": "lebong95", "nickname": "💪 Lê Bống", "region": "VN"},
        {"username": "po.trann77", "nickname": "✨ Trần Thanh Tâm", "region": "VN"},
        {"username": "gamkami", "nickname": "🎱 Gấm Kami", "region": "VN"},
        {"username": "quynhalee", "nickname": "🎮 Quỳnh Alee", "region": "VN"},
        {"username": "tieu_hy26", "nickname": "👰 Tiểu Hý", "region": "VN"},
        {"username": "changmie", "nickname": "🎤 Changmie", "region": "VN"},
        {"username": "vuthuydien", "nickname": "😄 Vũ Thụy Điển", "region": "VN"},
        {"username": "thienantv", "nickname": "😂 Thiên An TV", "region": "VN"},
        {"username": "amee_official", "nickname": "🎵 AMEE", "region": "VN"},
        {"username": "sontungmtp_official", "nickname": "🎤 Sơn Tùng M-TP", "region": "VN"},
        {"username": "hieuthuhai_", "nickname": "🎧 HIEUTHUHAI", "region": "VN"},
        {"username": "mck.99", "nickname": "🔥 MCK", "region": "VN"},
        {"username": "tranducbo", "nickname": "😄 Trần Đức Bo", "region": "VN"},
        {"username": "call.me.duy", "nickname": "🎭 Call Me Duy", "region": "VN"},
        {"username": "mai_ngok", "nickname": "💕 Mai Ngok", "region": "VN"},
        {"username": "thanhtrungdam", "nickname": "🎤 Đàm Thanh Trung", "region": "VN"},
    ]
