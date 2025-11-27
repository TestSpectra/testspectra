import { invoke } from "@tauri-apps/api/core";

const DEBUG_ENABLED = import.meta.env.DEV || import.meta.env.VITE_TS_DEBUG === "true";

export function logDebug(message: string): void {
  if (!DEBUG_ENABLED) return;

  // Always log to browser/DevTools console in dev/debug builds
  // so developers can see the flow immediately.
  // eslint-disable-next-line no-console
  console.debug("[TestSpectra][DEBUG]", message);

  // Best-effort: also send to Tauri backend so it ends up
  // in the same log file as Rust logs when running as desktop app.
  try {
    void invoke("log_frontend_event", { message });
  } catch {
    // Ignore errors if Tauri backend is not available (e.g. pure web build)
  }
}
