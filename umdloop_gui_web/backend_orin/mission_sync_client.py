"""Mission Sync Client — subscribes to CC2's mission state.

Connects to the CC2 mission sync WebSocket and keeps the local
active mission in sync. Can be used to trigger camera preset
changes when the mission changes.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from .config import settings

logger = logging.getLogger(__name__)

# Current mission as received from CC2
_active_mission: Optional[str] = None


def get_active_mission() -> Optional[str]:
    """Return the currently active mission as reported by CC2."""
    return _active_mission


async def start_mission_sync_client() -> None:
    """Connect to CC2 mission sync and listen for updates.

    Reconnects automatically on disconnection with exponential backoff.
    """
    global _active_mission

    url = f"ws://{settings.cc2_host}:{settings.cc2_port}/mission-sync/ws"
    backoff = 1.0

    while True:
        try:
            import websockets

            async with websockets.connect(url) as ws:
                logger.info(f"Connected to mission sync at {url}")
                backoff = 1.0  # Reset on successful connect

                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                        if msg.get("type") == "set-mission":
                            _active_mission = msg.get("mission")
                            logger.info(
                                f"Mission updated: {_active_mission}"
                            )
                    except json.JSONDecodeError:
                        continue

        except ImportError:
            logger.error(
                "websockets package not installed. "
                "Mission sync client disabled."
            )
            return
        except Exception as e:
            logger.warning(
                f"Mission sync connection failed: {e}. "
                f"Retrying in {backoff:.1f}s..."
            )
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30.0)
