# Prerelease Guide

## Overview

The workflow automatically detects and marks releases as "prerelease" based on version identifiers.

## Prerelease Identifiers

The following identifiers in version strings are recognized as prereleases:
- `rc` - Release Candidate
- `alpha` - Alpha version
- `beta` - Beta version
- `dev` - Development version
- `preview` - Preview version
- `pre` - Generic prerelease

## Version Format

### Stable Release
```
v0.1.27
v1.0.0
v2.3.5
```
→ Marked as **stable release**

### Prerelease
```
v0.1.27-rc.0
v0.1.27-rc.1
v1.0.0-alpha.1
v1.0.0-beta.2
v2.0.0-dev.3
v1.5.0-preview.1
```
→ Marked as **prerelease**

## How It Works

### Detection Logic

The workflow checks if the version contains prerelease identifiers:

```bash
# Examples that trigger prerelease:
0.1.27-rc.0      ✅ Contains "rc."
1.0.0-alpha.1    ✅ Contains "alpha."
2.0.0-beta.5     ✅ Contains "beta."
1.5.0-dev.2      ✅ Contains "dev."

# Examples that are stable:
0.1.27           ❌ No prerelease identifier
1.0.0            ❌ No prerelease identifier
2.3.5            ❌ No prerelease identifier
```

### Workflow Steps

1. **Extract version** from tag (e.g., `v0.1.27-rc.0` → `0.1.27-rc.0`)
2. **Check for identifiers** using regex pattern
3. **Set prerelease flag** accordingly
4. **Create GitHub release** with correct prerelease status

## Creating a Prerelease

### Step 1: Update Backend Version

Edit `backend/Cargo.toml`:
```toml
[package]
version = "0.1.27-rc.0"
```

### Step 2: Commit and Tag

```bash
# Commit backend version
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27-rc.0"

# Create prerelease tag
git tag v0.1.27-rc.0
git push origin main
git push origin v0.1.27-rc.0
```

### Step 3: Workflow Runs

The workflow will:
- ✅ Detect `rc.0` in version
- ✅ Mark as prerelease
- ✅ Update all version files
- ✅ Build and release

### Step 4: Verify

Check the release on GitHub:
- Should have "Pre-release" badge
- Won't be marked as "Latest"
- Users can opt-in to test

## Prerelease Workflow

### Release Candidate Flow

```
v0.1.27-rc.0  →  Test  →  v0.1.27-rc.1  →  Test  →  v0.1.27
  (prerelease)              (prerelease)              (stable)
```

### Alpha/Beta Flow

```
v1.0.0-alpha.1  →  v1.0.0-beta.1  →  v1.0.0-rc.1  →  v1.0.0
  (prerelease)       (prerelease)      (prerelease)     (stable)
```

## Updater Behavior

### Stable Releases Only (Default)

By default, the updater only notifies users of stable releases:
- User on `v0.1.26` → Notified of `v0.1.27` (stable)
- User on `v0.1.26` → NOT notified of `v0.1.27-rc.0` (prerelease)

### Opt-in to Prereleases

To allow users to receive prerelease updates, you can:

1. **Add configuration option** in app settings
2. **Change updater endpoint** to include prereleases
3. **Use different update channel** for beta testers

## GitHub Release Features

### Prerelease Badge

Prereleases show a distinctive badge:
```
🟡 Pre-release
```

### Latest Release

- Stable releases: Marked as "Latest"
- Prereleases: NOT marked as "Latest"

This ensures:
- ✅ Stable users get stable updates
- ✅ Beta testers can opt-in to prereleases
- ✅ Clear distinction between stable and testing

## Version Numbering Best Practices

### Release Candidates

```
v0.1.27-rc.0   # First RC
v0.1.27-rc.1   # Second RC (if needed)
v0.1.27-rc.2   # Third RC (if needed)
v0.1.27        # Final stable release
```

### Alpha/Beta

```
v1.0.0-alpha.1  # Early alpha
v1.0.0-alpha.2  # More features
v1.0.0-beta.1   # Feature complete, testing
v1.0.0-beta.2   # Bug fixes
v1.0.0-rc.1     # Release candidate
v1.0.0          # Stable release
```

### Development Builds

```
v0.2.0-dev.1    # Development snapshot
v0.2.0-dev.2    # Another snapshot
v0.2.0-alpha.1  # First alpha
```

## Examples

### Creating RC for v0.1.27

```bash
# RC 0
git tag v0.1.27-rc.0
git push origin v0.1.27-rc.0

# Test, find bugs, fix them...

# RC 1
git tag v0.1.27-rc.1
git push origin v0.1.27-rc.1

# Test, all good...

# Stable release
git tag v0.1.27
git push origin v0.1.27
```

### Creating Alpha for v1.0.0

```bash
# Alpha 1
git tag v1.0.0-alpha.1
git push origin v1.0.0-alpha.1

# Add more features...

# Alpha 2
git tag v1.0.0-alpha.2
git push origin v1.0.0-alpha.2

# Feature complete, move to beta...

# Beta 1
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

## Troubleshooting

### Prerelease not detected

Check that version contains the identifier:
```bash
# ✅ Correct format
v0.1.27-rc.0
v1.0.0-alpha.1

# ❌ Wrong format (missing dot after identifier)
v0.1.27-rc0
v1.0.0-alpha1
```

### Stable release marked as prerelease

Ensure version doesn't contain prerelease identifiers:
```bash
# ❌ Will be marked as prerelease
v0.1.27-rc.final  # Contains "rc."

# ✅ Correct stable version
v0.1.27
```

### Users not getting prerelease updates

This is expected behavior. Prereleases are opt-in only.

## Related Documentation

- Release process: `docs/RELEASE_CHECKLIST.md`
- Version sync: `WORKFLOW_VERSION_SYNC.md`
- Updater setup: `docs/UPDATER_SETUP_GUIDE.md`
