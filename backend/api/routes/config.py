"""
Config API route - allows frontend to fetch settings from server.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import json
import os

router = APIRouter()

# Config file path
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "../../config.json")

# Default config
DEFAULT_CONFIG = {
    "proxy_mode": "auto",  # "thin" (faster, CDN), "full" (yt-dlp), or "auto" (prefer thin)
    "cache_enabled": True,
    "cache_max_mb": 500,
    "suggested_accounts": [
        {"username": "@ciin_rubi", "label": "👑 CiiN - Lisa of Vietnam"},
        {"username": "@hoaa.hanassii", "label": "💃 Đào Lê Phương Hoa - Queen of Wiggle"},
        {"username": "@hoa_2309", "label": "🔥 Ngô Ngọc Hòa - Hot Trend"},
        {"username": "@minah.ne", "label": "🎵 Minah - K-pop Dancer"},
        {"username": "@lebong95", "label": "💪 Lê Bống - Fitness Dance"},
        {"username": "@po.trann77", "label": "✨ Trần Thanh Tâm"},
        {"username": "@gamkami", "label": "🎱 Gấm Kami - Cute Style"},
        {"username": "@quynhalee", "label": "🎮 Quỳnh Alee - Gaming Dance"},
        {"username": "@tieu_hy26", "label": "👰 Tiểu Hý - National Wife"},
        {"username": "@changmie", "label": "🎤 Changmie - Singer/Mashups"},
        {"username": "@vuthuydien", "label": "😄 Vũ Thụy Điển - Humor"},
    ],
    "app_name": "PureStream",
    "version": "1.0.0"
}


def load_config() -> dict:
    """Load config from file or return default."""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Config load error: {e}")
    
    return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    """Save config to file."""
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Config save error: {e}")


@router.get("")
async def get_config():
    """Get app configuration for frontend."""
    return load_config()


class ConfigUpdate(BaseModel):
    """Config update request."""
    proxy_mode: Optional[str] = None
    cache_enabled: Optional[bool] = None
    cache_max_mb: Optional[int] = None
    suggested_accounts: Optional[List[dict]] = None


@router.patch("")
async def update_config(updates: ConfigUpdate):
    """Update specific config values."""
    config = load_config()
    
    if updates.proxy_mode is not None:
        config["proxy_mode"] = updates.proxy_mode
    if updates.cache_enabled is not None:
        config["cache_enabled"] = updates.cache_enabled
    if updates.cache_max_mb is not None:
        config["cache_max_mb"] = updates.cache_max_mb
    if updates.suggested_accounts is not None:
        config["suggested_accounts"] = updates.suggested_accounts
    
    save_config(config)
    return config
