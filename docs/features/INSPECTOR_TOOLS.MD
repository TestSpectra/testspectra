# Implementation Detail: Phase 1 - Inspector Tools

Following the shifted priority, Phase 1 focuses on delivering a unified debugging experience within **TestSpectra**. The goal is to provide a seamless environment for element discovery across Web and Mobile without external dependencies.

---

## 🔍 Feature Detail

### 1. Unified Inspector Workspace

A single dashboard within TestSpectra to launch and manage debugging sessions.

- **Web Inspector**: Leverages your custom library to inspect elements via the Chrome DevTools Protocol.
- **Mobile Inspector**: An embedded version of Appium Inspector, re-themed to match TestSpectra's Dark Mode UI.
- **Context-Aware Selection**: Automatically suggests the best selectors (ID, Accessibility ID, XPath, CSS) based on the target platform.

### 2. Mobile Inspector (Appium Integration)

Instead of a separate app, the mobile inspector is treated as a core module.

- **Live Preview**: Real-time screen mirroring of the connected Android Emulator or iOS Simulator.
- **XML Tree Explorer**: A navigable tree structure of the mobile application's UI hierarchy.
- **Action Recorder**: Ability to record taps and swipes to automatically generate WDIO test snippets.

### 3. On-Demand Component Loading

To keep the initial Tauri installer lightweight, the inspector binaries are not bundled by default.

- **Dynamic Fetch**: Downloads the specific inspector assets (headless server/scripts) only when the user clicks "Start Inspector" for the first time.
- **Version Pinning**: Ensures the downloaded inspector is always compatible with the current version of TestSpectra.

---

## 🛠️ Implementation Detail

### 1. Web Inspector (WebDriverIO Integration)

Instead of a complex port, we use a lightweight proxy server architecture.

- **Proxy Server (Node.js)**: A local MITM proxy server running on port 8888 that intercepts browser traffic and injects the inspector UI script.
- **Chrome DevTools Protocol**: Uses `webdriverio` to launch a Chrome instance connected to the proxy.
- **Graceful Lifecycle**: The proxy and browser processes are managed by Tauri (Rust). Closing the inspector in the UI automatically kills the browser session via `SIGTERM`/`SIGINT`.
- **Global Installation Support**: Automatically detects `webdriverio` from global npm packages (`nvm` compatible) to avoid bundling heavy dependencies.

```typescript
// Simplified Web Inspector Architecture
cli
  .command("open [url]", "Open inspector with wdio")
  .action(async (url) => {
    // 1. Launch Proxy Server
    // 2. Launch Chrome with --proxy-server=http://127.0.0.1:8888
    // 3. Inject Inspector UI into target pages
  });
```

### 2. Mobile Inspector (Appium Integration)

Implement a "Lazy Loading" system for the inspector tools using Rust.

```rust
#[tauri::command]
async fn ensure_inspector_ready(handle: tauri::AppHandle, tool_type: String) -> Result<bool, String> {
    let path = handle.path_resolver().app_data_dir().unwrap().join("bin").join(&tool_type);

    if !path.exists() {
        // Trigger download of zip from TestSpectra CDN
        download_and_extract_binary(&tool_type, &path).await?;
    }
    Ok(true)
}

```

### 3. UI/UX & Theming

- **Shadow DOM Encapsulation**: If the Web Inspector library uses different styles, encapsulate it to prevent CSS bleeding into the main TestSpectra UI.
- **CSS Variable Injection**: Inject TestSpectra's color palette (e.g., `#0052CC` for primary blue) into the ported Appium Inspector styles to ensure a native look and feel.

### 4. Integration with Test Independence

This tool directly supports your **Test Independence** best practice [cite: 2025-11-25].

- **Seeding-Ready Selectors**: When an element is inspected, the tool can check if that element belongs to a "Data Seeded" state, allowing for more resilient selectors.
- **Setup Script Generation**: Users can generate the "external setup" or "data seeding" scripts [cite: 2025-11-25] directly from actions performed in the inspector.
