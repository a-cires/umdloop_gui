"use client";

import React, { useEffect, useState } from "react";
import RamanPlot from "../../../spectrometer/RamanPlot";
import CameraFeed from "../../components/camera/CameraFeed";
import CameraManagerModal from "../../components/camera/CameraManagerModal";
import { CAMERA_ROLES } from "../../config";

const RAMAN_WS_URL = "ws://192.168.88.90:5001/ws/spectrum";

function ControlButton({ label, active, activeBackground = "#1a3f6f", activeBorder = "#1d4f80", onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: "8px",
        border: active ? `2px solid ${activeBorder}` : "2px solid #4a4a4a",
        background: active ? activeBackground : "#2f2f2f",
        color: "white",
        cursor: "pointer",
        padding: "10px 12px",
        fontSize: "13px",
        fontWeight: 800,
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}

export default function SpectrometerScientistView() {
  const [selectedSite, setSelectedSite] = useState("Site 1");
  const [laserOn, setLaserOn] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [showCameraManager, setShowCameraManager] = useState(false);
  const [fullscreenCam, setFullscreenCam] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setFullscreenCam(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const nightvisionCamera = { label: "Nightvision Camera", role: CAMERA_ROLES.SCIENCE_1 };
  const roverFrontCamera = { label: "Main Rover Camera", role: CAMERA_ROLES.FRONT };

  return (
    <div style={{ minHeight: 0, height: "100%", padding: "10px" }}>
      <div style={{ border: "1px solid #333", borderRadius: "10px", overflow: "hidden", background: "#1f1f1f", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", background: "#2b2b2b", borderBottom: "2px solid #1f1e1e", padding: "8px 12px" }}>
          <button
            onClick={() => setShowCameraManager(true)}
            style={{
              borderRadius: "9999px",
              border: "2px solid #0f2f55",
              background: "#1a3f6f",
              color: "white",
              cursor: "pointer",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            Camera Manager
          </button>
        </div>

        <div style={{ padding: "12px", height: "100%", minHeight: 0, background: "#1a1a1a", overflow: "auto" }}>
          <div style={{ width: "100%", border: "2px solid #3d3d3d", borderRadius: "14px", background: "#202020", padding: "12px", display: "grid", gridTemplateRows: "auto minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: "10px", minHeight: "100%" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: "20px", textAlign: "center", letterSpacing: "0.02em" }}>
              Spectrometer Scientist — {selectedSite}
            </div>

            <div style={{ background: "#232323", border: "2px solid #3d3d3d", borderRadius: "10px", padding: "10px", display: "grid", gridTemplateColumns: "minmax(180px, 220px) minmax(0, 1fr)", gap: "10px", minHeight: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ color: "#d9d9d9", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Site
                </div>
                <ControlButton
                  label="Site 1"
                  active={selectedSite === "Site 1"}
                  onClick={() => setSelectedSite("Site 1")}
                />
                <ControlButton
                  label="Site 2"
                  active={selectedSite === "Site 2"}
                  onClick={() => setSelectedSite("Site 2")}
                />

                <div style={{ height: "1px", background: "#3a3a3a", margin: "4px 0" }} />

                <div style={{ color: "#d9d9d9", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Spectrometer
                </div>
                <ControlButton
                  label={laserOn ? "Laser: ON" : "Laser: OFF"}
                  active={laserOn}
                  activeBackground="#7a1f1f"
                  activeBorder="#a31616"
                  onClick={() => setLaserOn((prev) => !prev)}
                />
                <ControlButton
                  label={collecting ? "Stop Collecting" : "Start Collecting"}
                  active={collecting}
                  activeBackground="#1f7a1f"
                  activeBorder="#2f9a2f"
                  onClick={() => setCollecting((prev) => !prev)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", gap: "8px", minHeight: 0 }}>
                <div style={{ color: "#e8e8e8", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Spectro Data
                </div>
                <div style={{ color: "white", fontSize: "18px", fontWeight: 800 }}>
                  {selectedSite}
                </div>
                <div style={{ minHeight: 0, borderRadius: "8px", overflow: "hidden", border: "1px solid #444", background: "#171717", padding: "8px" }}>
                  <RamanPlot wsUrl={RAMAN_WS_URL} width={1200} height={260} fillContainer />
                </div>
              </div>
            </div>

            <div style={{ background: "#232323", border: "2px solid #3d3d3d", borderRadius: "10px", padding: "8px", display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", gap: "6px", minHeight: 0 }}>
              <div style={{ color: "#e8e8e8", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Camera Feed
              </div>
              <div style={{ color: "white", fontSize: "20px", fontWeight: 800, lineHeight: 1.15 }}>
                {roverFrontCamera.label}
              </div>
              <CameraFeed
                role={roverFrontCamera.role}
                label={roverFrontCamera.label}
                onClick={() => setFullscreenCam(roverFrontCamera)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                  background: "black",
                  cursor: "pointer",
                }}
              />
            </div>

            <div style={{ background: "#232323", border: "2px solid #3d3d3d", borderRadius: "10px", padding: "8px", display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", gap: "6px", minHeight: 0 }}>
              <div style={{ color: "#e8e8e8", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Camera Feed
              </div>
              <div style={{ color: "white", fontSize: "20px", fontWeight: 800, lineHeight: 1.15 }}>
                {nightvisionCamera.label}
              </div>
              <CameraFeed
                role={nightvisionCamera.role}
                label={nightvisionCamera.label}
                onClick={() => setFullscreenCam(nightvisionCamera)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                  background: "black",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {fullscreenCam && (
        <div
          onClick={() => setFullscreenCam(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <h2 style={{ color: "white", fontSize: "22px", fontWeight: "bold", marginBottom: "12px" }}>{fullscreenCam.label}</h2>
          <CameraFeed
            role={fullscreenCam.role}
            label={fullscreenCam.label}
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              width: "min(1280px, 96vw)",
              height: "80vh",
              borderRadius: "12px",
              background: "black",
            }}
          />
        </div>
      )}

      {showCameraManager && <CameraManagerModal onClose={() => setShowCameraManager(false)} />}
    </div>
  );
}
