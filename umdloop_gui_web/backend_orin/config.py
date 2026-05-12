"""Orin-specific configuration.

Uses pydantic-settings to load values from environment variables.
All env vars are prefixed with UMDLOOP_ORIN_.
"""

from __future__ import annotations

from backend_common.base_config import BaseBackendSettings


class OrinSettings(BaseBackendSettings):
    """Orin backend configuration loaded from environment variables."""

    # Python health server
    port: int = 5002

    # Camera streaming C++ backend
    camera_ws_port: int = 8081
    camera_binary_path: str = "backend_orin/camera_streaming/build/camera-stream"
    stun_ip: str = ""

    # Mission sync (CC2 connection)
    cc2_host: str = "192.168.88.10"
    cc2_port: int = 5000

    model_config = {"env_prefix": "UMDLOOP_ORIN_", "case_sensitive": False}


settings = OrinSettings()
