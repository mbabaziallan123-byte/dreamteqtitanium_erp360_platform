"""
DreamTeQ_360 Firecrawl Scraper Module — Application Settings
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

All secrets are read from environment variables or a local .env file.
NEVER commit real values — use .env (git-ignored) or the Vercel vault.

Required environment variables:
  FIRECRAWL_API_KEY     — Firecrawl v2 API key (fc-...)
  GEMINI_API_KEY        — Google Gemini Pro API key
  DATABASE_URL          — PostgreSQL DSN (postgresql://user:pass@host:port/db)
  REDIS_URL             — Redis DSN (redis://host:port/db)
  MQTT_BROKER_HOST      — MQTT broker hostname only (no protocol prefix)
  MQTT_BROKER_PORT      — MQTT broker port (default 1883)
  MQTT_TOPIC_PREFIX     — MQTT topic namespace (default dreamteq/farm)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ModuleSettings(BaseSettings):
    # ── API credentials (no defaults — must be set in environment) ──────────
    FIRECRAWL_API_KEY: str
    GEMINI_API_KEY: str

    # ── Infrastructure connection coordinates ────────────────────────────────
    # DATABASE_URL format: postgresql://user:password@host:port/dbname
    DATABASE_URL: str
    # REDIS_URL format:    redis://host:port/db_index
    REDIS_URL: str = "redis://redis-cache:6379/0"

    # ── IoT MQTT telematics broker ───────────────────────────────────────────
    # Provide hostname ONLY — no protocol prefix (e.g. broker.hivemq.com)
    MQTT_BROKER_HOST: str = "broker.hivemq.com"
    MQTT_BROKER_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = "dreamteq/farm"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = ModuleSettings()
