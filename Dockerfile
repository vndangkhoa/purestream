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
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    gnupg \
    ca-certificates \
    ffmpeg \
    # VNC & Display dependencies
    tigervnc-standalone-server \
    tigervnc-common \
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
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC
RUN mkdir -p /opt/novnc \
    && wget -qO- https://github.com/novnc/noVNC/archive/v1.4.0.tar.gz | tar xz -C /opt/novnc --strip-components=1 \
    && mkdir -p /opt/novnc/utils/websockify \
    && wget -qO- https://github.com/novnc/websockify/archive/v0.11.0.tar.gz | tar xz -C /opt/novnc/utils/websockify --strip-components=1 \
    && ln -s /opt/novnc/vnc.html /opt/novnc/index.html

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

# Set working directory to backend for correct imports
WORKDIR /app/backend

# Expose ports (8002 = app, 6080 = noVNC)
EXPOSE 8002 6080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
