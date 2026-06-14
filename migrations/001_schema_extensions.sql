-- DreamTeQ_360 Firecrawl Scraper Module — Schema Extensions
-- Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
--
-- Apply once against the dreamteq_master_pool database:
--   psql "$DATABASE_URL" -f migrations/001_schema_extensions.sql
--
-- Tables created:
--   opportunities              — core opportunity records (UPSERT target)
--   opportunity_value_chains   — many-to-many crop/livestock tags
--   scraper_run_logs           — telemetry table for pipeline health analytics

-- ── Core opportunities table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
    id                   SERIAL PRIMARY KEY,
    title                TEXT NOT NULL,
    opportunity_type     VARCHAR(50),
    economic_bloc        VARCHAR(20),
    specific_countries   TEXT[],
    financial_value_usd  NUMERIC(15, 2) DEFAULT 0.00,
    priority_flag        VARCHAR(20),
    application_deadline DATE,
    source_url           TEXT NOT NULL UNIQUE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opportunities_priority
    ON opportunities (priority_flag);

CREATE INDEX IF NOT EXISTS idx_opportunities_bloc
    ON opportunities (economic_bloc);

CREATE INDEX IF NOT EXISTS idx_opportunities_deadline
    ON opportunities (application_deadline)
    WHERE application_deadline IS NOT NULL;

-- ── Value chains join table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_value_chains (
    id              SERIAL PRIMARY KEY,
    opportunity_id  INT NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
    value_chain     VARCHAR(100) NOT NULL,
    UNIQUE (opportunity_id, value_chain)
);

CREATE INDEX IF NOT EXISTS idx_vc_opportunity_id
    ON opportunity_value_chains (opportunity_id);

-- ── Scraper run telemetry table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_run_logs (
    id                 SERIAL PRIMARY KEY,
    target_url         TEXT NOT NULL,
    phase_failed       VARCHAR(100),   -- NULL if successful; 'Firecrawl' | 'Gemini' otherwise
    execution_time_ms  INT NOT NULL,
    items_extracted    INT DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_url
    ON scraper_run_logs (target_url);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_status
    ON scraper_run_logs (phase_failed);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_created
    ON scraper_run_logs (created_at DESC);

-- ── Monitoring view: portal reliability (last 30 days) ───────────────────────
CREATE OR REPLACE VIEW portal_reliability_30d AS
SELECT
    target_url,
    COUNT(id)                                                               AS total_runs,
    ROUND(
        (COUNT(CASE WHEN phase_failed IS NULL THEN 1 END) * 100.0) / COUNT(id),
        2
    )                                                                       AS success_rate_pct,
    AVG(execution_time_ms)::INT                                             AS avg_speed_ms,
    SUM(items_extracted)                                                    AS total_opportunities_found,
    MAX(created_at)                                                         AS last_run_at
FROM scraper_run_logs
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY target_url;

-- ── Query: high-performing portals (>= 5 runs, >= 85% success rate) ──────────
-- Run this to identify reliable targets for auto-promotion to priority queue:
--
-- SELECT *
-- FROM portal_reliability_30d
-- WHERE total_runs >= 5
--   AND success_rate_pct >= 85.0
-- ORDER BY success_rate_pct DESC, total_opportunities_found DESC;
