"""
DreamTeQ_360 Firecrawl Scraper Module — Discord Watchdog Monitor
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Dispatches structured Discord embed alerts to your engineering team when
the scraping pipeline detects layout breakages, empty Firecrawl responses,
or Gemini parsing failures.

Configure via environment variable: DISCORD_WEBHOOK_URL
"""

import httpx
from datetime import datetime, timezone
from config import settings


def alert_engineering_team_of_breakage(
    target_url: str,
    failure_phase: str,
    error_message: str
) -> bool:
    """
    Dispatches a structured embed alert to the configured Discord webhook
    when a scraping pipeline failure is detected.

    Args:
        target_url:     The portal URL that triggered the failure.
        failure_phase:  Human-readable phase label (e.g. "Stage 1/2: Firecrawl").
        error_message:  Raw exception or error string.

    Returns:
        True if the alert was successfully delivered, False otherwise.
    """
    webhook_url = getattr(settings, "DISCORD_WEBHOOK_URL", None)
    if not webhook_url:
        print("[MONITOR] DISCORD_WEBHOOK_URL not configured — alert suppressed.")
        return False

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Truncate long error traces to fit Discord embed character limits
    truncated_error = error_message[:500] + ("..." if len(error_message) > 500 else "")

    payload = {
        "username": "DreamTeQ Watchdog Engine",
        "embeds": [
            {
                "title": "Scraper Pipeline Operational Failure",
                "description": (
                    "An issue occurred during the automated agricultural "
                    "intelligence gathering cycle."
                ),
                "color": 15158332,  # Warning red
                "fields": [
                    {
                        "name": "Target URL Source",
                        "value": f"`{target_url}`",
                        "inline": False
                    },
                    {
                        "name": "Failure Phase",
                        "value": f"**{failure_phase}**",
                        "inline": True
                    },
                    {
                        "name": "System Timestamp",
                        "value": f"`{timestamp}`",
                        "inline": True
                    },
                    {
                        "name": "Error Diagnostics",
                        "value": f"```text\n{truncated_error}\n```",
                        "inline": False
                    }
                ],
                "footer": {
                    "text": "DreamTeQ Farmer ERP Microservices Platform"
                }
            }
        ]
    }

    try:
        response = httpx.post(webhook_url, json=payload, timeout=10.0)
        # Discord returns 204 No Content on success
        if response.status_code in (200, 204):
            print(f"[MONITOR] Layout breakage alert dispatched to Discord: {failure_phase}")
            return True
        else:
            print(
                f"[MONITOR] Discord webhook rejected request "
                f"(HTTP {response.status_code}): {response.text[:120]}"
            )
            return False
    except Exception as exc:
        print(f"[MONITOR] Failed to dispatch watchdog alert to Discord: {exc}")
        return False
