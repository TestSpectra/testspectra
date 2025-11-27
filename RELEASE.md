## TestSpectra Desktop Release

### 📦 Downloads

Download the appropriate installer for your platform from the assets below.

**macOS:**
- Apple Silicon (M1/M2/M3): `.dmg` file with `aarch64` in the name
- Intel: `.dmg` file with `x64` in the name

**Windows:**
- 64-bit: `.msi` installer file

### 🚀 Installation

**macOS:**
1. Download and open the DMG file
2. Drag TestSpectra to Applications folder
3. First launch: Right-click → Open (for Gatekeeper)

#### If you see "TestSpectra is damaged and can't be opened" on macOS

![Screenshot of macOS warning dialog "TestSpectra is damaged and can't be opened"](.github/assets/macos-gatekeeper-damaged.png)

Open Terminal and run this command, then try opening the app again:

```bash
xattr -cr "/Applications/TestSpectra.app"
```

**Windows:**
1. Download and run the MSI installer
2. Follow the installation wizard
3. Launch from Start Menu

### 🔧 Self-Hosted API Configuration

By default, TestSpectra connects to the official cloud API. If you're running a self-hosted backend:

1. Create config file in your home directory:
   - **macOS/Linux:** `~/Library/Application Support/TestSpectra/config.json`
   - **Windows:** `%APPDATA%\TestSpectra\config.json`

2. Add your API URL:
```json
{
  "api_url": "https://your-server.com/api"
}
```

3. Restart the app

### ✨ Built with
- Tauri v2
- React + TypeScript
- Rust backend
