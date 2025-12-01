# Tauri Updater Setup

This document explains how the Tauri updater is configured to work with GitHub releases and coordinate with our custom version checking system.

## Overview

TestSpectra uses a two-tier update system:

1. **Custom Version Check**: Validates compatibility between client and server based on major.minor versions
2. **Tauri Updater**: Automatically downloads and installs updates from GitHub releases

## Version Compatibility Rules

- **Major.Minor versions** must match between client and server
- **Patch versions** are always compatible within the same major.minor
- Example: Client `0.1.5` is compatible with server requiring `0.1.0` minimum

## Configuration

### Tauri Config (`src-tauri/tauri.conf.json`)

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/TestSpectra/testspectra/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

- `active`: Enable/disable updater
- `endpoints`: URL to check for updates (GitHub releases)
- `dialog`: Set to `false` to use custom UI
- `pubkey`: Public key for signature verification (generate with `tauri signer generate`)

## GitHub Release Requirements

Each release must include a `latest.json` file with this structure:

```json
{
  "version": "0.1.24",
  "notes": "Release notes here",
  "pub_date": "2024-12-01T00:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/TestSpectra/testspectra/releases/download/v0.1.24/TestSpectra_0.1.24_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://github.com/TestSpectra/testspectra/releases/download/v0.1.24/TestSpectra_0.1.24_aarch64.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/TestSpectra/testspectra/releases/download/v0.1.24/TestSpectra_0.1.24_x64-setup.nsis.zip"
    }
  }
}
```

## Update Flow

1. **Version Check**: On app start and every 5 minutes
   - Check server version compatibility via `/version` endpoint
   - Check for Tauri updates from GitHub releases

2. **Incompatible Version Detected**:
   - Show update dialog with version information
   - User clicks "Download & Install Update"
   - Tauri downloads update with progress indicator
   - App automatically restarts after installation

3. **Manual Fallback**:
   - If Tauri update fails, opens GitHub releases page
   - User can manually download and install

## Generating Signing Keys

To enable signature verification:

```bash
cd src-tauri
tauri signer generate -w ~/.tauri/myapp.key
```

This generates:
- Private key: `~/.tauri/myapp.key` (keep secret!)
- Public key: Add to `tauri.conf.json` under `updater.pubkey`

## Building Releases

```bash
# Build for current platform
pnpm tauri:build

# The build will generate:
# - Application bundle
# - Signature file (.sig)
# - Update artifacts
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Build Tauri App
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
  with:
    tagName: v__VERSION__
    releaseName: 'TestSpectra v__VERSION__'
    releaseBody: 'See CHANGELOG.md for details'
    releaseDraft: false
    prerelease: false
```

Store your private key in GitHub Secrets as `TAURI_PRIVATE_KEY`.

## Testing Updates

1. **Local Testing**:
   ```bash
   # Build a release
   pnpm tauri:build
   
   # Create a test release on GitHub
   # Install the app
   # Bump version and create another release
   # App should detect and offer update
   ```

2. **Version Compatibility Testing**:
   - Test with matching major.minor versions (should work)
   - Test with different patch versions (should work)
   - Test with different minor versions (should show incompatible)

## Troubleshooting

### Update Not Detected
- Check GitHub release has `latest.json` file
- Verify endpoint URL in `tauri.conf.json`
- Check browser console for errors

### Signature Verification Failed
- Ensure public key in config matches private key used for signing
- Verify `.sig` files are uploaded with release

### Update Download Fails
- Check network connectivity
- Verify release URLs are accessible
- Check file permissions

## Security Notes

- **Never commit private keys** to version control
- Store private key securely (GitHub Secrets, vault, etc.)
- Public key in config is safe to commit
- Signature verification prevents tampering

## Related Files

- `src/services/tauri-update-service.ts` - Update logic
- `src/services/version-service.ts` - Version compatibility check
- `src/components/VersionGuard.tsx` - Update UI
- `backend/src/handlers/version.rs` - Server version endpoint
