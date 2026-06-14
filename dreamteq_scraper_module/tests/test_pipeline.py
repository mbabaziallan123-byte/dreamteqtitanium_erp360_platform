"""
DreamTeQ_360 Firecrawl Scraper Module — Unit Test Suite
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Test coverage:
  - config.py   : Settings load from env vars
  - schemas.py  : Pydantic model validation (valid + invalid inputs)
  - pipeline.py : Redis cache hit/miss path (Firecrawl mocked)
  - agents.py   : Gemini JSON extraction (Gemini client mocked)
  - iot.py      : MQTT broadcast (paho client mocked)
  - database.py : DreamTeqDatabaseMap DAO (psycopg2 mocked)
  - monitor.py  : Discord webhook alert (httpx mocked)

Run inside container:
    pytest tests/ -v --tb=short
"""

import json
import pytest
from unittest.mock import MagicMock, patch


# ─────────────────────────────────────────────────────────────────────────────
# config.py
# ─────────────────────────────────────────────────────────────────────────────
class TestModuleSettings:

    def test_settings_loads_firecrawl_key(self, monkeypatch):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key-abc123")
        # Re-import to pick up monkeypatched env
        import importlib
        import config
        importlib.reload(config)
        assert config.settings.FIRECRAWL_API_KEY == "fc-test-key-abc123"

    def test_mqtt_broker_host_has_no_protocol_prefix(self):
        import config
        host = config.settings.MQTT_BROKER_HOST
        assert not host.startswith("://"), (
            f"MQTT_BROKER_HOST must be a plain hostname, got: '{host}'"
        )

    def test_redis_url_starts_with_redis_scheme(self):
        import config
        assert config.settings.REDIS_URL.startswith("redis://"), (
            "REDIS_URL must start with redis://"
        )


# ─────────────────────────────────────────────────────────────────────────────
# schemas.py
# ─────────────────────────────────────────────────────────────────────────────
class TestSchemas:

    def test_scraper_job_request_valid(self):
        from schemas import ScraperJobRequest
        req = ScraperJobRequest(
            target_url="https://agra.org",
            extraction_goal="Extract development grants for East African farmers."
        )
        assert str(req.target_url).startswith("https://agra.org")

    def test_scraper_job_request_rejects_short_goal(self):
        from pydantic import ValidationError
        from schemas import ScraperJobRequest
        with pytest.raises(ValidationError):
            ScraperJobRequest(target_url="https://agra.org", extraction_goal="hi")

    def test_scraper_job_request_rejects_invalid_url(self):
        from pydantic import ValidationError
        from schemas import ScraperJobRequest
        with pytest.raises(ValidationError):
            ScraperJobRequest(
                target_url="not-a-url",
                extraction_goal="Extract development grants for East African farmers."
            )

    def test_opportunity_payload_valid(self):
        from schemas import OpportunityPayload
        op = OpportunityPayload(
            title="Grain Tender 2026",
            opportunity_type="Tender",
            value_chains=["Maize"],
            economic_bloc="EAC",
            specific_countries=["Kenya"],
            financial_value_usd=50000.0,
            priority_flag="Urgent",
            source_url="https://agra.org/tender/123"
        )
        assert op.priority_flag == "Urgent"

    def test_discovery_batch_response_structure(self):
        from schemas import DiscoveryBatchResponse, OpportunityPayload
        resp = DiscoveryBatchResponse(
            status="success",
            processed_count=1,
            opportunities=[
                OpportunityPayload(
                    title="Test",
                    opportunity_type="Grant",
                    value_chains=["Tea"],
                    economic_bloc="SADC",
                    specific_countries=["Zambia"],
                    priority_flag="Standard",
                    source_url="https://sadc.int/grant/1"
                )
            ]
        )
        assert resp.processed_count == 1
        assert len(resp.opportunities) == 1


# ─────────────────────────────────────────────────────────────────────────────
# pipeline.py — Redis cache paths
# ─────────────────────────────────────────────────────────────────────────────
class TestDreamTeqDataPipeline:

    @patch("pipeline.redis_client")
    @patch("pipeline.firecrawl_app")
    def test_returns_cached_markdown_on_cache_hit(self, mock_fc, mock_redis):
        from pipeline import DreamTeqDataPipeline
        mock_redis.get.return_value = "# Cached Content"
        result = DreamTeqDataPipeline.fetch_and_clean_web_content("https://agra.org")
        assert result == "# Cached Content"
        mock_fc.scrape_url.assert_not_called()

    @patch("pipeline.redis_client")
    @patch("pipeline.firecrawl_app")
    def test_calls_firecrawl_on_cache_miss(self, mock_fc, mock_redis):
        from pipeline import DreamTeqDataPipeline
        mock_redis.get.return_value = None
        mock_fc.scrape_url.return_value = {"markdown": "# Fresh Scraped Content"}
        result = DreamTeqDataPipeline.fetch_and_clean_web_content("https://agra.org")
        assert result == "# Fresh Scraped Content"
        mock_redis.setex.assert_called_once()

    @patch("pipeline.redis_client")
    @patch("pipeline.firecrawl_app")
    def test_raises_on_empty_firecrawl_response(self, mock_fc, mock_redis):
        from pipeline import DreamTeqDataPipeline
        mock_redis.get.return_value = None
        mock_fc.scrape_url.return_value = {"markdown": ""}
        with pytest.raises(ValueError, match="Firecrawl engine failed"):
            DreamTeqDataPipeline.fetch_and_clean_web_content("https://agra.org")

    @patch("pipeline.redis_client")
    @patch("pipeline.firecrawl_app")
    def test_continues_when_redis_unavailable(self, mock_fc, mock_redis):
        from pipeline import DreamTeqDataPipeline
        mock_redis.get.side_effect = Exception("Redis connection refused")
        mock_fc.scrape_url.return_value = {"markdown": "# Content from Firecrawl"}
        result = DreamTeqDataPipeline.fetch_and_clean_web_content("https://agra.org")
        assert "Content from Firecrawl" in result


# ─────────────────────────────────────────────────────────────────────────────
# agents.py — Gemini response parsing
# ─────────────────────────────────────────────────────────────────────────────
class TestDreamTeqCognitiveAgent:

    @patch("agents.genai")
    def test_returns_parsed_dict_on_valid_json(self, mock_genai):
        from agents import DreamTeqCognitiveAgent
        fake_response = MagicMock()
        fake_response.text = json.dumps({
            "status": "success",
            "processed_count": 1,
            "opportunities": []
        })
        mock_genai.GenerativeModel.return_value.generate_content.return_value = fake_response
        agent = DreamTeqCognitiveAgent()
        result = agent.process_and_flag_opportunities("# Markdown", "test goal", "https://x.com")
        assert result["status"] == "success"

    @patch("agents.genai")
    def test_raises_value_error_on_empty_gemini_response(self, mock_genai):
        from agents import DreamTeqCognitiveAgent
        fake_response = MagicMock()
        fake_response.text = ""
        mock_genai.GenerativeModel.return_value.generate_content.return_value = fake_response
        agent = DreamTeqCognitiveAgent()
        with pytest.raises(ValueError, match="empty response"):
            agent.process_and_flag_opportunities("# MD", "goal", "https://x.com")


# ─────────────────────────────────────────────────────────────────────────────
# iot.py — MQTT broadcast
# ─────────────────────────────────────────────────────────────────────────────
class TestDreamTeqIoTBridge:

    @patch("iot.mqtt.Client")
    def test_publishes_to_correct_topic(self, mock_mqtt_cls):
        from iot import DreamTeqIoTBridge
        mock_client = MagicMock()
        mock_mqtt_cls.return_value = mock_client

        op = {
            "title": "Maize Tender Kenya 2026",
            "opportunity_type": "Tender",
            "economic_bloc": "EAC",
            "priority_flag": "Urgent",
            "value_chains": ["Maize"]
        }
        result = DreamTeqIoTBridge.broadcast_to_field_devices(op)
        assert result is True
        mock_client.publish.assert_called_once()
        topic_used = mock_client.publish.call_args[0][0]
        assert "eac" in topic_used
        assert "urgent" in topic_used

    @patch("iot.mqtt.Client")
    def test_returns_false_on_connection_failure(self, mock_mqtt_cls):
        from iot import DreamTeqIoTBridge
        mock_client = MagicMock()
        mock_client.connect.side_effect = Exception("Connection refused")
        mock_mqtt_cls.return_value = mock_client
        result = DreamTeqIoTBridge.broadcast_to_field_devices({"title": "x", "economic_bloc": "EAC"})
        assert result is False


# ─────────────────────────────────────────────────────────────────────────────
# database.py — DreamTeqDatabaseMap DAO
# ─────────────────────────────────────────────────────────────────────────────
class TestDreamTeqDatabaseMap:

    @patch("database.psycopg2.connect")
    def test_save_returns_zero_on_empty_list(self, mock_connect):
        from database import DreamTeqDatabaseMap
        result = DreamTeqDatabaseMap.save_discovered_opportunities([])
        assert result == 0
        mock_connect.assert_not_called()

    @patch("database.psycopg2.connect")
    def test_save_commits_and_returns_count(self, mock_connect):
        from database import DreamTeqDatabaseMap
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [42]
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        ops = [{
            "title": "EAC Tender",
            "opportunity_type": "Tender",
            "economic_bloc": "EAC",
            "specific_countries": ["Kenya"],
            "financial_value_usd": 5000.0,
            "priority_flag": "Standard",
            "application_deadline": None,
            "source_url": "https://eac.org/tender/1",
            "value_chains": ["Maize"]
        }]
        result = DreamTeqDatabaseMap.save_discovered_opportunities(ops)
        assert result == 1
        mock_conn.commit.assert_called_once()

    @patch("database.psycopg2.connect")
    def test_rollback_on_db_error(self, mock_connect):
        from database import DreamTeqDatabaseMap
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = Exception("DB write error")
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        with pytest.raises(Exception, match="DB write error"):
            DreamTeqDatabaseMap.save_discovered_opportunities([{
                "title": "x", "opportunity_type": "Grant",
                "economic_bloc": "EAC", "specific_countries": [],
                "financial_value_usd": 0, "priority_flag": "Standard",
                "application_deadline": None, "source_url": "https://x.org/1",
                "value_chains": []
            }])
        mock_conn.rollback.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# monitor.py — Discord webhook
# ─────────────────────────────────────────────────────────────────────────────
class TestDiscordMonitor:

    @patch("monitor.httpx.post")
    def test_alert_returns_true_on_204(self, mock_post, monkeypatch):
        import config
        monkeypatch.setattr(config.settings, "DISCORD_WEBHOOK_URL",
                            "https://discord.com/api/webhooks/test/token",
                            raising=False)
        mock_response = MagicMock()
        mock_response.status_code = 204
        mock_post.return_value = mock_response

        from monitor import alert_engineering_team_of_breakage
        result = alert_engineering_team_of_breakage(
            "https://broken-site.org", "Stage 1/2: Firecrawl", "Timeout error"
        )
        assert result is True

    def test_alert_returns_false_when_no_webhook_url(self, monkeypatch):
        import config
        monkeypatch.setattr(config.settings, "DISCORD_WEBHOOK_URL", None, raising=False)
        from monitor import alert_engineering_team_of_breakage
        result = alert_engineering_team_of_breakage("https://x.org", "Stage 3/4", "Parse error")
        assert result is False
