"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLedStatus, sendLedCommand } from "../lib/api";

// Color presets shown on the technician dashboard.
// Tuned to roughly match the legacy GREEN / AMBER / RED / BLUE language used
// elsewhere in the GUI while staying readable on the NeoPixel strip.
export const LED_PRESETS = {
  GREEN:  { label: "GREEN",  rgb: [0,   255, 0]   },
  AMBER:  { label: "AMBER",  rgb: [255, 140, 0]   },
  RED:    { label: "RED",    rgb: [255, 0,   0]   },
  BLUE:   { label: "BLUE",   rgb: [0,   0,   255] },
  WHITE:  { label: "WHITE",  rgb: [255, 255, 255] },
  CYAN:   { label: "CYAN",   rgb: [0,   255, 255] },
  PURPLE: { label: "PURPLE", rgb: [180, 0,   255] },
};

export const LED_MODES = ["SOLID", "FLASH", "PULSE", "OFF"];

const STATUS_POLL_MS = 4000;

export function useLedController({ initialPreset = "GREEN", initialMode = "SOLID", initialRateHz = 2.0 } = {}) {
  const [preset, setPreset] = useState(initialPreset);
  const [mode, setMode] = useState(initialMode);
  const [rateHz, setRateHz] = useState(initialRateHz);
  const [hardware, setHardware] = useState({ connected: false, port: null, error: null, lastCommand: null });
  const [lastSendError, setLastSendError] = useState(null);

  const dirtyRef = useRef(false);

  const buildPayload = useCallback((nextPreset, nextMode, nextRate) => {
    const rgb = LED_PRESETS[nextPreset]?.rgb ?? [0, 255, 0];
    return {
      mode: nextMode,
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
      rateHz: nextRate,
    };
  }, []);

  const push = useCallback(async (nextPreset, nextMode, nextRate) => {
    try {
      const result = await sendLedCommand(buildPayload(nextPreset, nextMode, nextRate));
      if (result?.ok) {
        setLastSendError(null);
      } else {
        setLastSendError(result?.error || "LED command failed");
      }
      setHardware({
        connected: !!result?.connected,
        port: result?.port ?? null,
        error: result?.error ?? null,
        lastCommand: result?.last_command ?? null,
      });
    } catch (err) {
      setLastSendError(err?.message || "Network error");
      setHardware((prev) => ({ ...prev, connected: false, error: err?.message || "Network error" }));
    }
  }, [buildPayload]);

  // Push whenever the user-facing state changes (after the first render so we
  // don't fire a command on initial mount before the page is visible).
  useEffect(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      return;
    }
    push(preset, mode, rateHz);
  }, [preset, mode, rateHz, push]);

  // Poll backend status so the panel reflects USB connect/disconnect.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await getLedStatus();
        if (cancelled || !result?.ok) return;
        setHardware({
          connected: !!result.connected,
          port: result.port ?? null,
          error: result.error ?? null,
          lastCommand: result.last_command ?? null,
        });
      } catch (_) {
        if (!cancelled) {
          setHardware((prev) => ({ ...prev, connected: false }));
        }
      }
    };
    tick();
    const id = setInterval(tick, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return {
    preset,
    setPreset,
    mode,
    setMode,
    rateHz,
    setRateHz,
    hardware,
    lastSendError,
    presets: LED_PRESETS,
    modes: LED_MODES,
  };
}
