"use client";

import React from "react";

export default function MobilityPanel({
  avgWheelVelocity,
  wheelImbalanceDeg,
  rearSteerMismatchDeg,
  mobilityTrackingState,
  displayedWheelDiag,
  displayedSteerDiag,
  sendHardMotorStop,
  motorCommandStatus,
  displayedTilt,
  displayedImuDynamics,
  tiltWarning,
  safetyPercent,
}) {
  return (
    <>
      <div style={{ background: "#202020", border: "1px solid #3a3a3a", borderRadius: "12px", padding: "12px", height: "100%" }}>
        <div style={{ fontSize: "26px", color: "#ffffff", marginBottom: "12px", fontWeight: 900, letterSpacing: "0.5px" }}>Mobility Diagnostics (Wheel + Steering)</div>
        <div style={{ fontSize: "18px", color: "#bdbdbd", marginBottom: "10px" }}>Average wheel velocity: <b>{avgWheelVelocity.toFixed(2)} rad/s</b></div>
        <div style={{ fontSize: "18px", color: "#bdbdbd", marginBottom: "10px" }}>Wheel imbalance: <b>{wheelImbalanceDeg.toFixed(2)} rad/s</b> | Rear steer mismatch: <b>{rearSteerMismatchDeg.toFixed(1)} deg</b></div>
        <div style={{ fontSize: "18px", color: "#bdbdbd", marginBottom: "10px" }}>Tracking State: <b>{mobilityTrackingState}</b></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {["fl", "fr", "rl", "rr"].map((key) => {
            const hasSteering = key === "rl" || key === "rr";
            return (
              <div key={key} style={{ background: "#2a2a2a", border: "1px solid #3f3f3f", borderRadius: "8px", padding: "8px" }}>
                <div style={{ fontWeight: 800, color: "white", fontSize: "18px", marginBottom: "6px" }}>{key.toUpperCase()}</div>
                <div style={{ fontSize: "18px", color: "#d8d8d8" }}>Wheel vel: {displayedWheelDiag[key].velocity.toFixed(2)} rad/s</div>
                <div style={{ fontSize: "18px", color: "#d8d8d8" }}>Wheel curr: {displayedWheelDiag[key].current.toFixed(2)} A</div>
                {hasSteering ? (
                  <>
                    <div style={{ fontSize: "18px", color: "#d8d8d8" }}>Steer orient: {displayedSteerDiag[key].orientationDeg.toFixed(1)} deg</div>
                    <div style={{ fontSize: "18px", color: "#d8d8d8" }}>Steer curr: {displayedSteerDiag[key].current.toFixed(2)} A</div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
        <div style={{ background: "#202020", border: "1px solid #3a3a3a", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column" }}>
          <style>
            {`
              .estop-button {
                flex: 1;
                min-height: 260px;
                width: 100%;
                border-radius: 16px;
                border: 4px solid #4a0000;
                background: radial-gradient(circle at 50% 35%, #ef4444 0%, #b91c1c 55%, #7f1d1d 100%);
                color: white;
                padding: 20px;
                font-weight: 900;
                font-size: 64px;
                letter-spacing: 0.08em;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(220, 38, 38, 0.45), inset 0 -8px 16px rgba(0, 0, 0, 0.35), inset 0 4px 12px rgba(255, 255, 255, 0.18);
                text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
                text-transform: uppercase;
                transition: transform 120ms ease, box-shadow 200ms ease, background 200ms ease, border-color 200ms ease;
                will-change: transform, box-shadow;
              }
              .estop-button:hover {
                transform: translateY(-2px) scale(1.015);
                border-color: #ff5252;
                background: radial-gradient(circle at 50% 32%, #ff6b6b 0%, #dc2626 55%, #991b1b 100%);
                box-shadow: 0 18px 42px rgba(239, 68, 68, 0.6), 0 0 0 6px rgba(239, 68, 68, 0.18), inset 0 -10px 18px rgba(0, 0, 0, 0.35), inset 0 6px 14px rgba(255, 255, 255, 0.25);
              }
              .estop-button:active {
                transform: translateY(2px) scale(0.985);
                background: radial-gradient(circle at 50% 38%, #b91c1c 0%, #7f1d1d 55%, #450a0a 100%);
                box-shadow: 0 4px 10px rgba(127, 29, 29, 0.55), inset 0 6px 14px rgba(0, 0, 0, 0.55), inset 0 -2px 6px rgba(255, 255, 255, 0.05);
              }
              .estop-button:focus-visible {
                outline: none;
                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.85), 0 18px 42px rgba(239, 68, 68, 0.6), inset 0 -10px 18px rgba(0, 0, 0, 0.35);
              }
            `}
          </style>
          <button
            type="button"
            className="estop-button"
            onClick={sendHardMotorStop}
            aria-label="Emergency stop. Sends hard motor stop burst across drive topics."
          >
            E-STOP
          </button>
          <div style={{ marginTop: "10px", color: motorCommandStatus.startsWith("Stop failed") ? "#ff8080" : "#d8d8d8", fontSize: "17px", textAlign: "center" }}>{motorCommandStatus}</div>
        </div>

        <div style={{ background: "#202020", border: "1px solid #3a3a3a", borderRadius: "12px", padding: "12px" }}>
          <div style={{ fontSize: "20px", color: "#cfcfcf", marginBottom: "10px", fontWeight: 800 }}>Safety + Stability</div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>Front-to-back tilt: <b>{displayedTilt.pitchDeg.toFixed(2)} deg</b></div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>Left-to-right tilt: <b>{displayedTilt.rollDeg.toFixed(2)} deg</b></div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>X-Y plane tilt magnitude: <b>{displayedTilt.magnitudeDeg.toFixed(2)} deg</b></div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>Tilt vector: <b>{displayedTilt.vectorLabel}</b></div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>IMU yaw rate: <b>{displayedImuDynamics.yawRateDegs.toFixed(1)} deg/s</b></div>
          <div style={{ fontSize: "19px", color: "#d8d8d8" }}>Accel magnitude: <b>{displayedImuDynamics.accelMagnitude.toFixed(2)} m/s^2</b> | State: <b>{displayedImuDynamics.accelState}</b></div>
          <div style={{ marginTop: "6px", fontSize: "19px", color: tiltWarning ? "#ff8080" : "#9df79d", fontWeight: 800 }}>{tiltWarning ? "TILT WARNING ACTIVE" : "Tilt within safe range"}</div>
          <div style={{ marginTop: "6px", fontSize: "18px", color: "#d8d8d8" }}>Stability State: <b>{displayedTilt.magnitudeDeg > 10 ? "CRITICAL" : displayedTilt.magnitudeDeg > 6 ? "CAUTION" : "NOMINAL"}</b></div>
          <div style={{ marginTop: "6px", fontSize: "19px", color: "#d8d8d8" }}>Area of Safety</div>
          <div style={{ width: "100%", height: "10px", borderRadius: "999px", background: "#2a2a2a", border: "1px solid #444", overflow: "hidden" }}>
            <div style={{ width: `${safetyPercent}%`, height: "100%", background: tiltWarning ? "#b91c1c" : "#15803d" }} />
          </div>
        </div>
      </div>
    </>
  );
}
