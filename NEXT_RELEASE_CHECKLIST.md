# Next Release Checklist (v0.1.27)

This will be the **first release with auto-update support**!

## Pre-Release (One-Time Setup)

### ✅ Already Done
- [x] Updater configured in `src-tauri/tauri.conf.json`
- [x] Public key added to config
- [x] Signing keys generated at `~/.tauri/testspectra.key`
- [x] Workflow configured with `uploadUpdaterJson: true`

### ⚠️ Required Before Release
- [ ] Add `TAURI_SIGNING_PRIVATE_KEY` to GitHub Secrets
  - Go to: https://github.com/TestSpectra/testspectra/settings/secrets/actions
  - Click "New repository secret"
  - Name: `TAURI_SIGNING_PRIVATE_KEY`
  - Value: Run `cat ~/.tauri/testspectra.key` and paste the content
  - Click "Add secret"

## Release Steps

### 1. Update Version Numbers

Update to `0.1.27` in these files:
- [ ] `package.json` → `"version": "0.1.27"`
- [ ] `src-tauri/tauri.conf.json` → `"version": "0.1.27"`
- [ ] `backend/Cargo.toml` → `version = "0.1.27"`

### 2. Update Release Notes

- [ ] Update `RELEASE.md` with changes in this version

### 3. Commit and Tag

```bash
git add .
git commit -m "chore: bump version to 0.1.27"
git tag v0.1.27
git push origin main
git push origin v0.1.27
```

### 4. Wait for GitHub Actions

The workflow will automatically:
- ✅ Build for macOS, Linux, Windows
- ✅ Sign all binaries (creates `.sig` files)
- ✅ Generate `latest.json` with signatures
- ✅ Upload everything to GitHub release

Monitor at: https://github.com/TestSpectra/testspectra/actions

### 5. Verify Release

Check that the release includes:
- [ ] `latest.json` file
- [ ] Platform installers (.dmg, .exe, .AppImage, etc.)
- [ ] Signature files (.sig for each installer)
- [ ] Release notes

Verify `latest.json` is accessible:
```bash
curl https://github.com/TestSpectra/testspectra/releases/latest/download/latest.json
```

Should return JSON with version, platforms, and signatures.

### 6. Test Auto-Update

#### Option A: Install Previous Version
1. Install v0.1.26 (or earlier)
2. Run the app
3. It should detect v0.1.27 is available
4. Click "Download & Install Update"
5. App should update and restart

#### Option B: Test with Current Version
1. Install v0.1.27
2. Create v0.1.28 (or edit `latest.json` to fake a newer version)
3. App should detect the update

## What to Expect

### First Launch After Update
- App checks server version via `/version` endpoint
- App checks GitHub for updates via `latest.json`
- If compatible: App runs normally
- If incompatible: Shows update dialog

### Periodic Checks
- Every 5 minutes, app checks for updates
- If new version available: Shows notification/dialog
- User can choose to update or dismiss

### Update Process
1. User clicks "Download & Install Update"
2. Progress bar shows download progress
3. Signature is verified automatically
4. Update installs
5. App restarts with new version

## Troubleshooting

### Workflow fails with "signature error"
- Check that `TAURI_SIGNING_PRIVATE_KEY` secret is set correctly
- Verify public key in config matches the private key

### No `latest.json` in release
- Check workflow logs for errors
- Verify `uploadUpdaterJson: true` in workflow
- Ensure updater is configured in `tauri.conf.json`

### Update not detected in app
- Check that `latest.json` exists and is accessible
- Verify endpoint URL in `tauri.conf.json`
- Check browser console for errors

## After Successful Release

Once v0.1.27 is released successfully:
- ✅ Auto-update is fully operational
- ✅ All future releases will include `latest.json` automatically
- ✅ Users will be notified of updates automatically
- ✅ No manual intervention needed for updates

## Related Documentation

- Troubleshooting: `docs/UPDATER_TROUBLESHOOTING.md`
- Setup guide: `docs/UPDATER_SETUP_GUIDE.md`
- Release process: `docs/RELEASE_CHECKLIST.md`
