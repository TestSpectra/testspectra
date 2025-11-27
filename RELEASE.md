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

By default, TestSpectra connects to the official cloud API. If you're running a self-hosted backend, configure the desktop app via the `config.env` file created in your user configuration folder.

On first launch, TestSpectra creates a `config.env` file with a default API URL. You can edit this file to point to your own server:

- **macOS:** `~/Library/Application Support/TestSpectra/config.env`
- **Windows:** `%APPDATA%\TestSpectra\config.env`
- **Linux:** `~/.config/TestSpectra/config.env`

Example contents:

```env
TEST_SPECTRA_API_URL=https://your-server.com/api
```

Cose and reopen TestSpectra after saving the file.


### ✨ Built with
- Tauri v2
- React + TypeScript
- Rust backend
