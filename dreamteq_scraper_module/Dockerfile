FROM python:3.12-slim

LABEL maintainer="Dreamteam Consulting Company <dreamteamconsult@gmx.com>"
LABEL description="DreamTeQ_360 Firecrawl Scraper Microservice"

WORKDIR /app

# Install system dependencies for psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Run with uvicorn — single worker for free-tier, scale via replicas
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
