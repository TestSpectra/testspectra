# Release Checklist

Quick reference for creating a new release with auto-update support.

## Pre-Release Setup (One-time)

1. **Generate signing keys** (if not already done):
   ```bash
   pnpm generate-keys
   ```

2. **Add public key to Tauri config**:
   - Copy the public key from the output
   - Update `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`

3. **Add private key to GitHub Secrets**:
   - Go to: Repository Settings → Secrets and variables → Actions
   - Create new secret: `TAURI_SIGNING_PRIVATE_KEY`
   - Paste content from `~/.tauri/testspectra.key`

## Release Process

### 1. Update Version Numbers

Update version in:
- `backend/Cargo.toml` → `version = "0.1.25"`

**Note**: The GitHub Actions workflow automatically updates:
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`

### 2. Update Changelog

Add release notes to `CHANGELOG.md`:
```markdown
## [0.1.25] - 2024-12-01

### Added
- New feature X

### Fixed
- Bug Y
```

### 3. Commit and Tag

```bash
git add .
git commit -m "chore: bump version to 0.1.25"
git tag v0.1.25
git push origin main
git push origin v0.1.25
```

### 4. GitHub Actions Builds Release

The `release.yml` workflow will automatically:
- Build for macOS, Windows, and Linux
- Sign the binaries
- Create GitHub release
- Upload installers and `latest.json`

### 5. Verify Release

Check that the release includes:
- [ ] `latest.json` file
- [ ] Platform-specific installers (.dmg, .exe, .AppImage, etc.)
- [ ] Signature files (.sig)
- [ ] Release notes

### 6. Test Auto-Update

1. Install the previous version
2. Run the app
3. It should detect the new version
4. Click "Download & Install Update"
5. App should update and restart

## Version Compatibility

The backend automatically sets minimum client version based on major.minor:

- Server version: `0.1.25`
- Min client version: `0.1.0`
- Compatible clients: `0.1.0` through `0.1.x`

Patch versions are always compatible!

## Troubleshooting

### Release workflow fails
- Check GitHub Actions logs
- Verify `TAURI_SIGNING_PRIVATE_KEY` secret is set
- Ensure all version numbers match

### Update not detected
- Check `latest.json` exists in release
- Verify endpoint URL in `tauri.conf.json`
- Check app console for errors

### Signature verification fails
- Public key in config must match private key used for signing
- Regenerate keys if needed

## Manual Release (Fallback)

If GitHub Actions fails, build manually:

```bash
# Build for current platform
pnpm tauri:build

# Sign the bundle (macOS example)
tauri signer sign \
  "src-tauri/target/release/bundle/macos/TestSpectra.app" \
  -k ~/.tauri/testspectra.key

# Create latest.json manually
# Upload to GitHub release
```

## Related Documentation

- `docs/TAURI_UPDATER.md` - Detailed updater setup
- `RELEASE.md` - General release information
- `VERSION_MANAGEMENT.md` - Version strategy
