"""
DreamTeQ_360 Firecrawl Scraper Module — Cognitive Reasoning Agent (Stages 3 & 4)
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Feeds Firecrawl Markdown output into Gemini 1.5 Pro acting as an autonomous
classification agent. Gemini evaluates regional relevance, sorts opportunities
by priority, and formats the output into the ERP-compatible JSON schema.
"""

import json
import google.generativeai as genai
from config import settings

# ── Gemini client initialisation ─────────────────────────────────────────────
genai.configure(api_key=settings.GEMINI_API_KEY)

_OPPORTUNITY_TYPES  = ["Tender", "Grant", "Course", "Market Data"]
_VALUE_CHAINS       = ["Maize", "Dairy", "Poultry", "Horticulture", "Coffee", "Tea", "General Agri"]
_ECONOMIC_BLOCS     = ["EAC", "SADC", "Both", "Other"]
_PRIORITY_FLAGS     = ["Urgent", "High-Value", "Standard"]


class DreamTeqCognitiveAgent:

    def __init__(self):
        # Gemini 1.5 Pro — JSON output mode enforced via response_mime_type
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={"response_mime_type": "application/json"}
        )

    def process_and_flag_opportunities(
        self,
        raw_markdown: str,
        extraction_goal: str,
        source_url: str
    ) -> dict:
        """
        Stages 3 & 4: Feed raw Markdown to Gemini and extract structured
        opportunity records aligned with the DreamTeQ ERP JSON schema.

        Returns:
            dict with keys: status, processed_count, opportunities[]

        Raises:
            json.JSONDecodeError: If Gemini returns non-JSON content.
            ValueError: If Gemini response is empty.
        """
        system_prompt = f"""
You are the DreamTeQ AI Core Engine for an East African & SADC Farmer ERP platform.
Analyze the raw markdown input and extract opportunities matching: '{extraction_goal}'.

Return ONLY valid JSON in this exact structure:
{{
  "status": "success",
  "processed_count": <integer>,
  "opportunities": [
    {{
      "title": "Exact Title",
      "opportunity_type": "{'" | "'.join(_OPPORTUNITY_TYPES)}",
      "value_chains": {json.dumps(_VALUE_CHAINS[:3])},
      "economic_bloc": "{'" | "'.join(_ECONOMIC_BLOCS)}",
      "specific_countries": ["Kenya", "Tanzania"],
      "financial_value_usd": 15000.00,
      "priority_flag": "{'" | "'.join(_PRIORITY_FLAGS)}",
      "application_deadline": "YYYY-MM-DD or null",
      "source_url": "{source_url}"
    }}
  ]
}}

Rules:
- Filter out expired or irrelevant data rows automatically.
- Use null for application_deadline when the date is unknown or not mentioned.
- Return {{"status": "success", "processed_count": 0, "opportunities": []}} if no relevant data found.
- Do not include any text outside the JSON object.
"""

        response = self.model.generate_content([system_prompt, raw_markdown])

        if not response.text:
            raise ValueError("Gemini returned an empty response — no structured data extracted.")

        return json.loads(response.text)
