# VS Code Extension & Inspector

> Integrated Test Controller, inline CodeLens, Preflight Doctor panel, and live Mobile Inspector.

**Platforms:** all · **Badge:** IDE

## AI Summary

VS Code extension provides Test Controller, inline CodeLens, Global Run modal, and Axum Sidecar (Port 9230) for scrcpy video streaming.

---
## Test Controller & CodeLens

The TestSpectra VS Code extension integrates natively with VS Code's testing UI:

- **Inline CodeLens Buttons**: Click `▶ Run on Chrome` or `▶ Run on Pixel 7` directly above the `it()` block in the editor.
- **Real-Time Step Annotations**: Live execution status, elapsed durations, and failed step stack traces reflected inline.
- **Preflight Doctor Panel**: Visual status badge indicators for Bun, Chrome, ADB, and Sidecar health.
- **Spec Diagnostics**: Red/yellow squiggles with 1-click Quick Fixes for step parity, titles, imports, and script structure (powered by `spectra lint`).
- **Scaffolding**: Right-click any folder for `TestSpectra: New...` — suites, test cases, hooks, actions, steps, and Page Objects with correct templates.

---

## Global Run Dialog

Press `Cmd+Shift+P` and select **TestSpectra: Global Run Dialog**:
- Batch select multiple test suites and test cases via checkboxes.
- Switch target platform on the fly: `Web`, `Android`, or `iOS`.
- Concurrency is configured in `spectra.config.ts` (`maxConcurrentSessions`) or via `--concurrency`.

---

## Live Mobile Inspector

The extension mirrors your device screen live inside VS Code (served locally on port `9230)):

- **See and tap**: Watch the real screen and click any element to copy its selector straight into a Page Object.
- **Inspect while testing**: Keeps working alongside active test runs without conflicts.
