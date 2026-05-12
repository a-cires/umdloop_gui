"""CC2-specific configuration.

Uses pydantic-settings to load values from environment variables.
All env vars are prefixed with UMDLOOP_CC2_.
"""

from __future__ import annotations

from backend_common.base_config import BaseBackendSettings


class CC2Settings(BaseBackendSettings):
    """CC2 backend configuration loaded from environment variables."""

    # Server
    port: int = 5000

    # MikroTik radio
    mikrotik_host: str = ""
    mikrotik_user: str = ""
    mikrotik_pass: str = ""
    mikrotik_endpoint: str = ""
    mikrotik_verify_tls: bool = False
    mikrotik_cache_ttl_sec: float = 1.5

    # ROS2 (rosbridge on the Orin)
    rosbridge_host: str = "localhost"
    rosbridge_port: int = 9090

    model_config = {"env_prefix": "UMDLOOP_CC2_", "case_sensitive": False}


settings = CC2Settings()
