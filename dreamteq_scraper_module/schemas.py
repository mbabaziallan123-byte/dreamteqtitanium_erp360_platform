"""
DreamTeQ_360 Firecrawl Scraper Module — Pydantic Schema Definitions
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Strict type definitions used to:
  - Validate inbound scraper job requests
  - Map structured opportunity payloads between Firecrawl and Gemini
  - Enforce ERP-compatible JSON output contracts
"""

from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional


class ScraperJobRequest(BaseModel):
    target_url: HttpUrl
    extraction_goal: str = Field(
        ...,
        description="Contextual target for the AI scraper engine.",
        min_length=5,
        max_length=500
    )


class OpportunityPayload(BaseModel):
    title: str
    opportunity_type: str = Field(
        ...,
        description="Tender, Grant, Course, or Market Data"
    )
    value_chains: List[str]
    economic_bloc: str = Field(
        ...,
        description="EAC, SADC, Both, or Other"
    )
    specific_countries: List[str]
    financial_value_usd: float = 0.0
    priority_flag: str = Field(
        ...,
        description="Urgent, High-Value, or Standard"
    )
    application_deadline: Optional[str] = None
    source_url: str


class DiscoveryBatchResponse(BaseModel):
    status: str
    processed_count: int
    opportunities: List[OpportunityPayload]
