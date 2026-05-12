"""Base configuration shared across all backends.

Individual backends extend this with their own settings.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings


class BaseBackendSettings(BaseSettings):
    """Common settings inherited by all backend configs."""

    host: str = "0.0.0.0"
    port: int = 5000
