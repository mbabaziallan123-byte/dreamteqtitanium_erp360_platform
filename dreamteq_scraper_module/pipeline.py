"""
DreamTeQ_360 Firecrawl Scraper Module — Core Data Pipeline (Stages 1 & 2)
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Executes the low-level Firecrawl web extraction pipeline:
  Stage 1 — Fetch raw web page via Firecrawl scrape API
  Stage 2 — Convert to clean Markdown; cache in Redis for 12 h to preserve
             free-tier API credits

Redis caching key format: scrape:raw:<sha256(url)>
"""

import hashlib
import redis
from firecrawl import FirecrawlApp
from config import settings

# ── Infrastructure clients ────────────────────────────────────────────────────
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
firecrawl_app = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

_CACHE_TTL_SECONDS = 43_200  # 12 hours


class DreamTeqDataPipeline:

    @staticmethod
    def fetch_and_clean_web_content(url: str) -> str:
        """
        Stages 1 & 2: Low-level Firecrawl pipeline processing.

        Returns clean Markdown string extracted from the target URL.
        Results are cached in Redis for 12 hours to stay within free-tier limits.

        Raises:
            ValueError: If Firecrawl returns no usable text content.
            redis.RedisError: If the cache layer is unavailable (non-fatal —
                              the scrape will still proceed without caching).
        """
        # Use SHA-256 of the URL as a safe, fixed-length cache key
        cache_key = f"scrape:raw:{hashlib.sha256(url.encode()).hexdigest()}"

        # ── Cache read ───────────────────────────────────────────────────────
        try:
            cached_md = redis_client.get(cache_key)
            if cached_md:
                return cached_md
        except redis.RedisError as redis_err:
            # Cache unavailable — log and continue without caching
            print(f"[PIPELINE] Redis cache read failed (non-fatal): {redis_err}")

        # ── Stage 1: Firecrawl scrape execution ──────────────────────────────
        scrape_result = firecrawl_app.scrape_url(url, params={"formats": ["markdown"]})

        # firecrawl-py v1 returns the result directly as a dict
        raw_markdown = scrape_result.get("markdown", "") if isinstance(scrape_result, dict) else ""

        if not raw_markdown:
            raise ValueError(
                f"Firecrawl engine returned no meaningful text content for URL: {url}"
            )

        # ── Stage 2: Cache clean Markdown ────────────────────────────────────
        try:
            redis_client.setex(cache_key, _CACHE_TTL_SECONDS, raw_markdown)
        except redis.RedisError as redis_err:
            print(f"[PIPELINE] Redis cache write failed (non-fatal): {redis_err}")

        return raw_markdown
