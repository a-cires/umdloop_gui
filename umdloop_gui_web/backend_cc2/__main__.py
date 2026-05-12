"""Entrypoint for the CC2 Backend.

Usage:
    python -m backend_cc2

Launches the FastAPI app via uvicorn.
"""

import uvicorn

from .app import app
from .config import settings

if __name__ == "__main__":
    uvicorn.run(app, host=settings.host, port=settings.port)
