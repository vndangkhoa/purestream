# 🎵 PureStream

**Distraction-free TikTok viewing** - A clean, ad-free TikTok client with a beautiful minimal interface.

![PureStream Demo](https://img.shields.io/badge/Platform-Web-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🎬 **Clean Video Feed** - No ads, no distractions, just content
- 🔍 **Powerful Search** - Search by username, video URL, or keywords
- 👥 **Follow System** - Keep track of your favorite creators
- 💾 **Tab Persistence** - Switch tabs without losing your place
- 👆 **Swipe Navigation** - Swipe left/right to switch tabs (mobile)
- ⌨️ **Keyboard Controls** - Arrow keys for tabs, Space for pause, Up/Down for scroll
- ❤️ **Heart Animations** - Double-tap to show love
- 🔇 **Smart Autoplay** - Videos autoplay muted (tap to unmute)
- 📱 **Responsive Design** - Works on desktop and mobile
- 🐳 **Docker Ready** - Easy deployment on any platform

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to run PureStream on your server or Synology NAS.

```bash
# Create a directory
mkdir purestream && cd purestream

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/purestream/main/docker-compose.yml

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the app at: `http://your-server-ip:8002`

### Option 2: Docker Run

```bash
docker run -d \
  --name purestream \
  -p 8002:8002 \
  --shm-size=2g \
  -v purestream_cache:/app/cache \
  -v purestream_session:/app/backend/session \
  vndangkhoa/purestream:latest
```

### Option 3: Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/purestream.git
cd purestream

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
playwright install chromium

# Start backend
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## 🖥️ Synology NAS Deployment

### Using Container Manager (Docker)

1. **Open Container Manager** → **Registry**
2. Search for `vndangkhoa/purestream` and download the `latest` tag
3. Go to **Container** → **Create**
4. Configure:
   - **Port Settings**: Local `8002` → Container `8002`
   - **Volume**: Create a folder for cache and map to `/app/cache`
   - **Environment**: Add `PYTHONUNBUFFERED=1`
   - **Resources**: Allocate at least 2GB RAM (for browser)
5. **Apply** and start the container

### Using docker-compose on Synology

```bash
# SSH into your NAS
ssh admin@your-nas-ip

# Create directory
mkdir -p /volume1/docker/purestream
cd /volume1/docker/purestream

# Create docker-compose.yml (paste the content from this repo)
nano docker-compose.yml

# Start
docker-compose up -d
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Switch tabs |
| `↑` `↓` | Scroll videos |
| `Space` | Play/Pause |
| `M` | Mute/Unmute |

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_DIR` | `/app/cache` | Video cache directory |
| `MAX_CACHE_SIZE_MB` | `500` | Maximum cache size in MB |
| `CACHE_TTL_HOURS` | `24` | Cache expiration time |

## 📁 Project Structure

```
purestream/
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py      # Authentication endpoints
│   │       └── feed.py      # Feed & video proxy endpoints
│   ├── core/
│   │   └── playwright_manager.py  # Browser automation
│   └── main.py              # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Feed.tsx     # Main feed component
│   │   │   └── VideoPlayer.tsx  # Video player
│   │   └── App.tsx
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔐 Authentication (Admin Setup)

PureStream uses your TikTok session cookies. Once configured by the admin, **all users can access the feed without logging in** - on desktop or mobile.

> **Important**: Admin setup should be done from a **desktop/laptop computer** (not a phone) because you need a browser extension to export cookies.

### First-Time Setup (Desktop Required)

1. **Set your admin password** in `docker-compose.yml`:
   ```yaml
   environment:
     - ADMIN_PASSWORD=your_secure_password
   ```

2. **Start/restart the container**:
   ```bash
   docker-compose up -d --force-recreate
   ```

3. **Access the admin page**: `http://your-server-ip:8002/admin`
   - Enter your admin password (default: `admin123`)

4. **Get your TikTok cookies** (from a desktop browser):
   - Install [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) browser extension
   - Go to [tiktok.com](https://www.tiktok.com) and login to your account
   - Click Cookie-Editor icon → **Export** → **Copy**

5. **Paste cookies** in the admin page text area and click **Save Cookies**

6. ✅ **Done!** Now anyone can access `http://your-server-ip:8002/` on any device (including phones)

### For Mobile Users

Regular users don't need to do anything - just open the app URL in their phone browser. The admin (you) configures cookies once, and everyone benefits.

> If you only have a phone: On Android, use **Kiwi Browser** which supports Chrome extensions. On iOS, you'll need access to a desktop computer.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | `admin123` | Password for `/admin` page |
| `CACHE_DIR` | `/app/cache` | Video cache directory |
| `MAX_CACHE_SIZE_MB` | `500` | Maximum cache size |
| `CACHE_TTL_HOURS` | `24` | Cache expiration |

> **Security Note**: Cookies are stored locally in the `session/` volume. Anyone with the admin password can view/update them.


## 🐛 Troubleshooting

### Videos not loading?
- Check if the backend is running: `curl http://localhost:8002/health`
- Check logs: `docker-compose logs -f`
- Try re-logging in (sessions can expire)

### Browser errors on headless server?
- Ensure `shm_size: '2gb'` is set in docker-compose
- Xvfb is included in the Docker image for virtual display

### Cache issues?
- Clear cache: `docker exec purestream rm -rf /app/cache/*`
- Restart container: `docker-compose restart`

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) & [React](https://react.dev/)
- Browser automation by [Playwright](https://playwright.dev/)
- Video extraction by [yt-dlp](https://github.com/yt-dlp/yt-dlp)

---

**Made with ❤️ for distraction-free viewing**
