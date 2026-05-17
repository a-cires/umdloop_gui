"use client";

import React from "react";

// Visual swatch colors that match the LED presets defined in useLedController.
const PRESET_SWATCHES = {
  GREEN: "#22c55e",
  RED:   "#ef4444",
  BLUE:  "#3b82f6",
};

export default function DiagnosticsPanel({
  led,
  systemChecks,
}) {
  const showsRate = led.mode === "FLASH" || led.mode === "PULSE";
  const usbLinkLabel = led.hardware.connected
    ? `USB LED CONNECTED${led.hardware.port ? ` (${led.hardware.port})` : ""}`
    : "USB LED DISCONNECTED";
  const usbLinkColor = led.hardware.connected ? "#9df79d" : "#ff8080";

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
        <div style={{ background: "#202020", border: "1px solid #3a3a3a", borderRadius: "12px", padding: "12px" }}>
          <div style={{ fontSize: "20px", color: "#cfcfcf", marginBottom: "10px", fontWeight: 800 }}>Status Indicators</div>

          {/* Color preset row */}
          <div style={{ fontSize: "15px", color: "#9ca3af", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Color</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {Object.keys(led.presets).map((presetKey) => {
              const isActive = led.preset === presetKey;
              return (
                <button
                  key={presetKey}
                  onClick={() => led.setPreset(presetKey)}
                  style={{
                    flex: 1,
                    minWidth: "72px",
                    borderRadius: "8px",
                    border: isActive ? "2px solid #fff" : "1px solid #555",
                    padding: "8px 6px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: isActive ? PRESET_SWATCHES[presetKey] || "#6d1111" : "#2f2f2f",
                    color: "white",
                  }}
                >
                  {presetKey}
                </button>
              );
            })}
          </div>

          {/* Mode row */}
          <div style={{ fontSize: "15px", color: "#9ca3af", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Mode</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {led.modes.map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => led.setMode(modeKey)}
                style={{
                  flex: 1,
                  minWidth: "72px",
                  borderRadius: "8px",
                  border: led.mode === modeKey ? "2px solid #fff" : "1px solid #555",
                  padding: "8px 6px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: led.mode === modeKey ? "#1f3a8a" : "#2f2f2f",
                  color: "white",
                }}
              >
                {modeKey}
              </button>
            ))}
          </div>

          {/* Rate slider (FLASH/PULSE only) */}
          {showsRate ? (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", color: "#9ca3af", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                <span>Rate</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{led.rateHz.toFixed(1)} Hz</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={led.rateHz}
                onChange={(e) => led.setRateHz(parseFloat(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          ) : null}

          <div style={{ marginTop: "8px", color: "#d8d8d8", fontSize: "18px" }}>
            Active: <span style={{ fontWeight: 800, color: "#fff" }}>{led.preset} / {led.mode}{showsRate ? ` @ ${led.rateHz.toFixed(1)} Hz` : ""}</span>
          </div>
          <div style={{ marginTop: "6px", color: usbLinkColor, fontSize: "16px", fontWeight: 800 }}>{usbLinkLabel}</div>
          {led.lastSendError ? (
            <div style={{ marginTop: "4px", color: "#fca5a5", fontSize: "14px" }}>Last error: {led.lastSendError}</div>
          ) : null}
        </div>

        <div style={{ background: "#202020", border: "1px solid #3a3a3a", borderRadius: "12px", padding: "12px" }}>
          <div style={{ fontSize: "20px", color: "#cfcfcf", marginBottom: "10px", fontWeight: 800 }}>Chassis Subcomponent Checks</div>
          {systemChecks.map((check) => (
            <div key={check.name} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #2d2d2d", fontSize: "19px" }}>
              <span style={{ color: "#ddd" }}>{check.name}</span>
              <span style={{ color: check.ok ? "#9df79d" : "#ff8080", fontWeight: 800 }}>{check.ok ? "PASS" : "CHECK"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
