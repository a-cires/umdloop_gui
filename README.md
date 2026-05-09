# camera-streaming-backend

WebRTC camera streaming backend using GStreamer and WebSockets.

## Dependencies

### Linux (Ubuntu/Debian)

```bash
sudo apt install \
    cmake ninja-build pkg-config \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    gstreamer1.0-nice \
    libwebsockets-dev \
    libssl-dev
```
No idea if those are right.

### macOS via brew install

```bash
brew install cmake ninja pkg-config \
    gstreamer \
    libwebsockets \
    openssl
```

## Build

```bash
cmake -B build -G Ninja
cmake --build build
```

## Run

```bash
./build/camera-stream [--ws-port <port>]
```

## Verify Camera Discovery

On the Jetson or Linux host with the cameras attached:

```bash
v4l2-ctl --list-devices
./build/camera-stream [--ws-port <port>]
```

During startup, discovery logs each physical device name, `/dev/video*` path,
stable USB key, accepted/skipped status, and skip reason. The GUI receives only
the accepted active cameras in `state.cameras`; stale `cameras.json` entries and
duplicate nodes from the same physical camera are not sent.

For a ZED 2i, only the selected left/preferred capture node should be accepted.
Right-view, metadata, and duplicate nodes should appear as skipped discovery
entries in the backend log.
