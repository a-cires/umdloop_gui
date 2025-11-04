## Getting Started
Install These Dependencies
```bash
Python v3.12
React
Node.js
OpenCV
Numpy
ROS2 Humble
```

Navigate into the web gui folder:

```bash
cd umdloop_gui-main
cd umdloop_gui_web
```

Run the development server:

```bash
npm install
npm run dev
```

Run the web server:

```bash
python ./server.py
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Field deployment (base station ↔ rover)

- **Base station** runs this GUI and has internet (for map tiles).
- **Rover** has no internet; it runs ROS 2 and Rosbridge.

So that the map shows the rover’s location, the GUI connects to the rover over your radio link:

1. On the **rover**: run Rosbridge (e.g. `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`) so it serves WebSocket on the rover’s IP (e.g. port 9090).
2. Put rover and base station on the same network over radio (Wi‑Fi bridge, mesh, or modem so the base can reach the rover’s IP).
3. On the **base station**, set the Rosbridge URL to the rover’s address. Create `umdloop_gui_web/.env.local`:

   ```bash
   NEXT_PUBLIC_ROSBRIDGE_WS_URL=ws://ROVER_IP:9090
   ```

   Replace `ROVER_IP` with the rover’s IP on that network (e.g. `192.168.1.100`). Then rebuild/restart the GUI.

The Map view subscribes to `/gps/fix` (NavSatFix) from the rover over that connection and shows the rover as a green marker. Ensure the rover publishes `/gps/fix` (e.g. from the localization stack or GPS driver).
