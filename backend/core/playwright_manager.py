"""
PlaywrightManager - Core class for TikTok network interception.

Uses Playwright to:
1. Parse cookies from JSON format
2. Handle browser-based SSL login
3. Intercept /item_list API responses (instead of scraping HTML)
"""

import asyncio
import json
import os
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Response, Browser, BrowserContext


COOKIES_FILE = "cookies.json"
USER_AGENT_FILE = "user_agent.json"


class PlaywrightManager:
    """Manages Playwright browser for TikTok feed interception."""
    
    # Anti-detection browser args
    BROWSER_ARGS = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--start-maximized",
    ]
    
    DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    # VNC login state (class-level to persist across requests)
    _vnc_playwright = None
    _vnc_browser = None
    _vnc_context = None
    _vnc_page = None
    _vnc_active = False

    @staticmethod
    def parse_json_credentials(json_creds: dict) -> tuple[List[dict], str]:
        """
        Parse JSON credentials in the format:
        {
            "http": {
                "headers": {"User-Agent": "...", "Cookie": "..."},
                "cookies": {"sessionid": "...", "ttwid": "..."}
            }
        }
        
        Returns: (cookies_list, user_agent)
        """
        cookies = []
        user_agent = PlaywrightManager.DEFAULT_USER_AGENT
        
        http_data = json_creds.get("http", {})
        headers = http_data.get("headers", {})
        cookies_dict = http_data.get("cookies", {})
        
        # Get User-Agent from headers
        if "User-Agent" in headers:
            user_agent = headers["User-Agent"]
        
        # Parse cookies from the cookies dict (preferred)
        if cookies_dict:
            for name, value in cookies_dict.items():
                cookies.append({
                    "name": name,
                    "value": str(value),
                    "domain": ".tiktok.com",
                    "path": "/"
                })
        # Fallback: parse from Cookie header string
        elif "Cookie" in headers:
            cookie_str = headers["Cookie"]
            for part in cookie_str.split(";"):
                part = part.strip()
                if "=" in part:
                    name, value = part.split("=", 1)
                    cookies.append({
                        "name": name.strip(),
                        "value": value.strip(),
                        "domain": ".tiktok.com",
                        "path": "/"
                    })
        
        return cookies, user_agent

    @staticmethod
    def load_stored_credentials() -> tuple[List[dict], str]:
        """Load cookies and user agent from stored files."""
        cookies = []
        user_agent = PlaywrightManager.DEFAULT_USER_AGENT
        
        if os.path.exists(COOKIES_FILE):
            try:
                with open(COOKIES_FILE, "r") as f:
                    cookie_dict = json.load(f)
                    for name, value in cookie_dict.items():
                        cookies.append({
                            "name": name,
                            "value": str(value),
                            "domain": ".tiktok.com",
                            "path": "/"
                        })
            except Exception as e:
                print(f"Error loading cookies: {e}")
        
        if os.path.exists(USER_AGENT_FILE):
            try:
                with open(USER_AGENT_FILE, "r") as f:
                    data = json.load(f)
                    user_agent = data.get("user_agent", user_agent)
            except:
                pass
        
        return cookies, user_agent

    @staticmethod
    def save_credentials(cookies: dict, user_agent: str):
        """Save cookies and user agent to files."""
        with open(COOKIES_FILE, "w") as f:
            json.dump(cookies, f, indent=2)
        
        with open(USER_AGENT_FILE, "w") as f:
            json.dump({"user_agent": user_agent}, f)

    @classmethod
    async def start_vnc_login(cls) -> dict:
        """
        Start a visible browser for VNC login.
        The browser displays on DISPLAY=:99 which is streamed via noVNC.
        Returns immediately - browser stays open for user interaction.
        """
        # Close any existing VNC session
        if cls._vnc_active:
            await cls.stop_vnc_login()
        
        print("DEBUG: Starting VNC login browser...")
        
        try:
            cls._vnc_playwright = await async_playwright().start()
            cls._vnc_browser = await cls._vnc_playwright.chromium.launch(
                headless=False,  # Visible browser
                args=cls.BROWSER_ARGS
            )
            
            cls._vnc_context = await cls._vnc_browser.new_context(
                user_agent=cls.DEFAULT_USER_AGENT,
                viewport={"width": 1920, "height": 1000}
            )
            
            cls._vnc_page = await cls._vnc_context.new_page()
            await cls._vnc_page.goto("https://www.tiktok.com/login", wait_until="domcontentloaded")
            
            cls._vnc_active = True
            print("DEBUG: VNC browser opened with TikTok login page")
            
            return {
                "status": "started",
                "message": "Browser opened. Please login via the VNC stream."
            }
            
        except Exception as e:
            print(f"DEBUG: VNC login start error: {e}")
            cls._vnc_active = False
            return {
                "status": "error",
                "message": f"Failed to start browser: {str(e)}"
            }

    @classmethod
    async def check_vnc_login(cls) -> dict:
        """
        Check if user has logged in by looking for sessionid cookie.
        Called by frontend via polling.
        """
        if not cls._vnc_active or not cls._vnc_context:
            return {"status": "not_active", "logged_in": False}
        
        try:
            all_cookies = await cls._vnc_context.cookies()
            cookies_found = {}
            
            for cookie in all_cookies:
                if cookie.get("domain", "").endswith("tiktok.com"):
                    cookies_found[cookie["name"]] = cookie["value"]
            
            if "sessionid" in cookies_found:
                # Save cookies and close browser
                cls.save_credentials(cookies_found, cls.DEFAULT_USER_AGENT)
                await cls.stop_vnc_login()
                
                return {
                    "status": "success",
                    "logged_in": True,
                    "message": "Login successful!",
                    "cookie_count": len(cookies_found)
                }
            
            return {"status": "waiting", "logged_in": False}
            
        except Exception as e:
            print(f"DEBUG: VNC check error: {e}")
            return {"status": "error", "logged_in": False, "message": str(e)}

    @classmethod
    async def stop_vnc_login(cls) -> dict:
        """Close the VNC browser session."""
        print("DEBUG: Stopping VNC login browser...")
        
        try:
            if cls._vnc_browser:
                await cls._vnc_browser.close()
            if cls._vnc_playwright:
                await cls._vnc_playwright.stop()
        except Exception as e:
            print(f"DEBUG: Error closing VNC browser: {e}")
        
        cls._vnc_browser = None
        cls._vnc_context = None
        cls._vnc_page = None
        cls._vnc_playwright = None
        cls._vnc_active = False
        
        return {"status": "stopped"}

    @staticmethod
    async def credential_login(username: str, password: str, timeout_seconds: int = 60) -> dict:
        """
        Headless login using username/password.
        Works on Docker/NAS deployments without a display.
        
        Args:
            username: TikTok username, email, or phone
            password: TikTok password
            timeout_seconds: Max time to wait for login
            
        Returns: {"status": "success/error", "message": "...", "cookie_count": N}
        """
        print(f"DEBUG: Starting headless credential login for: {username}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=PlaywrightManager.BROWSER_ARGS
            )
            
            context = await browser.new_context(
                user_agent=PlaywrightManager.DEFAULT_USER_AGENT
            )
            
            page = await context.new_page()
            
            try:
                # Navigate to TikTok login page
                await page.goto("https://www.tiktok.com/login/phone-or-email/email", wait_until="domcontentloaded")
                await asyncio.sleep(2)
                
                print("DEBUG: Looking for login form...")
                
                # Wait for and fill username/email field
                username_selector = 'input[name="username"], input[placeholder*="Email"], input[placeholder*="email"], input[type="text"]'
                await page.wait_for_selector(username_selector, timeout=10000)
                await page.fill(username_selector, username)
                await asyncio.sleep(0.5)
                
                # Fill password field
                password_selector = 'input[type="password"]'
                await page.wait_for_selector(password_selector, timeout=5000)
                await page.fill(password_selector, password)
                await asyncio.sleep(0.5)
                
                print("DEBUG: Credentials filled, clicking login...")
                
                # Click login button
                login_button = 'button[type="submit"], button[data-e2e="login-button"]'
                await page.click(login_button)
                
                # Wait for login to complete - poll for sessionid cookie
                print("DEBUG: Waiting for login to complete...")
                elapsed = 0
                check_interval = 2
                cookies_found = {}
                
                while elapsed < timeout_seconds:
                    await asyncio.sleep(check_interval)
                    elapsed += check_interval
                    
                    # Check for error messages
                    error_el = await page.query_selector('[class*="error"], [class*="Error"]')
                    if error_el:
                        error_text = await error_el.inner_text()
                        if error_text and len(error_text) > 0:
                            await browser.close()
                            return {
                                "status": "error",
                                "message": f"Login failed: {error_text[:100]}",
                                "cookie_count": 0
                            }
                    
                    # Check cookies
                    all_cookies = await context.cookies()
                    for cookie in all_cookies:
                        if cookie.get("domain", "").endswith("tiktok.com"):
                            cookies_found[cookie["name"]] = cookie["value"]
                    
                    if "sessionid" in cookies_found:
                        print(f"DEBUG: Login successful! Found {len(cookies_found)} cookies.")
                        break
                    
                    # Check if CAPTCHA or verification needed
                    captcha = await page.query_selector('[class*="captcha"], [class*="Captcha"], [class*="verify"]')
                    if captcha:
                        await browser.close()
                        return {
                            "status": "error",
                            "message": "TikTok requires verification (CAPTCHA). Please try the cookie method.",
                            "cookie_count": 0
                        }
                    
                    print(f"DEBUG: Waiting for login... ({elapsed}s)")
                
                await browser.close()
                
                if "sessionid" not in cookies_found:
                    return {
                        "status": "error",
                        "message": "Login timed out. Check your credentials or try the cookie method.",
                        "cookie_count": 0
                    }
                
                # Save credentials
                PlaywrightManager.save_credentials(cookies_found, PlaywrightManager.DEFAULT_USER_AGENT)
                
                return {
                    "status": "success",
                    "message": "Successfully logged in!",
                    "cookie_count": len(cookies_found)
                }
                
            except Exception as e:
                await browser.close()
                print(f"DEBUG: Login error: {e}")
                return {
                    "status": "error",
                    "message": f"Login failed: {str(e)[:100]}",
                    "cookie_count": 0
                }

    @staticmethod
    async def browser_login(timeout_seconds: int = 180) -> dict:
        """
        Open visible browser for user to login via TikTok's SSL login.
        Waits for sessionid cookie to be set.
        
        Returns: {"status": "success/timeout", "cookies": {...}, "cookie_count": N}
        """
        print("DEBUG: Opening browser for TikTok login...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                args=PlaywrightManager.BROWSER_ARGS
            )
            
            context = await browser.new_context(
                user_agent=PlaywrightManager.DEFAULT_USER_AGENT
            )
            
            page = await context.new_page()
            
            # Navigate to TikTok login
            await page.goto("https://www.tiktok.com/login", wait_until="domcontentloaded")
            print("DEBUG: Login page opened. Waiting for user to complete login...")
            
            # Poll for sessionid cookie
            elapsed = 0
            check_interval = 2
            cookies_found = {}
            
            while elapsed < timeout_seconds:
                await asyncio.sleep(check_interval)
                elapsed += check_interval
                
                all_cookies = await context.cookies()
                
                for cookie in all_cookies:
                    if cookie.get("domain", "").endswith("tiktok.com"):
                        cookies_found[cookie["name"]] = cookie["value"]
                
                if "sessionid" in cookies_found:
                    print(f"DEBUG: Login detected! Found {len(cookies_found)} cookies.")
                    break
                
                print(f"DEBUG: Waiting for login... ({elapsed}s)")
            
            await browser.close()
            
            if "sessionid" not in cookies_found:
                return {
                    "status": "timeout",
                    "message": "Login timed out. Please try again.",
                    "cookie_count": 0
                }
            
            # Save credentials
            PlaywrightManager.save_credentials(cookies_found, PlaywrightManager.DEFAULT_USER_AGENT)
            
            return {
                "status": "success",
                "message": "Successfully connected to TikTok!",
                "cookie_count": len(cookies_found)
            }

    @staticmethod
    async def intercept_feed(cookies: List[dict] = None, user_agent: str = None, scroll_count: int = 5) -> List[dict]:
        """
        Navigate to TikTok For You page and intercept the /item_list API response.
        
        Args:
            cookies: Optional list of cookies
            user_agent: Optional user agent
            scroll_count: Number of times to scroll to fetch more videos (0 = initial load only)

        Returns: List of video objects
        """
        if not cookies:
            cookies, user_agent = PlaywrightManager.load_stored_credentials()
        
        if not user_agent:
            user_agent = PlaywrightManager.DEFAULT_USER_AGENT
        
        if not cookies:
            print("DEBUG: No cookies available")
            return []
        
        print(f"DEBUG: Starting network interception with {len(cookies)} cookies (scrolls={scroll_count})")
        
        captured_videos = []
        
        async def handle_response(response: Response):
            """Capture /item_list API responses."""
            nonlocal captured_videos
            
            url = response.url
            
            # Look for TikTok's feed API
            if "item_list" in url or "recommend/item" in url:
                try:
                    data = await response.json()
                    
                    # TikTok returns videos in "itemList" or "aweme_list"
                    items = data.get("itemList", []) or data.get("aweme_list", [])
                    
                    for item in items:
                        video_data = PlaywrightManager._extract_video_data(item)
                        if video_data:
                            captured_videos.append(video_data)
                    
                    print(f"DEBUG: Captured {len(items)} videos from API")
                    
                except Exception as e:
                    print(f"DEBUG: Error parsing API response: {e}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=PlaywrightManager.BROWSER_ARGS
            )
            
            context = await browser.new_context(user_agent=user_agent)
            await context.add_cookies(cookies)
            
            page = await context.new_page()
            
            # Set up response listener
            page.on("response", handle_response)
            
            try:
                # Navigate to For You page
                await page.goto(
                    "https://www.tiktok.com/foryou",
                    wait_until="domcontentloaded",
                    timeout=30000
                )
                
                # Wait for initial load - ensure we capture at least one batch
                # Poll for videos if in fast mode
                for _ in range(10): # Max 10 seconds wait
                    if len(captured_videos) > 0:
                        break
                    await asyncio.sleep(1)
                
                # If still no videos, maybe scroll once to trigger
                if len(captured_videos) == 0:
                    print("DEBUG: No videos after initial load, scrolling once...")
                    await page.evaluate("window.scrollBy(0, 800)")
                    await asyncio.sleep(2)
                
                # Scroll loop
                for i in range(scroll_count):
                    await page.evaluate("window.scrollBy(0, 800)")
                    await asyncio.sleep(1)
                
                # Give time for API responses to be captured
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"DEBUG: Navigation error: {e}")
            
            await browser.close()
        
        print(f"DEBUG: Total captured videos: {len(captured_videos)}")
        return captured_videos

    @staticmethod
    def _extract_video_data(item: dict) -> Optional[dict]:
        """Extract video data from TikTok API item."""
        try:
            # Handle different API response formats
            video_id = item.get("id") or item.get("aweme_id")
            
            # Get author info
            author_data = item.get("author", {})
            author = author_data.get("uniqueId") or author_data.get("unique_id") or "unknown"
            
            # Get description
            desc = item.get("desc") or item.get("description") or ""
            
            # Get thumbnail/cover image
            thumbnail = None
            video_data = item.get("video", {})
            
            # Try different thumbnail sources
            if video_data.get("cover"):
                thumbnail = video_data["cover"]
            elif video_data.get("dynamicCover"):
                thumbnail = video_data["dynamicCover"]
            elif video_data.get("originCover"):
                thumbnail = video_data["originCover"]
            
            # Get direct CDN URL (for thin proxy mode)
            cdn_url = None
            if video_data.get("playAddr"):
                cdn_url = video_data["playAddr"]
            elif video_data.get("downloadAddr"):
                cdn_url = video_data["downloadAddr"]
            elif video_data.get("play_addr", {}).get("url_list"):
                cdn_url = video_data["play_addr"]["url_list"][0]
            
            # Use TikTok page URL as fallback (yt-dlp resolves this)
            video_url = f"https://www.tiktok.com/@{author}/video/{video_id}"
            
            # Get stats (views, likes)
            stats = item.get("stats", {}) or item.get("statistics", {})
            views = stats.get("playCount") or stats.get("play_count") or 0
            likes = stats.get("diggCount") or stats.get("digg_count") or 0
            
            if video_id and author:
                result = {
                    "id": str(video_id),
                    "url": video_url,
                    "author": author,
                    "description": desc[:200] if desc else f"Video by @{author}"
                }
                if thumbnail:
                    result["thumbnail"] = thumbnail
                if cdn_url:
                    result["cdn_url"] = cdn_url  # Direct CDN URL for thin proxy
                if views:
                    result["views"] = views
                if likes:
                    result["likes"] = likes
                return result
        
        except Exception as e:
            print(f"DEBUG: Error extracting video data: {e}")
        
        return None

    @staticmethod
    async def fetch_user_videos(username: str, cookies: list, user_agent: str = None, limit: int = 10) -> list:
        """
        Fetch videos from a specific user's profile page.
        Uses Playwright to intercept the user's video list API.
        """
        from playwright.async_api import async_playwright, Response
        
        if not user_agent:
            user_agent = PlaywrightManager.DEFAULT_USER_AGENT
        
        if not cookies:
            print("DEBUG: No cookies available for user videos")
            return []
        
        print(f"DEBUG: Fetching videos for @{username}...")
        
        captured_videos = []
        
        async def handle_response(response: Response):
            """Capture user's video list API responses."""
            nonlocal captured_videos
            
            url = response.url
            
            # Look for user's video list API
            if "item_list" in url or "post/item_list" in url:
                try:
                    data = await response.json()
                    
                    items = data.get("itemList", []) or data.get("aweme_list", [])
                    
                    for item in items:
                        if len(captured_videos) >= limit:
                            break
                        video_data = PlaywrightManager._extract_video_data(item)
                        if video_data:
                            captured_videos.append(video_data)
                    
                    print(f"DEBUG: Captured {len(items)} videos from user API")
                    
                except Exception as e:
                    print(f"DEBUG: Error parsing user API response: {e}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=PlaywrightManager.BROWSER_ARGS
            )
            
            context = await browser.new_context(user_agent=user_agent)
            await context.add_cookies(cookies)
            
            page = await context.new_page()
            page.on("response", handle_response)
            
            try:
                # Navigate to user's profile page
                profile_url = f"https://www.tiktok.com/@{username}"
                await page.goto(profile_url, wait_until="networkidle", timeout=30000)
                
                # Wait for videos to load
                await asyncio.sleep(2)
                
                # Scroll a bit to trigger more video loading
                await page.evaluate("window.scrollBy(0, 500)")
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"DEBUG: Error navigating to profile: {e}")
            
            await browser.close()
        
        print(f"DEBUG: Total captured user videos: {len(captured_videos)}")
        return captured_videos

    @staticmethod
    async def search_videos(query: str, cookies: list, user_agent: str = None, limit: int = 12) -> list:
        """
        Search for videos by keyword or hashtag.
        Uses Playwright to intercept TikTok search results API.
        """
        from playwright.async_api import async_playwright, Response
        from urllib.parse import quote
        
        if not user_agent:
            user_agent = PlaywrightManager.DEFAULT_USER_AGENT
        
        if not cookies:
            print("DEBUG: No cookies available for search")
            return []
        
        print(f"DEBUG: Searching for '{query}'...")
        
        captured_videos = []
        
        async def handle_response(response: Response):
            """Capture search results API responses."""
            nonlocal captured_videos
            
            url = response.url
            
            # Look for search results API
            if "search" in url and ("item_list" in url or "video" in url or "general" in url):
                try:
                    data = await response.json()
                    
                    # Try different response formats
                    items = data.get("itemList", []) or data.get("data", []) or data.get("item_list", [])
                    
                    for item in items:
                        if len(captured_videos) >= limit:
                            break
                        video_data = PlaywrightManager._extract_video_data(item)
                        if video_data:
                            captured_videos.append(video_data)
                    
                    print(f"DEBUG: Captured {len(items)} videos from search API")
                    
                except Exception as e:
                    print(f"DEBUG: Error parsing search API response: {e}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=PlaywrightManager.BROWSER_ARGS
            )
            
            context = await browser.new_context(user_agent=user_agent)
            await context.add_cookies(cookies)
            
            page = await context.new_page()
            page.on("response", handle_response)
            
            try:
                # Navigate to TikTok search page
                search_url = f"https://www.tiktok.com/search/video?q={quote(query)}"
                await page.goto(search_url, wait_until="networkidle", timeout=30000)
                
                # Wait for videos to load
                await asyncio.sleep(3)
                
                # Scroll to trigger more loading
                for _ in range(2):
                    await page.evaluate("window.scrollBy(0, 800)")
                    await asyncio.sleep(1)
                
            except Exception as e:
                print(f"DEBUG: Error during search: {e}")
            
            await browser.close()
        
        print(f"DEBUG: Total captured search videos: {len(captured_videos)}")
        return captured_videos


# Singleton instance
playwright_manager = PlaywrightManager()
