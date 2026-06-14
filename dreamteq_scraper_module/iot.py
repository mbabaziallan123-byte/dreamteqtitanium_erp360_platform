"""
DreamTeQ_360 Firecrawl Scraper Module — IoT Telematics Bridge (Stage 5)
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Pushes high-priority opportunity alerts directly to remote farm hubs,
automated processing facility dashboards, and field display units across
East Africa and SADC using MQTT over TCP (or WebSockets on port 8083).

MQTT_BROKER_HOST must be a hostname only — no protocol prefix.
Example: broker.hivemq.com  (NOT ://hivemq.com)
"""

import json
import paho.mqtt.client as mqtt
from config import settings

_MAX_TITLE_LENGTH = 30


class DreamTeqIoTBridge:

    @staticmethod
    def broadcast_to_field_devices(opportunity: dict) -> bool:
        """
        Stage 5: Publish a compact alert payload to the configured MQTT broker.

        Topics follow the pattern:  dreamteq/farm/<bloc>/<priority>
        Example:                    dreamteq/farm/eac/urgent

        Returns:
            True if the message was published successfully, False otherwise.
        """
        transport = "websockets" if settings.MQTT_BROKER_PORT == 8083 else "tcp"
        client = mqtt.Client(transport=transport)

        try:
            # MQTT_BROKER_HOST must be a plain hostname — validated on connection
            client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)

            bloc     = opportunity.get("economic_bloc", "General").lower()
            priority = opportunity.get("priority_flag", "Standard").lower()

            title_raw  = opportunity.get("title", "")
            title_abbr = (title_raw[:_MAX_TITLE_LENGTH] + "...") if len(title_raw) > _MAX_TITLE_LENGTH else title_raw

            iot_payload = {
                "alert":       f"NEW {priority.upper()} OP",
                "title":       title_abbr,
                "type":        opportunity.get("opportunity_type"),
                "value_chain": (opportunity.get("value_chains") or ["General"])[0]
            }

            target_topic = f"{settings.MQTT_TOPIC_PREFIX}/{bloc}/{priority}"
            client.publish(target_topic, json.dumps(iot_payload), qos=1)

            print(f"[IOT BRIDGE] Packet dispatched to MQTT topic: {target_topic}")
            return True

        except Exception as exc:
            print(f"[IOT BRIDGE] Telematics broadcast failure: {exc}")
            return False

        finally:
            client.disconnect()
