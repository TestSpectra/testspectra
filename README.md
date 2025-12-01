
  # TestSpectra

  TestSpectra is a QA automation platform UI built with React, Vite, and Tauri.
  This repository contains both the web frontend and the desktop (Tauri) app.

  ## Tech stack

  - React 18 + TypeScript
  - Vite
  - TailwindCSS + Radix UI + shadcn/ui-style components
  - Tauri v2 (Rust) for the desktop application

  ## Prerequisites

  - Node.js 20+
  - pnpm (recommended)
  - Rust toolchain (for Tauri desktop build)

  ## Installation

  Install dependencies with pnpm:

  ```bash
  pnpm install
  ```

  ## Running the web app (Vite)

  Start the web frontend only:

  ```bash
  pnpm dev
  ```

  This runs the Vite dev server (see console output for the exact URL/port).

  ## Running the desktop app (Tauri dev)

  To run the Tauri desktop app in development mode:

  ```bash
  pnpm tauri:dev
  ```

  Tauri is configured in `src-tauri/tauri.conf.json` to use the Vite dev server
  (`beforeDevCommand: "pnpm dev"`).

  ## Building for production

  Build the web app bundle:

  ```bash
  pnpm build
  ```

  Build desktop installers (macOS, Windows, Linux) with Tauri:

  ```bash
  pnpm tauri:build
  ```

  Release artifacts and platform-specific details are documented in `RELEASE.md`.

  ## Backend API configuration

  - The web app uses an API URL provided via environment configuration
    (for example `VITE_API_URL`).
  - The desktop app reads its runtime API URL from a `config.env` file in the
    user configuration directory; see `RELEASE.md` for OS‑specific paths and
    examples.

  ## Auto-updates

  The desktop app includes automatic update functionality:

  - Updates are distributed via GitHub Releases
  - Version compatibility is checked against the backend server
  - Patch versions (0.1.x) are always compatible within the same major.minor
  - When an incompatible version is detected, users are prompted to update
  - Updates download and install automatically with progress indication

  For setup and configuration details, see `docs/TAURI_UPDATER.md`.
  