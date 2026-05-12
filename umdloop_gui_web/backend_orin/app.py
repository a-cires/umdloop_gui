"""Orin Backend — FastAPI application.

Provides health/status endpoints and manages the C++ camera streaming
process lifecycle. Also runs the mission sync client to subscribe to
CC2's authoritative mission state.
"""

from __future__ import annotations

import asyncio
import os
import signal
import subprocess
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings

app = FastAPI(title="UMD Loop Orin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Camera process management
# ---------------------------------------------------------------------------

_camera_process: Optional[subprocess.Popen] = None


def _build_camera_cmd() -> list[str]:
    """Build the command to launch the C++ camera backend."""
    cmd = [settings.camera_binary_path, "--ws-port", str(settings.camera_ws_port)]
    if settings.stun_ip:
        cmd.extend(["--stun-ip", settings.stun_ip])
    return cmd


@app.on_event("startup")
async def _startup():
    """Start the camera streaming process and mission sync client."""
    global _camera_process

    camera_bin = settings.camera_binary_path
    if os.path.isfile(camera_bin) and os.access(camera_bin, os.X_OK):
        cmd = _build_camera_cmd()
        _camera_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
    else:
        import logging
        logging.warning(
            f"Camera binary not found at {camera_bin}. "
            "Camera streaming will not be available. "
            "Build with: cmake -B build -G Ninja && cmake --build build"
        )

    # Start mission sync client in background
    from .mission_sync_client import start_mission_sync_client
    asyncio.create_task(start_mission_sync_client())


@app.on_event("shutdown")
async def _shutdown():
    """Stop the camera streaming process."""
    global _camera_process
    if _camera_process is not None:
        _camera_process.send_signal(signal.SIGTERM)
        try:
            _camera_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _camera_process.kill()
        _camera_process = None


@app.get("/health")
async def health():
    """Liveness check for the Orin backend."""
    camera_running = _camera_process is not None and _camera_process.poll() is None
    return {
        "ok": True,
        "node": "orin",
        "camera_streaming": camera_running,
        "camera_ws_port": settings.camera_ws_port,
    }


@app.post("/camera/restart")
async def restart_camera():
    """Restart the C++ camera streaming process."""
    global _camera_process

    # Stop existing
    if _camera_process is not None:
        _camera_process.send_signal(signal.SIGTERM)
        try:
            _camera_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _camera_process.kill()

    # Start new
    camera_bin = settings.camera_binary_path
    if not os.path.isfile(camera_bin) or not os.access(camera_bin, os.X_OK):
        return {"ok": False, "error": f"Binary not found: {camera_bin}"}

    cmd = _build_camera_cmd()
    _camera_process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return {"ok": True, "pid": _camera_process.pid}
