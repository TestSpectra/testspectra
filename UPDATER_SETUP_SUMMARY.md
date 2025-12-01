# Tauri Updater Setup - Summary

## What Was Configured

### 1. Version Compatibility Rules ✅

**Backend** (`backend/src/handlers/version.rs`):
- Minimum client version is now derived from major.minor of server version
- Patch versions are always compatible
- Example: Server `0.1.25` → Min client `0.1.0`

**Frontend** (`src/services/version-service.ts`):
- Updated compatibility check to ignore patch version
- Only major.minor must match

### 2. Tauri Updater Integration ✅

**Configuration** (`src-tauri/tauri.conf.json`):
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://github.com/TestSpectra/testspectra/releases/latest/download/latest.json"],
      "dialog": false,
      "pubkey": ""  // ⚠️ NEEDS TO BE FILLED
    }
  }
}
```

**Update Service** (`src/services/tauri-update-service.ts`):
- Check for updates from GitHub releases
- Download and install with progress tracking
- Automatic restart after update

**UI Integration** (`src/components/VersionGuard.tsx`):
- Shows update dialog when version incompatible
- "Download & Install Update" button
- Progress indicator during download
- Fallback to manual download if needed

### 3. GitHub Actions Workflow ✅

**Release Automation** (`.github/workflows/release.yml`):
- Builds for macOS, Windows, Linux
- Signs binaries automatically
- Creates GitHub release with `latest.json`
- Triggered on version tags (e.g., `v0.1.25`)

### 4. Helper Scripts & Documentation ✅

**Scripts**:
- `scripts/generate-signing-key.sh` - Generate signing keys
- `pnpm generate-keys` - Shortcut command

**Documentation**:
- `docs/TAURI_UPDATER.md` - Detailed technical documentation
- `docs/UPDATER_SETUP_GUIDE.md` - Quick setup guide
- `docs/RELEASE_CHECKLIST.md` - Release process checklist
- `README.md` - Updated with auto-update info

## What You Need to Do

### Required Steps (Before First Release):

1. **Generate Signing Keys**:
   ```bash
   pnpm generate-keys
   ```

2. **Update Tauri Config**:
   - Copy public key from output
   - Paste into `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`

3. **Add Private Key to GitHub Secrets**:
   - Go to: Repository Settings → Secrets → Actions
   - Create secret: `TAURI_SIGNING_PRIVATE_KEY`
   - Paste content from `~/.tauri/testspectra.key`

### For Each Release:

1. Update version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `backend/Cargo.toml`

2. Commit and tag:
   ```bash
   git tag v0.1.25
   git push origin v0.1.25
   ```

3. GitHub Actions will automatically build and release

## How It Works

### Update Flow:

1. **App starts** → Checks server version compatibility
2. **Every 5 minutes** → Checks for updates
3. **Incompatible version detected** → Shows update dialog
4. **User clicks update** → Downloads from GitHub releases
5. **Download complete** → Installs and restarts automatically

### Version Compatibility:

- ✅ Client `0.1.5` + Server `0.1.25` (min `0.1.0`) = Compatible
- ✅ Client `0.1.30` + Server `0.1.25` (min `0.1.0`) = Compatible
- ❌ Client `0.0.9` + Server `0.1.25` (min `0.1.0`) = Incompatible
- ❌ Client `0.2.0` + Server `0.1.25` (min `0.1.0`) = Incompatible

## Testing

### Test Version Compatibility:
1. Run backend with version `0.1.24`
2. Run frontend with version `0.1.20` → Should work
3. Run frontend with version `0.0.9` → Should show update dialog

### Test Auto-Update:
1. Install app from release
2. Create new release with higher version
3. Open app → Should detect update
4. Click update → Should download and install

## Files Changed

### Backend:
- `backend/src/handlers/version.rs` - Version compatibility logic

### Frontend:
- `src/services/tauri-update-service.ts` - NEW: Update service
- `src/services/version-service.ts` - Updated compatibility check
- `src/components/VersionGuard.tsx` - Added update UI
- `src-tauri/tauri.conf.json` - Added updater config
- `package.json` - Added dependencies and script

### CI/CD:
- `.github/workflows/release-tauri.yml` - Automated releases (already exists)

### Documentation:
- `docs/TAURI_UPDATER.md` - NEW: Technical docs
- `docs/UPDATER_SETUP_GUIDE.md` - NEW: Setup guide
- `docs/RELEASE_CHECKLIST.md` - NEW: Release checklist
- `README.md` - Updated with auto-update info

### Scripts:
- `scripts/generate-signing-key.sh` - NEW: Key generation helper

## Dependencies Added

```json
{
  "@tauri-apps/plugin-updater": "2.9.0",
  "@tauri-apps/plugin-process": "2.3.1"
}
```

## Next Steps

1. ⚠️ **Generate signing keys** (required before first release)
2. ⚠️ **Update tauri.conf.json with public key** (required)
3. ⚠️ **Add private key to GitHub Secrets** (required for CI/CD)
4. Test locally with `pnpm tauri:build`
5. Create a test release to verify everything works

## Support

For detailed information, see:
- Quick setup: `docs/UPDATER_SETUP_GUIDE.md`
- Technical details: `docs/TAURI_UPDATER.md`
- Release process: `docs/RELEASE_CHECKLIST.md`
