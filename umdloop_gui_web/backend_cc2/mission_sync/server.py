"""Mission Sync Service — Authoritative WebSocket server on CC2.

Broadcasts the selected mission to all connected clients (CC1 browser, Orin).
Mounted at /mission-sync on the CC2 backend.
"""

from __future__ import annotations

import asyncio
import json
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from backend_common.models.mission_state import (
    VALID_MISSIONS,
    MissionState,
    STATE_FILE_PATH,
    load_state,
    save_state,
)

app = FastAPI(title="Mission Sync Service")

# In-memory state and connected clients
_state: MissionState = MissionState()
_clients: Set[WebSocket] = set()
_lock = asyncio.Lock()
_state_file_path = STATE_FILE_PATH


def get_current_state() -> MissionState:
    """Return the current in-memory mission state."""
    return _state


@app.on_event("startup")
async def _startup() -> None:
    global _state
    _state = load_state(_state_file_path)


@app.websocket("/ws")
async def mission_sync_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for mission synchronization.

    On connect: sends current mission state.
    On set-mission: validates, broadcasts to all clients, persists.
    On invalid identifier: returns JSON error, state unchanged.
    """
    global _state

    await websocket.accept()
    _clients.add(websocket)

    try:
        # Send current state on connect
        await websocket.send_json(
            {"type": "set-mission", "mission": _state.active_mission}
        )

        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON"}
                )
                continue

            msg_type = msg.get("type")
            if msg_type != "set-mission":
                await websocket.send_json(
                    {"type": "error", "message": f"Unknown message type: {msg_type!r}"}
                )
                continue

            mission = msg.get("mission")

            # Validate identifier
            if mission not in VALID_MISSIONS:
                await websocket.send_json(
                    {"type": "error", "message": "Invalid mission identifier"}
                )
                continue

            # Update state, persist, broadcast
            async with _lock:
                _state = MissionState(active_mission=mission)
                save_state(_state, _state_file_path)

                broadcast_msg = {"type": "set-mission", "mission": mission}
                disconnected: list[WebSocket] = []
                for client in _clients:
                    try:
                        await client.send_json(broadcast_msg)
                    except Exception:
                        disconnected.append(client)

                for client in disconnected:
                    _clients.discard(client)

    except WebSocketDisconnect:
        pass
    finally:
        _clients.discard(websocket)
