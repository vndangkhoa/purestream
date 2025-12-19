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
    Uses TikTok's internal API for fast results.
    """
    username = username.replace("@", "")
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Fetching videos for @{username}...")
    
    # Build cookie header
    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    
    headers = {
        "User-Agent": user_agent or PlaywrightManager.DEFAULT_USER_AGENT,
        "Referer": f"https://www.tiktok.com/@{username}",
        "Cookie": cookie_str,
        "Accept": "application/json",
    }
    
    try:
        # First get user's secUid from profile API
        profile_url = f"https://www.tiktok.com/api/user/detail/?uniqueId={username}"
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            profile_res = await client.get(profile_url, headers=headers)
            
            if profile_res.status_code != 200:
                print(f"Profile API returned {profile_res.status_code}")
                return {"username": username, "videos": [], "count": 0}
            
            profile_data = profile_res.json()
            user_info = profile_data.get("userInfo", {}).get("user", {})
            sec_uid = user_info.get("secUid", "")
            
            if not sec_uid:
                print(f"Could not get secUid for {username}")
                return {"username": username, "videos": [], "count": 0}
            
            # Fetch user's videos
            videos_url = f"https://www.tiktok.com/api/post/item_list/?secUid={sec_uid}&count={limit}&cursor=0"
            
            videos_res = await client.get(videos_url, headers=headers)
            
            videos = []
            
            if videos_res.status_code == 200:
                try:
                    data = videos_res.json()
                    items = data.get("itemList", [])
                    
                    for item in items[:limit]:
                        video_id = item.get("id", "")
                        author_info = item.get("author", {})
                        video_data = item.get("video", {})
                        
                        play_addr = video_data.get("playAddr") or video_data.get("downloadAddr", "")
                        
                        videos.append({
                            "id": video_id,
                            "url": f"https://www.tiktok.com/@{username}/video/{video_id}",
                            "cdn_url": play_addr,
                            "author": username,
                            "description": item.get("desc", ""),
                            "thumbnail": video_data.get("cover") or video_data.get("dynamicCover", ""),
                            "views": item.get("stats", {}).get("playCount", 0),
                            "likes": item.get("stats", {}).get("diggCount", 0),
                        })
                    
                    print(f"Found {len(videos)} videos for @{username}")
                    
                except Exception as parse_error:
                    print(f"Error parsing videos response: {parse_error}")
            else:
                print(f"Videos API returned status {videos_res.status_code}")
            
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
    Uses TikTok's internal search API for fast, reliable results.
    """
    from urllib.parse import quote
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Searching for: {query}...")
    
    # Build cookie header
    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
    
    headers = {
        "User-Agent": user_agent or PlaywrightManager.DEFAULT_USER_AGENT,
        "Referer": "https://www.tiktok.com/",
        "Cookie": cookie_str,
        "Accept": "application/json",
    }
    
    try:
        # TikTok search API endpoint
        search_url = f"https://www.tiktok.com/api/search/general/full/?keyword={quote(query)}&offset=0&search_id=&from_page=search&web_search_code=%7B%22tiktok%22%3A%7B%22client_params_x%22%3A%7B%22search_engine%22%3A%7B%22ies_mt_user_live_video_card_use_b%22%3A1%2C%22mt_search_general_user_live_card%22%3A1%7D%7D%2C%22search_server%22%3A%7B%7D%7D%7D"
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(search_url, headers=headers)
            
            videos = []
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    items = data.get("data", [])
                    
                    for item in items[:limit]:
                        # Extract video data from search result
                        item_type = item.get("type")
                        
                        # Type 1 = video
                        if item_type == 1:
                            video_item = item.get("item", {})
                            if video_item:
                                video_id = video_item.get("id", "")
                                author_info = video_item.get("author", {})
                                video_data = video_item.get("video", {})
                                
                                # Get playable URL
                                play_addr = video_data.get("playAddr") or video_data.get("downloadAddr", "")
                                
                                videos.append({
                                    "id": video_id,
                                    "url": f"https://www.tiktok.com/@{author_info.get('uniqueId', 'user')}/video/{video_id}",
                                    "cdn_url": play_addr,
                                    "author": author_info.get("uniqueId", "unknown"),
                                    "description": video_item.get("desc", ""),
                                    "thumbnail": video_data.get("cover") or video_data.get("dynamicCover", ""),
                                    "views": video_item.get("stats", {}).get("playCount", 0),
                                    "likes": video_item.get("stats", {}).get("diggCount", 0),
                                })
                    
                    print(f"Found {len(videos)} videos for '{query}'")
                    
                except Exception as parse_error:
                    print(f"Error parsing search response: {parse_error}")
            else:
                print(f"Search API returned status {response.status_code}")
            
            return {"query": query, "videos": videos, "count": len(videos)}
            
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

