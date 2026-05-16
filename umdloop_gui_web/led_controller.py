"""
NeoPixel Trinkey LED controller.

Wraps the 7-byte serial protocol implemented by the rover's NeoPixel Trinkey
firmware (see https://github.com/umdloop/neopixel-trinkey-firmware). Used by
the GUI backend to drive the rover's status LED strip from the technician
dashboard.

Packet layout: SYNC, CMD, R, G, B, PARAM, XOR  (each 1 byte)
  SYNC  = 0xAA
  CMD   = 0x01 SOLID | 0x02 FLASH | 0x03 PULSE | 0xFF OFF
  PARAM = rate in tenths of Hz (FLASH/PULSE); 0 = default 2 Hz; ignored otherwise
  XOR   = CMD ^ R ^ G ^ B ^ PARAM
"""

from __future__ import annotations

import os
import struct
import threading
import time
from typing import Optional

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    serial = None  # handled at runtime; endpoints will report a clear error


SYNC = 0xAA
CMD_SOLID = 0x01
CMD_FLASH = 0x02
CMD_PULSE = 0x03
CMD_OFF = 0xFF
PACKET_LEN = 7

VALID_MODES = {"SOLID", "FLASH", "PULSE", "OFF"}
MODE_TO_CMD = {
    "SOLID": CMD_SOLID,
    "FLASH": CMD_FLASH,
    "PULSE": CMD_PULSE,
    "OFF": CMD_OFF,
}

# How the firmware names itself in `pyserial`'s port description.
DEVICE_DESCRIPTION_HINT = "Pixel Trinkey"

# Default fallback color while the GUI hasn't picked one yet.
DEFAULT_COLOR = (0, 255, 0)


def _make_packet(cmd: int, r: int, g: int, b: int, param: int = 0) -> bytes:
    xor = cmd ^ r ^ g ^ b ^ param
    return struct.pack("BBBBBBB", SYNC, cmd, r, g, b, param, xor)


def _clamp_byte(value) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(255, n))


def _rate_to_param(hz) -> int:
    """Encode a rate (Hz) as PARAM (tenths of Hz, clamped to 0–255)."""
    try:
        rate = float(hz)
    except (TypeError, ValueError):
        return 0
    if rate <= 0:
        return 0
    return max(1, min(255, int(round(rate * 10.0))))


def _find_data_port() -> Optional[str]:
    """Return the second CDC port exposed by the Trinkey (the data channel)."""
    if serial is None:
        return None
    ports = sorted(
        p.device for p in serial.tools.list_ports.comports()
        if DEVICE_DESCRIPTION_HINT in (p.description or "")
    )
    if len(ports) >= 2:
        return ports[-1]
    if len(ports) == 1:
        return ports[0]
    return None


class LEDController:
    """Singleton-style serial controller. Thread-safe; tolerates disconnects."""

    def __init__(self, port: Optional[str] = None, baud: int = 115200):
        self._lock = threading.Lock()
        self._port_path = port or os.getenv("LED_TRINKEY_PORT") or None
        self._baud = baud
        self._serial: Optional["serial.Serial"] = None
        self._last_command: Optional[dict] = None
        self._last_error: Optional[str] = None

    # ── connection ──────────────────────────────────────────────────────────

    def _open(self) -> bool:
        if serial is None:
            self._last_error = "pyserial is not installed on the GUI host"
            return False

        port_path = self._port_path or _find_data_port()
        if port_path is None:
            self._last_error = "No NeoPixel Trinkey detected on USB"
            return False

        try:
            self._serial = serial.Serial(
                port_path,
                baudrate=self._baud,
                timeout=1,
                # Don't toggle DTR on open; that resets the CircuitPython board.
                dsrdtr=False,
                rtscts=False,
            )
            # Give the firmware a moment to mark the data CDC as connected.
            time.sleep(0.2)
            self._port_path = port_path
            self._last_error = None
            return True
        except Exception as exc:
            self._serial = None
            self._last_error = f"Failed to open {port_path}: {exc}"
            return False

    def _ensure_open(self) -> bool:
        if self._serial is not None and getattr(self._serial, "is_open", False):
            return True
        return self._open()

    def close(self) -> None:
        with self._lock:
            if self._serial is not None:
                try:
                    self._serial.close()
                except Exception:
                    pass
                self._serial = None

    # ── public API ──────────────────────────────────────────────────────────

    def send(self, mode: str, r: int = 0, g: int = 0, b: int = 0, rate_hz: float = 0.0) -> tuple[bool, Optional[str]]:
        mode_upper = (mode or "").upper()
        if mode_upper not in VALID_MODES:
            return False, f"Unknown mode '{mode}'. Use SOLID, FLASH, PULSE, or OFF."

        cmd = MODE_TO_CMD[mode_upper]
        if mode_upper == "OFF":
            r = g = b = 0
            param = 0
        else:
            r = _clamp_byte(r)
            g = _clamp_byte(g)
            b = _clamp_byte(b)
            param = _rate_to_param(rate_hz) if mode_upper in ("FLASH", "PULSE") else 0

        packet = _make_packet(cmd, r, g, b, param)

        with self._lock:
            if not self._ensure_open():
                return False, self._last_error

            try:
                self._serial.write(packet)
                self._serial.flush()
            except Exception as exc:
                # Drop the handle so the next call retries the auto-detect/open.
                try:
                    self._serial.close()
                except Exception:
                    pass
                self._serial = None
                self._last_error = f"Serial write failed: {exc}"
                return False, self._last_error

            self._last_command = {
                "mode": mode_upper,
                "r": r,
                "g": g,
                "b": b,
                "rate_hz": (param / 10.0) if param > 0 else 0.0,
                "timestamp": time.time(),
            }
            self._last_error = None
            return True, None

    def status(self) -> dict:
        with self._lock:
            connected = bool(self._serial is not None and getattr(self._serial, "is_open", False))
            return {
                "connected": connected,
                "port": self._port_path,
                "last_command": self._last_command,
                "error": self._last_error,
            }


# Module-level singleton consumed by server.py.
controller = LEDController()
