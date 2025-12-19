# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production stage
FROM python:3.11-slim

# Install system dependencies for Playwright and yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    gnupg \
    ca-certificates \
    ffmpeg \
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
    xvfb \
    xauth \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Install Playwright browsers with retries
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

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV CACHE_DIR=/app/cache

# Set working directory to backend for correct imports
WORKDIR /app/backend

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Start the application with xvfb for headless browser support
CMD ["sh", "-c", "xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' python -m uvicorn main:app --host 0.0.0.0 --port 8002"]

