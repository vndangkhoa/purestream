# Build Stage for Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Runtime Stage for Backend
FROM python:3.11-slim

# Install system dependencies required for Playwright and compiled extensions
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install Playwright browsers (Chromium only to save space)
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy Backend Code
COPY backend/ backend/

# Copy Built Frontend Assets
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose Port
EXPOSE 8002

# Run Application
CMD ["python", "backend/main.py"]
