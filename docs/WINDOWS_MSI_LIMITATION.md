# Windows MSI Limitation for Prereleases

## The Problem

When building a prerelease version like `0.1.27-rc.1`, the Windows build fails with:

```
failed to bundle project `optional pre-release identifier in app version 
must be numeric-only and cannot be greater than 65535 for msi target`
```

## Root Cause

Windows MSI (Microsoft Installer) has strict version format requirements:

### MSI Version Format
```
Major.Minor.Patch.Build
```

Where all parts must be:
- ✅ Numeric only
- ✅ Between 0 and 65535
- ❌ No text identifiers (rc, alpha, beta)

### Examples

| Version | MSI Compatible? | Reason |
|---------|----------------|--------|
| `0.1.27` | ✅ Yes | All numeric |
| `0.1.27.1` | ✅ Yes | All numeric |
| `0.1.27-rc.1` | ❌ No | Contains "rc" (text) |
| `0.1.27-alpha.1` | ❌ No | Contains "alpha" (text) |
| `0.1.27-beta.2` | ❌ No | Contains "beta" (text) |

## Our Solution

The workflow automatically detects prereleases and adjusts Windows build targets:

### For Stable Releases (e.g., `v0.1.27`)
```yaml
TAURI_BUNDLE_TARGETS=all
```
Builds:
- ✅ NSIS installer (`.exe`)
- ✅ MSI installer (`.msi`)

### For Prereleases (e.g., `v0.1.27-rc.1`)
```yaml
TAURI_BUNDLE_TARGETS=nsis
```
Builds:
- ✅ NSIS installer (`.exe`)
- ❌ MSI installer (skipped)

## Impact on Users

### Windows Users - Stable Release
- Can choose between `.exe` (NSIS) or `.msi`
- Both installers available
- Full flexibility

### Windows Users - Prerelease
- Only `.exe` (NSIS) available
- MSI not provided
- NSIS is fully functional and recommended

### macOS and Linux Users
- No impact
- All formats available for both stable and prerelease

## NSIS vs MSI

Both are Windows installers with different characteristics:

### NSIS (Nullsoft Scriptable Install System)
- ✅ More flexible
- ✅ Supports prerelease versions
- ✅ Smaller file size
- ✅ Customizable UI
- ✅ **Recommended for prereleases**

### MSI (Microsoft Installer)
- ✅ Native Windows format
- ✅ Better enterprise deployment
- ✅ Group Policy support
- ❌ Strict version format
- ❌ **Not available for prereleases**

## Workflow Implementation

```yaml
- name: Set bundle targets for Windows
  if: matrix.platform == 'windows-latest'
  run: |
    if [ "${{ is_prerelease }}" == "true" ]; then
      echo "TAURI_BUNDLE_TARGETS=nsis" >> $GITHUB_ENV
    else
      echo "TAURI_BUNDLE_TARGETS=all" >> $GITHUB_ENV
    fi
```

This automatically:
1. Detects if version is prerelease
2. Sets appropriate bundle targets
3. Skips MSI for prereleases
4. Builds successfully

## Alternative Solutions (Not Recommended)

### Option 1: Use Numeric-Only Prereleases
```
0.1.27.1  # Instead of 0.1.27-rc.1
0.1.27.2  # Instead of 0.1.27-rc.2
```

**Problems**:
- ❌ Not semantic versioning compliant
- ❌ Confusing for users
- ❌ Hard to distinguish from stable
- ❌ Breaks npm/cargo conventions

### Option 2: Convert to Numeric
```
0.1.27-rc.1  →  0.1.27.9001
0.1.27-rc.2  →  0.1.27.9002
```

**Problems**:
- ❌ Inconsistent across platforms
- ❌ Complex conversion logic
- ❌ Version mismatch between platforms
- ❌ Confusing in package managers

### Option 3: Skip Windows for Prereleases
```yaml
if: matrix.platform != 'windows-latest' || !is_prerelease
```

**Problems**:
- ❌ No Windows prerelease testing
- ❌ Excludes Windows beta testers
- ❌ Delays Windows-specific bug discovery

## Our Chosen Solution: NSIS Only

**Why this is best**:
- ✅ Semantic versioning preserved
- ✅ Consistent across platforms
- ✅ Windows users can still test
- ✅ NSIS is fully functional
- ✅ Simple and maintainable
- ✅ No version conversion needed

## Verification

After a prerelease build, check:

### macOS Release Assets
```
TestSpectra_0.1.27-rc.1_aarch64.dmg
TestSpectra_aarch64.app.tar.gz
TestSpectra_aarch64.app.tar.gz.sig
```

### Linux Release Assets
```
TestSpectra_0.1.27-rc.1_amd64.AppImage
TestSpectra_0.1.27-rc.1_amd64.deb
TestSpectra_0.1.27-rc.1-1.x86_64.rpm
+ .sig files
```

### Windows Release Assets
```
TestSpectra_0.1.27-rc.1_x64-setup.exe  ✅
TestSpectra_0.1.27-rc.1_x64-setup.nsis.zip
TestSpectra_0.1.27-rc.1_x64-setup.nsis.zip.sig
```

**Note**: No `.msi` files - this is expected and correct!

## For Stable Releases

When you release stable version (e.g., `v0.1.27`), Windows will have both:

```
TestSpectra_0.1.27_x64-setup.exe  ✅
TestSpectra_0.1.27_x64_en-US.msi  ✅
+ .sig files
```

## Summary

- ✅ **Prereleases**: NSIS (`.exe`) only for Windows
- ✅ **Stable**: Both NSIS (`.exe`) and MSI (`.msi`) for Windows
- ✅ **macOS/Linux**: All formats for both stable and prerelease
- ✅ **Automatic**: Workflow handles this transparently
- ✅ **No action needed**: Just tag and release as normal

## Related Documentation

- Prerelease guide: `docs/PRERELEASE_GUIDE.md`
- Workflow details: `.github/workflows/README.md`
- Quick reference: `PRERELEASE_QUICK_REF.md`
