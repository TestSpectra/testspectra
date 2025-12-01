# GitHub Actions Workflows

## Active Workflows

### `release-tauri.yml` - Tauri App Release
**Status**: ✅ Active

Builds and releases the Tauri desktop application for all platforms.

**Triggers**:
- Push to tags matching `v*` (e.g., `v0.1.25`, `v0.1.27-rc.0`)
- Manual workflow dispatch

**Prerelease Detection**:
- Automatically detects prereleases from version identifiers
- Supported: `rc`, `alpha`, `beta`, `dev`, `preview`, `pre`
- Example: `v0.1.27-rc.0` → Marked as prerelease

**What it does**:
1. Syncs version across all files (tauri.conf.json, Cargo.toml, Cargo.lock)
2. Builds for macOS (ARM64), Linux (x86_64), and Windows (x86_64)
3. Signs binaries with your private key
4. Creates GitHub release with installers and `latest.json`
5. Enables auto-update for desktop app

**Required Secrets**:
- `TAURI_SIGNING_PRIVATE_KEY` - Your signing private key
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Password (if set)
- `API_URL` - Backend API URL

**Usage**:

Stable release:
```bash
# Update backend/Cargo.toml only
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27"
git tag v0.1.27
git push origin main
git push origin v0.1.27
```

Prerelease:
```bash
# Update backend/Cargo.toml with prerelease version
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27-rc.0"
git tag v0.1.27-rc.0
git push origin main
git push origin v0.1.27-rc.0
```

## Platform Matrix

| Platform | Target | Output |
|----------|--------|--------|
| macOS | `aarch64-apple-darwin` | `.dmg`, `.app.tar.gz` |
| Linux | `x86_64-unknown-linux-gnu` | `.AppImage`, `.deb` |
| Windows | `x86_64-pc-windows-msvc` | `.exe`, `.msi` |

## Caching

The workflow caches:
- pnpm store (`~/.pnpm-store`)
- Rust cargo registry and build artifacts
- Significantly speeds up subsequent builds

## Auto-Update

Each release includes a `latest.json` file that the Tauri updater checks:
```
https://github.com/TestSpectra/testspectra/releases/latest/download/latest.json
```

Desktop apps automatically check for updates every 5 minutes and prompt users when a new version is available.

## Troubleshooting

### Build fails with "signature verification failed"
- Ensure `TAURI_SIGNING_PRIVATE_KEY` matches your public key in `tauri.conf.json`
- Regenerate keys if needed: `pnpm generate-keys`

### Version mismatch errors
- The workflow automatically syncs versions across:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/Cargo.lock`
- Only `backend/Cargo.toml` needs manual update

### Ubuntu build fails
- Check that all system dependencies are installed
- Workflow installs: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`

## Related Documentation

- Setup: `docs/UPDATER_SETUP_GUIDE.md`
- Release process: `docs/RELEASE_CHECKLIST.md`
- Technical details: `docs/TAURI_UPDATER.md`
