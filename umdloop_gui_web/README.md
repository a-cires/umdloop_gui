# UMD Loop GUI — Backend Architecture

## Overview

The backend is split into three separate services, each deployed to a different machine in the system. They communicate over the local network (192.168.88.x/24).

| Backend | Machine | Hardware | Port | Role |
|---------|---------|----------|------|------|
| `backend_cc2` | CC2 | Mini-PC | 5000 | Primary base station. Mission authority, ROS2 bridge, radio telemetry, drone control. |
| `backend_cc1` | CC1 | Raspberry Pi 5 | — | Secondary station. No backend required — browser connects directly to CC2 and Orin. |
| `backend_orin` | Orin | Jetson Orin | 5002 (Python) / 8081 (camera WS) | Rover-side. Camera streaming, health, mission sync client. |

## Network Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Local Network (192.168.88.x)                  │
│                                                                     │
│   ┌──────────┐         ┌──────────┐         ┌──────────────────┐   │
│   │   CC1    │         │   CC2    │         │      Orin        │   │
│   │  (rpi5)  │◄───────►│ (mini-pc)│◄───────►│ (Jetson, rover)  │   │
│   └──────────┘         └──────────┘         └────────┬─────────┘   │
│                                                      │              │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │ CAN bus
                                                       ▼
                                              Rover electrical &
                                              avionics systems
```

## Machine Responsibilities

### CC2 — Primary Base Station

CC2 is the main operator computer. It runs the authoritative backend and is the single source of truth for mission state.

**Services:**
- **Radio telemetry** (`radio/`) — Polls MikroTik radio for link quality, RSSI, CCQ.
- **ROS2 bridge** (`ros2/`) — Connects to the rover's rosbridge (TCP, port 9090) to access ROS2 topics. Used for rover position, navigation goals, and the technician screen.
- **Mission sync server** (`mission_sync/`) — WebSocket server that broadcasts the active mission to all connected clients (CC1 browser, Orin).
- **Drone control** (`drone/`) — Future. Drone-related software runs exclusively on CC2.
- **Spectrum** (`spectrum/`) — Raman spectrometer data. Data originates on the Orin and is forwarded to CC2 (transport TBD).

**ROS2 bandwidth considerations:**
The rosbridge protocol operates over TCP WebSocket, which avoids the DDS/UDP multicast discovery storm that can saturate the radio link. If direct ROS2 node access is ever needed from CC2, use a DDS configuration that restricts discovery to explicit peer lists (`FASTRTPS_DEFAULT_PROFILES_FILE` or CycloneDDS peer config) rather than relying on multicast. For now, rosbridge-over-TCP is the safe default.

### CC1 — Secondary Station

CC1 is a Raspberry Pi 5 used as a secondary operator display. It does **not** run its own backend. The browser on CC1 connects directly to:
- `CC2:5000` for radio, ROS2, mission state, and spectrum data.
- `Orin:8081` for camera WebRTC signaling (direct WebSocket to the C++ camera backend).

This keeps CC1 lightweight — it only needs to serve the Next.js frontend statically.

### Orin — Rover

The Orin sits on the rover and handles camera streaming plus local orchestration.

**Services:**
- **Camera streaming** (`camera_streaming/`, C++) — GStreamer/WebRTC backend. Discovers USB cameras, negotiates WebRTC with browser clients, streams H.264 video. Runs as a separate process on port 8081. Managed (start/stop/restart) by the `backend_orin` Python service.
- **Health & status** — Minimal FastAPI app on port 5002. Provides liveness/readiness endpoints.
- **Mission sync client** — Subscribes to CC2's mission sync WebSocket. Can use the active mission to load camera presets automatically.

## Directory Structure

```
umdloop_gui_web/
├── backend_common/                  # Shared code imported by all backends
│   ├── __init__.py
│   ├── base_config.py               # Shared pydantic-settings base
│   └── models/
│       ├── __init__.py
│       ├── mission_state.py
│       ├── monitor_config.py
│       ├── radio_status.py
│       └── rover_position.py
│
├── backend_cc2/                     # Primary backend — runs on CC2
│   ├── __init__.py
│   ├── __main__.py                  # python -m backend_cc2 → uvicorn on :5000
│   ├── app.py                       # FastAPI app factory
│   ├── config.py                    # CC2-specific env vars (UMDLOOP_CC2_ prefix)
│   ├── radio/
│   │   ├── __init__.py
│   │   └── router.py
│   ├── ros2/
│   │   ├── __init__.py
│   │   └── bridge.py
│   ├── spectrum/
│   │   ├── __init__.py
│   │   └── router.py
│   ├── drone/                       # Future
│   │   └── __init__.py
│   └── mission_sync/
│       ├── __init__.py
│       ├── server.py                # WebSocket server, authoritative state
│       └── state.py                 # Persistence + validation
│
├── backend_orin/                    # Rover backend — runs on Orin
│   ├── __init__.py
│   ├── __main__.py                  # python -m backend_orin → uvicorn on :5002
│   ├── app.py                       # Health endpoints + camera process mgmt
│   ├── config.py                    # Orin-specific env vars
│   ├── mission_sync_client.py       # Subscribes to CC2 mission sync
│   └── camera_streaming/            # C++ camera backend (built separately)
│       ├── CMakeLists.txt
│       ├── asyncapi.yaml
│       ├── missions.json
│       ├── run.sh
│       ├── include/
│       │   ├── CameraConfig.hpp
│       │   ├── CameraManager.hpp
│       │   ├── CameraPipeline.hpp
│       │   ├── MissionConfig.hpp
│       │   ├── MissionManager.hpp
│       │   ├── PlatformDetect.hpp
│       │   └── WsServer.hpp
│       ├── src/
│       │   ├── main.cpp
│       │   ├── CameraManager.cpp
│       │   ├── CameraPipeline.cpp
│       │   ├── MissionManager.cpp
│       │   └── WsServer.cpp
│       ├── third_party/
│       │   └── nlohmann/json.hpp
│       └── web/
│           └── index.html
```

## Communication Flow

```
┌────────────────┐   HTTP/WS    ┌────────────────┐  WS (rosbridge)  ┌───────────┐
│ Browser on CC2 │─────────────►│  backend_cc2   │─────────────────►│   Orin    │
│ or CC1         │              │  :5000         │                  │ rosbridge │
└───────┬────────┘              └───────┬────────┘                  │ :9090     │
        │                               │                           └───────────┘
        │  WebRTC signaling (WS)        │ WS (mission sync)
        │                               ▼
        │                       ┌────────────────┐
        └──────────────────────►│  backend_orin  │
           direct to :8081      │  :5002 + :8081 │
                                └────────────────┘
```

- **Browser → CC2:5000** — Radio status, ROS2 data, spectrum, mission sync.
- **Browser → Orin:8081** — Camera WebRTC signaling (direct, low-latency).
- **CC2 → Orin:9090** — ROS2 topic access via rosbridge over TCP.
- **Orin → CC2:5000** — Mission sync client subscription.

## Running

### CC2

```bash
cd umdloop_gui_web
python -m backend_cc2
```

Environment variables (prefix `UMDLOOP_CC2_`):
- `UMDLOOP_CC2_HOST` — bind address (default `0.0.0.0`)
- `UMDLOOP_CC2_PORT` — HTTP port (default `5000`)
- `UMDLOOP_CC2_MIKROTIK_HOST` — MikroTik router IP
- `UMDLOOP_CC2_MIKROTIK_USER` / `UMDLOOP_CC2_MIKROTIK_PASS` — router credentials
- `UMDLOOP_CC2_ROSBRIDGE_HOST` — Orin IP for rosbridge (default `localhost`)
- `UMDLOOP_CC2_ROSBRIDGE_PORT` — rosbridge port (default `9090`)

### Orin

```bash
# Build the C++ camera backend (one-time)
cd umdloop_gui_web/backend_orin/camera_streaming
cmake -B build -G Ninja
cmake --build build

# Run the Python orchestrator (starts camera backend automatically)
cd umdloop_gui_web
python -m backend_orin
```

Environment variables (prefix `UMDLOOP_ORIN_`):
- `UMDLOOP_ORIN_HOST` — bind address (default `0.0.0.0`)
- `UMDLOOP_ORIN_PORT` — Python health server port (default `5002`)
- `UMDLOOP_ORIN_CAMERA_WS_PORT` — camera backend WS port (default `8081`)
- `UMDLOOP_ORIN_CC2_HOST` — CC2 IP for mission sync (default `192.168.88.10`)
- `UMDLOOP_ORIN_STUN_IP` — STUN/TURN server IP (optional, for WebRTC NAT traversal)

### CC1

No backend to run. Serve the Next.js frontend and point it at CC2/Orin:

```bash
cd umdloop_gui_web
npm run build
npm run start
```

The frontend configuration should set:
- API base URL → `http://<CC2_IP>:5000`
- Camera WS URL → `ws://<ORIN_IP>:8081`

## Design Decisions

1. **Three backends, not one** — CC2 and Orin have fundamentally different hardware, dependencies, and responsibilities. A monolithic backend would require conditional logic and unused dependencies on each machine.

2. **CC1 has no backend** — It's an rpi5 acting as a secondary display. The browser connects directly to CC2 and Orin. This avoids duplicating logic and keeps CC1's resource usage minimal.

3. **Camera streaming stays C++** — GStreamer + WebRTC at low latency with hardware encoding (nvv4l2h264enc on Jetson) requires native code. The Python `backend_orin` manages the C++ process lifecycle but doesn't reimplement streaming.

4. **Mission sync is WebSocket-based** — CC2 is authoritative. Clients (browser, Orin) subscribe and receive pushes. No polling.

5. **ROS2 via rosbridge (TCP)** — Avoids DDS multicast discovery flooding the radio link. The rosbridge WebSocket protocol gives us topic pub/sub without requiring ROS2 installed on CC2.

6. **Shared models in `backend_common`** — Pydantic models for mission state, radio status, etc. are shared so CC2 and Orin agree on data shapes without duplication.

## Migration from Old Backend

The original monolithic `backend/` directory is being replaced by the split
architecture. The new packages live at:
- `backend_common/`
- `backend_cc2/`
- `backend_orin/`

The root-level `camera-streaming-backend/` directory is the original standalone
repo. Its code has been integrated into `backend_orin/camera_streaming/`. The
root copy can be removed once the migration is confirmed working.

## Future Work

- **Drone control** — CC2-only module, details TBD.
- **Spectrum data transport** — Orin → CC2 path not yet defined. Will be added to `backend_cc2/spectrum/` and sourced from the Orin.
- **ROS2 discovery optimization** — If rosbridge proves insufficient, switch to direct ROS2 with restricted DDS peer lists to prevent discovery bandwidth explosion.
