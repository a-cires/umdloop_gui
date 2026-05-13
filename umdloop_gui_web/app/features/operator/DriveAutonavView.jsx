"use client";

import React, { useEffect, useRef, useState } from "react";
import ROSLIB from "roslib";
import CameraFeed from "../../components/camera/CameraFeed";
import MissionPanel from "../../components/mission/MissionPanel";
import { CAMERA_ROLES, getRosbridgeUrl } from "../../config";

const ZED_IMAGE_TOPIC = "/zed/zed_node/rgb/color/rect/image/compressed";

function RosImageFeed({ label, style, onClick }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const ros = new ROSLIB.Ros({ url: getRosbridgeUrl() });
    ros.on("connection", () => setStatus(null));
    ros.on("error", () => setStatus("ROS error"));
    ros.on("close", () => setStatus("ROS disconnected"));

    const topic = new ROSLIB.Topic({
      ros,
      name: ZED_IMAGE_TOPIC,
      messageType: "sensor_msgs/msg/CompressedImage",
      throttle_rate: 67,
    });

    topic.subscribe((msg) => {
      const now = performance.now();
      if (now - lastFrameRef.current < 67) return;
      lastFrameRef.current = now;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
      };
      img.src = `data:image/${msg.format || "jpeg"};base64,${msg.data}`;
    });

    return () => {
      topic.unsubscribe();
      ros.close();
    };
  }, []);

  return (
    <div style={{ position: "relative", background: "#111", borderRadius: 10, overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }} onClick={onClick}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: status ? "none" : "block" }} />
      {status && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 12, fontWeight: 700, gap: 6 }}>
          <span>{label}</span>
          <span style={{ color: "#555" }}>{status}</span>
        </div>
      )}
      {!status && label && (
        <div style={{ position: "absolute", left: 8, bottom: 8, fontSize: 11, fontWeight: 700, color: "white", background: "rgba(0,0,0,0.55)", padding: "3px 7px", borderRadius: 9999 }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function DriveAutonavView({
  selectedSubsystem,
  setSelectedSubsystem,
  setFullscreenCam,
  getCameraRotation,
  emergencyStop,
  setEmergencyStop,
  setShowCameraManager,
}) {
  const wheelGroups = [
    { label: "Top Left Wheel", role: CAMERA_ROLES.WHEEL_TL },
    { label: "Top Right Wheel", role: CAMERA_ROLES.WHEEL_TR },
    { label: "Bottom Left Wheel", role: CAMERA_ROLES.WHEEL_BL },
    { label: "Bottom Right Wheel", role: CAMERA_ROLES.WHEEL_BR },
  ];

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", gap: "8px", padding: "8px", minHeight: 0, height: "100%", background: "#1a1a1a" }}>
      <div style={{ background: "#232323", border: "1px solid #3d3d3d", borderRadius: "10px", padding: "8px" }}>
        <div style={{ fontSize: "11px", color: "#ddd", marginBottom: "6px", fontWeight: 800 }}>Control State + Safety</div>
        <button
          onClick={() => setEmergencyStop((prev) => !prev)}
          style={{ width: "100%", borderRadius: "8px", border: "1px solid #803737", padding: "7px", cursor: "pointer", background: emergencyStop ? "#a31616" : "#3a3a3a", color: "white", fontWeight: 900 }}
        >
          {emergencyStop ? "EMERGENCY STOP ACTIVE" : "Emergency Stop"}
        </button>
      </div>

      <div style={{ background: "#232323", border: "1px solid #3d3d3d", borderRadius: "10px", padding: "8px 12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <MissionPanel />
        <div style={{ width: "1px", height: "18px", background: "#4a4a4a" }} />
        <span style={{ fontSize: "11px", color: "#ddd", fontWeight: 800 }}>View:</span>
        <button onClick={() => setSelectedSubsystem?.("Drive (Default)")} style={{ borderRadius: "6px", border: "1px solid #555", background: selectedSubsystem === "Drive (Default)" ? "#7c1919" : "#303030", color: "white", cursor: "pointer", padding: "4px 10px", fontSize: "11px" }}>Drive</button>
        <button onClick={() => setSelectedSubsystem?.("Drive (Autonav)")} style={{ borderRadius: "6px", border: "1px solid #555", background: selectedSubsystem === "Drive (Autonav)" ? "#7c1919" : "#303030", color: "white", cursor: "pointer", padding: "4px 10px", fontSize: "11px" }}>Drive Autonav</button>
        <button onClick={() => setSelectedSubsystem?.("Drive (Science)")} style={{ borderRadius: "6px", border: "1px solid #555", background: selectedSubsystem === "Drive (Science)" ? "#7c1919" : "#303030", color: "white", cursor: "pointer", padding: "4px 10px", fontSize: "11px" }}>Drive Science</button>
        <button onClick={() => setSelectedSubsystem?.("Arm")} style={{ borderRadius: "6px", border: "1px solid #555", background: selectedSubsystem === "Arm" ? "#7c1919" : "#303030", color: "white", cursor: "pointer", padding: "4px 10px", fontSize: "11px" }}>Arm</button>
        <button onClick={() => setShowCameraManager(true)} style={{ borderRadius: "6px", border: "1px solid #555", background: "#1a3f6f", color: "white", cursor: "pointer", padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}>Camera Manager</button>
      </div>

      <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)", gap: "6px", minHeight: 0, height: "100%" }}>
        <RosImageFeed
          label="ZED Front (ROS)"
          style={{ height: "100%", border: "1px solid #3d3d3d" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "6px", minHeight: 0 }}>
          {wheelGroups.map((wheel) => (
            <div key={wheel.label} style={{ background: "#2b2b2b", borderRadius: "10px", border: "1px solid #3d3d3d", padding: "4px", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ color: "white", fontSize: "8px", fontWeight: 700, textAlign: "center", marginBottom: "2px" }}>{wheel.label}</div>
              <CameraFeed
                role={wheel.role}
                label={wheel.label}
                rotateDeg={getCameraRotation(wheel)}
                onClick={() => setFullscreenCam({ label: wheel.label, role: wheel.role })}
                style={{ flex: 1, borderRadius: 4, border: "1px solid #3d3d3d", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px", minHeight: 0 }}>
          {[
            { label: "Back Camera", role: CAMERA_ROLES.BACK },
            { label: "Left Side", role: CAMERA_ROLES.LEFT_SIDE },
            { label: "Right Side", role: CAMERA_ROLES.RIGHT_SIDE },
            { label: "Radio View", role: CAMERA_ROLES.RADIO_VIEW },
          ].map((cam) => (
            <CameraFeed
              key={cam.role}
              role={cam.role}
              label={cam.label}
              rotateDeg={getCameraRotation(cam)}
              onClick={() => setFullscreenCam(cam)}
              style={{ height: "100%", cursor: "pointer", border: "1px solid #3d3d3d" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
