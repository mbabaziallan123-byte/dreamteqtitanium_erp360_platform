"""
DreamTeQ_360 Firecrawl Scraper Module — Automated CRON Scheduler Pipeline
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Runs as a daemon inside the `scheduler-cron` Docker container.
Invoked every Monday at 04:00 AM via crond (see docker-compose.yml entrypoint).

Sequentially processes all monitored agricultural target sites, calling the
local FastAPI microservice endpoint over the Docker service mesh hostname.
A 5-second cooldown between requests avoids hammering Firecrawl free-tier limits.

Manual dry-run:
    python scheduler.py
"""

import time
import httpx

# ── Monitoring target queue ───────────────────────────────────────────────────
# Add / remove URLs and extraction goals here to adjust the weekly scan corpus.
MONITORING_TARGET_QUEUE = [
    {
        "url": "https://agra.org",
        "goal": "Extract agri-business development grants and procurement notices."
    },
    {
        "url": "https://sadc.int",
        "goal": "Extract regional infrastructure and consultancy tenders for southern African farming blocks."
    },
    {
        "url": "https://kilimo.go.ke",
        "goal": "Extract national government agricultural supply bids and commodity pricing sheets."
    },
    {
        "url": "https://eagc.org",
        "goal": "Extract East African Grain Council commodity market data and trade opportunities."
    },
    {
        "url": "https://firecrawl.dev",
        "goal": "Extract agricultural technology and data intelligence service announcements."
    }
]

# Target the microservice via Docker DNS mesh hostname
_SCRAPER_ENDPOINT = "http://dreamteq-scraper-module:8000/api/v1/dreamteq-scraper/execute"
_REQUEST_TIMEOUT  = 120.0   # seconds — Gemini can be slow on large pages
_COOLDOWN_SECS    = 5       # rate-limit backoff between requests


def run_automated_scraping_cycle():
    """
    Sequentially processes the monitoring target queue.
    Calls the local DreamTeQ FastAPI microservice over the Docker mesh.
    """
    print("[SCHEDULER] Initiating scheduled DreamTeQ background crawling matrix...")
    success_count = 0
    failure_count = 0

    with httpx.Client(timeout=_REQUEST_TIMEOUT) as client:
        for target in MONITORING_TARGET_QUEUE:
            payload = {
                "target_url": target["url"],
                "extraction_goal": target["goal"]
            }
            try:
                response = client.post(_SCRAPER_ENDPOINT, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    count = data.get("processed_count", 0)
                    print(f"[SCHEDULER] OK  {target['url']} — {count} opportunities extracted.")
                    success_count += 1
                else:
                    print(f"[SCHEDULER] ERR {target['url']} — HTTP {response.status_code}: {response.text[:120]}")
                    failure_count += 1
            except Exception as exc:
                print(f"[SCHEDULER] NET {target['url']} — {exc}")
                failure_count += 1

            # Cooldown backoff between requests
            time.sleep(_COOLDOWN_SECS)

    print(
        f"[SCHEDULER] Cycle complete. "
        f"Successes: {success_count} | Failures: {failure_count} | "
        f"Total targets: {len(MONITORING_TARGET_QUEUE)}"
    )


if __name__ == "__main__":
    # Entry point for manual dry-run or container invocation via crond
    run_automated_scraping_cycle()
