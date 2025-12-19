# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM python:3.11-slim

# Install system dependencies
# Combined list for Playwright, KasmVNC, and general utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    gnupg \
    ca-certificates \
    ffmpeg \
    openbox \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    fonts-liberation \
    # KasmVNC dependencies
    libjpeg62-turbo \
    libpng16-16 \
    libx11-6 \
    libxcursor1 \
    libxext6 \
    libxi6 \
    libxinerama1 \
    libxrender1 \
    libxtst6 \
    zlib1g \
    libssl3 \
    adduser \
    libfontconfig1 \
    libgl1 \
    libpixman-1-0 \
    libxfont2 \
    libxkbfile1 \
    libdatetime-perl \
    libwww-perl \
    xfonts-base \
    xfonts-75dpi \
    xfonts-100dpi \
    python3-yaml \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install KasmVNC (Debian Bookworm)
RUN wget -q https://github.com/kasmtech/KasmVNC/releases/download/v1.3.1/kasmvncserver_bookworm_1.3.1_amd64.deb -O /tmp/kasmvnc.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends /tmp/kasmvnc.deb \
    && rm /tmp/kasmvnc.deb \
    && rm -rf /var/lib/apt/lists/*

# Setup KasmVNC user
# KasmVNC requires a non-root user for security best practices, but we run as root in this simple container.
# We will run vncserver as root (not recommended but easiest for migration) or create a user.
# Let's try running as root first with specific flags.

WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Install Playwright browsers
RUN mkdir -p /root/.cache/ms-playwright && \
    for i in 1 2 3; do \
    playwright install chromium && break || \
    (echo "Retry $i..." && rm -rf /root/.cache/ms-playwright/__dirlock && sleep 5); \
    done

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create cache directory
RUN mkdir -p /app/cache && chmod 777 /app/cache

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV CACHE_DIR=/app/cache
ENV DISPLAY=:99
# KasmVNC envs
ENV KASM_VNC_ARGS="-httpport 6080 -FrameRate 60 -sslOnly 0"

# Set working directory to backend for correct imports
WORKDIR /app/backend

# Expose ports (8002 = app, 6080 = KasmVNC)
EXPOSE 8002 6080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
