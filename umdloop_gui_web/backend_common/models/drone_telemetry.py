"""Drone Telemetry model — telemetry frame from drone on CC2."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class DroneTelemetryFrame(BaseModel):
    """A single drone telemetry snapshot."""

    timestamp_ms: int
    battery_pct: Optional[int] = None
    voltage_v: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_m: Optional[float] = None
    heading_deg: Optional[float] = None
    airspeed_mps: Optional[float] = None
    groundspeed_mps: Optional[float] = None
    armed: Optional[bool] = None
