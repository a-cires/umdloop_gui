"""CC2 Backend — FastAPI application factory.

Creates the FastAPI app for the primary base station and mounts all routers.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    app = FastAPI(title="UMD Loop CC2 Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Import and mount routers
    from backend_cc2.ros2.bridge import router as ros2_router
    from backend_cc2.radio.router import router as radio_router
    from backend_cc2.spectrum.router import router as spectrum_router
    from backend_cc2.mission_sync.server import app as mission_sync_app

    app.include_router(ros2_router)
    app.include_router(radio_router)
    app.include_router(spectrum_router)
    app.mount("/mission-sync", mission_sync_app)

    @app.get("/health")
    async def health():
        return {"ok": True, "node": "cc2"}

    return app


app = create_app()
