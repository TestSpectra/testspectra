# Quick Start - Tauri Updater

## 🚀 3-Step Setup

### 1️⃣ Generate Keys
```bash
pnpm generate-keys
```
Copy the public key from output.

### 2️⃣ Update Config
Edit `src-tauri/tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "PASTE_PUBLIC_KEY_HERE"
    }
  }
}
```

### 3️⃣ Add to GitHub Secrets
1. Go to: **Settings** → **Secrets** → **Actions**
2. Create: `TAURI_SIGNING_PRIVATE_KEY`
3. Value: Content of `~/.tauri/testspectra.key`

## 📦 Create Release

```bash
# 1. Update backend version only
# Edit backend/Cargo.toml: version = "0.1.27"

# 2. Commit and tag
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27"
git tag v0.1.27
git push origin main
git push origin v0.1.27

# 3. GitHub Actions automatically:
#    - Updates package.json, tauri.conf.json, Cargo.toml
#    - Builds and releases!
```

## ✅ How It Works

- **Version Check**: Major.minor must match, patch always compatible
- **Auto-Update**: Downloads from GitHub releases
- **User Experience**: Shows dialog → Downloads → Installs → Restarts

## 📚 Full Documentation

- Setup: `docs/UPDATER_SETUP_GUIDE.md`
- Technical: `docs/TAURI_UPDATER.md`
- Release: `docs/RELEASE_CHECKLIST.md`
