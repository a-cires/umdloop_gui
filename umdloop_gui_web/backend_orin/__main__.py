"""Entrypoint for the Orin Backend.

Usage:
    python -m backend_orin

Launches the FastAPI health server and manages the C++ camera
streaming process.
"""

import uvicorn

from .app import app
from .config import settings

if __name__ == "__main__":
    uvicorn.run(app, host=settings.host, port=settings.port)
