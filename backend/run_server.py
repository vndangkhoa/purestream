import sys
import os
import asyncio

# Fix sys.path for user site-packages where pip installed dependencies
user_site = os.path.expanduser("~\\AppData\\Roaming\\Python\\Python312\\site-packages")
if os.path.exists(user_site) and user_site not in sys.path:
    print(f"DEBUG: Adding user site-packages to path: {user_site}")
    sys.path.append(user_site)

# Enforce ProactorEventLoopPolicy for Playwright on Windows
# This is required for asyncio.create_subprocess_exec used by Playwright
if sys.platform == "win32":
    # Check if policy is already set
    current_policy = asyncio.get_event_loop_policy()
    if not isinstance(current_policy, asyncio.WindowsProactorEventLoopPolicy):
        print("DEBUG: Setting WindowsProactorEventLoopPolicy")
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    else:
        print("DEBUG: WindowsProactorEventLoopPolicy already active")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Bootstrapping Uvicorn with Proactor Loop (Reload Disabled)...")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=False, loop="asyncio")
