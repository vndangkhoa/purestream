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
    Uses Playwright to intercept the user's video list API.
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
    Uses Playwright to intercept TikTok search results.
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
