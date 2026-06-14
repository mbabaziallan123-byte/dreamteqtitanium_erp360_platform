"""
DreamTeQ_360 Firecrawl Scraper Module — FastAPI Application Entry Point
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Mounts all pipeline layers into a single cohesive microservice:
  POST /api/v1/dreamteq-scraper/execute  — full 5-stage discovery cycle
  GET  /health                           — liveness probe for Docker/load-balancer

Rate limit: 30 requests per minute per IP (adjustable via RATE_LIMIT_PER_MINUTE env var).
"""

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.custom_handlers import rate_limit_exceeded_handler

from schemas import ScraperJobRequest, DiscoveryBatchResponse
from pipeline import DreamTeqDataPipeline
from agents import DreamTeqCognitiveAgent
from iot import DreamTeqIoTBridge
from database import ping_database

# ── Rate limiter ──────────────────────────────────────────────────────────────
_RATE_LIMIT = os.environ.get("RATE_LIMIT_PER_MINUTE", "30")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="DreamTeQ Firecrawl Scraper Module",
    description="5-stage agricultural opportunity discovery engine for East Africa & SADC ERP",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# ── Shared agent instance (warm on startup) ───────────────────────────────────
agent_engine = DreamTeqCognitiveAgent()


# ── Health probe ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Liveness probe — returns database reachability status."""
    db_ok = ping_database()
    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={"status": "ok" if db_ok else "degraded", "database": db_ok}
    )


# ── Primary scraper endpoint ──────────────────────────────────────────────────
@app.post("/api/v1/dreamteq-scraper/execute", response_model=DiscoveryBatchResponse)
@limiter.limit(f"{_RATE_LIMIT}/minute")
async def execute_automated_discovery_cycle(request: Request, payload: ScraperJobRequest):
    """
    Complete 5-stage end-to-end execution loop:
      1 & 2  — Firecrawl web extraction → clean Markdown (Redis-cached)
      3 & 4  — Gemini 1.5 Pro cognitive extraction → structured JSON
      5      — IoT MQTT broadcast for Urgent / High-Value opportunities
    """
    try:
        # Stages 1 & 2: Firecrawl pipeline
        raw_markdown = DreamTeqDataPipeline.fetch_and_clean_web_content(
            str(payload.target_url)
        )

        # Stages 3 & 4: Gemini cognitive agent
        structured_json = agent_engine.process_and_flag_opportunities(
            raw_markdown=raw_markdown,
            extraction_goal=payload.extraction_goal,
            source_url=str(payload.target_url)
        )

        # Stage 5: IoT broadcast for high-priority opportunities
        for op in structured_json.get("opportunities", []):
            if op.get("priority_flag") in ("Urgent", "High-Value"):
                DreamTeqIoTBridge.broadcast_to_field_devices(op)

        return structured_json

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"DreamTeQ Scraper Module execution failure: {str(exc)}"
        )
