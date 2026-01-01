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
    limit: int = Query(10, description="Max videos to fetch", ge=1, le=60)
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
    limit: int = Query(20, description="Max videos to fetch", ge=1, le=60),
    cursor: int = Query(0, description="Pagination cursor (offset)")
):
    """
    Search for videos by keyword or hashtag.
    Uses Playwright to crawl TikTok search results for reliable data.
    """
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Searching for: {query} (limit={limit}, cursor={cursor})...")
    
    try:
        videos = await PlaywrightManager.search_videos(query, cookies, user_agent, limit, cursor)
        return {"query": query, "videos": videos, "count": len(videos), "cursor": cursor + len(videos)}
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
        
        if accounts and len(accounts) >= 5:  # Need at least 5 accounts from dynamic fetch
            _suggested_cache["accounts"] = accounts
            _suggested_cache["updated_at"] = time.time()
            return {"accounts": accounts[:limit], "cached": False}
        else:
            # Fallback: fetch actual profile data with avatars for static list
            print("Dynamic fetch failed, fetching profile data for static accounts...")
            fallback_list = get_fallback_accounts()[:min(limit, 20)]  # Limit to 20 for speed
            return await fetch_profiles_with_avatars(fallback_list, cookies, user_agent)
            
    except Exception as e:
        print(f"Error fetching suggested accounts: {e}")
        return {"accounts": get_fallback_accounts()[:limit], "cached": False, "fallback": True}


async def fetch_profiles_with_avatars(accounts: list, cookies: list, user_agent: str) -> dict:
    """Fetch actual profile data with avatars for a list of accounts."""
    
    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    
    headers = {
        "User-Agent": user_agent or PlaywrightManager.DEFAULT_USER_AGENT,
        "Referer": "https://www.tiktok.com/",
        "Cookie": cookie_str,
        "Accept": "application/json",
    }
    
    enriched = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for acc in accounts:
            try:
                url = f"https://www.tiktok.com/api/user/detail/?uniqueId={acc['username']}"
                res = await client.get(url, headers=headers)
                
                if res.status_code == 200:
                    data = res.json()
                    user = data.get("userInfo", {}).get("user", {})
                    stats = data.get("userInfo", {}).get("stats", {})
                    
                    if user:
                        enriched.append({
                            "username": acc["username"],
                            "nickname": user.get("nickname") or acc.get("nickname", acc["username"]),
                            "avatar": user.get("avatarThumb") or user.get("avatarMedium"),
                            "followers": stats.get("followerCount", 0),
                            "verified": user.get("verified", False),
                            "region": "VN"
                        })
                        continue
                        
            except Exception as e:
                print(f"Error fetching profile for {acc['username']}: {e}")
            
            # Fallback: use original data without avatar
            enriched.append(acc)
    
    return {"accounts": enriched, "cached": False, "enriched": True}


def get_fallback_accounts():
    """Static fallback list of popular Vietnamese TikTokers (verified usernames)."""
    return [
        # Verified Vietnamese TikTok accounts
        {"username": "cciinnn", "nickname": "👑 CiiN (Bùi Thảo Ly)", "region": "VN"},
        {"username": "hoaa.hanassii", "nickname": "💃 Hoa Hanassii", "region": "VN"},
        {"username": "lebong95", "nickname": "💪 Lê Bống", "region": "VN"},
        {"username": "tieu_hy26", "nickname": "👰 Tiểu Hý", "region": "VN"},
        {"username": "hieuthuhai2222", "nickname": "🎧 HIEUTHUHAI", "region": "VN"},
        {"username": "mtp.fan", "nickname": "🎤 Sơn Tùng M-TP", "region": "VN"},
        {"username": "changmakeup", "nickname": "💄 Changmakeup", "region": "VN"},
        {"username": "theanh28entertainment", "nickname": "🎬 Theanh28", "region": "VN"},
        {"username": "linhbarbie", "nickname": "👗 Linh Barbie", "region": "VN"},
        {"username": "phuonglykchau", "nickname": "✨ Phương Ly", "region": "VN"},
        {"username": "phimtieutrang", "nickname": "📺 Tiểu Trang", "region": "VN"},
        {"username": "nhunguyendy", "nickname": "💕 Như Nguyễn", "region": "VN"},
        {"username": "trucnhantv", "nickname": "🎤 Trúc Nhân", "region": "VN"},
        {"username": "justvietanh", "nickname": "😄 Just Việt Anh", "region": "VN"},
        {"username": "minngu.official", "nickname": "🌸 Min NGU", "region": "VN"},
        {"username": "quangdangofficial", "nickname": "🕺 Quang Đăng", "region": "VN"},
        {"username": "minhhangofficial", "nickname": "👑 Minh Hằng", "region": "VN"},
        {"username": "dungntt", "nickname": "🎭 Dũng NTT", "region": "VN"},
        {"username": "chipu88", "nickname": "🎤 Chi Pu", "region": "VN"},
        {"username": "kaydinh", "nickname": "🎵 Kay Dinh", "region": "VN"},
    ]
