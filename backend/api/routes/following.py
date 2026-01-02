"""
Following API routes - manage followed creators.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json

router = APIRouter()

FOLLOWING_FILE = "following.json"


def load_following() -> list:
    """Load list of followed creators."""
    if os.path.exists(FOLLOWING_FILE):
        try:
            with open(FOLLOWING_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []


def save_following(following: list):
    """Save list of followed creators."""
    with open(FOLLOWING_FILE, 'w') as f:
        json.dump(following, f, indent=2)


class FollowRequest(BaseModel):
    username: str


@router.get("")
async def get_following():
    """Get list of followed creators."""
    return load_following()


@router.post("")
async def add_following(request: FollowRequest):
    """Add a creator to following list."""
    username = request.username.lstrip('@')
    following = load_following()
    
    if username not in following:
        following.append(username)
        save_following(following)
    
    return {"status": "success", "following": following}


@router.delete("/{username}")
async def remove_following(username: str):
    """Remove a creator from following list."""
    username = username.lstrip('@')
    following = load_following()
    
    if username in following:
        following.remove(username)
        save_following(following)
    
    return {"status": "success", "following": following}


@router.get("/feed")
async def get_following_feed(limit_per_user: int = 5):
    """
    Get a combined feed of videos from all followed creators.
    """
    from core.playwright_manager import PlaywrightManager
    import asyncio
    
    following = load_following()
    if not following:
        return []
    
    # Load stored credentials
    cookies, user_agent = PlaywrightManager.load_stored_credentials()
    
    if not cookies:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    tasks = [PlaywrightManager.fetch_user_videos(user, cookies, user_agent, limit_per_user) for user in following]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_videos = []
    for result in results:
        if isinstance(result, list):
            all_videos.extend(result)
    
    # Shuffle results to make it look like a feed
    import random
    random.shuffle(all_videos)
    
    return all_videos
