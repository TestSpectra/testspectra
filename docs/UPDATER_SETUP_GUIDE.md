# Tauri Updater - Quick Setup Guide

Follow these steps to enable auto-updates for TestSpectra.

## Step 1: Generate Signing Keys

Run the key generation script:

```bash
pnpm generate-keys
```

This will:
- Generate a private key at `~/.tauri/testspectra.key`
- Output a public key to the console

**Important**: Keep the private key secret! Never commit it to git.

## Step 2: Update Tauri Config

Copy the public key from the output and paste it into `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "PASTE_YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

## Step 3: Add Private Key to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:
   - Name: `TAURI_SIGNING_PRIVATE_KEY`
   - Value: Copy the entire content of `~/.tauri/testspectra.key`
   - (Optional) Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if you set a password

To get the private key content:

```bash
cat ~/.tauri/testspectra.key
```

## Step 4: Test the Setup

### Local Build Test

```bash
# Build the app
pnpm tauri:build

# Check that .sig files are generated
ls src-tauri/target/release/bundle/
```

### Release Test

1. Update version in `package.json`, `src-tauri/tauri.conf.json`, and `backend/Cargo.toml`
2. Commit and tag:
   ```bash
   git add .
   git commit -m "chore: bump version to 0.1.25"
   git tag v0.1.25
   git push origin main
   git push origin v0.1.25
   ```
3. GitHub Actions will automatically build and create a release
4. Check the release includes `latest.json` and signature files

### Update Detection Test

1. Install the app from the release
2. Create a new release with a higher version
3. Open the app - it should detect the update
4. Click "Download & Install Update"
5. App should update and restart automatically

## How It Works

### Version Compatibility Check

1. App checks server version via `/version` endpoint
2. Server returns its version and minimum client version
3. Minimum client version is based on major.minor (e.g., `0.1.0`)
4. Patch versions are always compatible

Example:
- Server version: `0.1.25`
- Min client version: `0.1.0`
- Client `0.1.5` → ✅ Compatible
- Client `0.1.30` → ✅ Compatible
- Client `0.0.9` → ❌ Incompatible

### Auto-Update Flow

1. App checks for updates every 5 minutes
2. If incompatible version detected:
   - Show update dialog
   - Display version information
   - Offer "Download & Install Update" button
3. User clicks update:
   - Download from GitHub releases
   - Show progress indicator
   - Install and restart automatically
4. If Tauri update fails:
   - Fallback to opening GitHub releases page
   - User can manually download

## Troubleshooting

### "Update not detected"

Check:
- [ ] `latest.json` exists in GitHub release
- [ ] Endpoint URL is correct in `tauri.conf.json`
- [ ] App has internet connection
- [ ] Check browser console for errors

### "Signature verification failed"

Check:
- [ ] Public key in config matches private key
- [ ] `.sig` files are uploaded with release
- [ ] Private key in GitHub Secrets is correct

### "GitHub Actions workflow fails"

Check:
- [ ] `TAURI_SIGNING_PRIVATE_KEY` secret is set
- [ ] All version numbers match
- [ ] Dependencies are installed correctly

## Files Modified

- ✅ `src-tauri/tauri.conf.json` - Updater configuration
- ✅ `src/services/tauri-update-service.ts` - Update logic
- ✅ `src/components/VersionGuard.tsx` - Update UI
- ✅ `backend/src/handlers/version.rs` - Version endpoint
- ✅ `.github/workflows/release.yml` - Automated releases

## Next Steps

1. Generate your signing keys
2. Update the Tauri config with your public key
3. Add private key to GitHub Secrets
4. Create a test release
5. Verify auto-update works

For detailed information, see `docs/TAURI_UPDATER.md`.
