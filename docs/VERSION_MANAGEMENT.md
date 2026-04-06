# Version Management Guide

## Overview

TestSpectra implements automatic version compatibility checking between frontend and backend to ensure users are always running compatible versions.

## How It Works

1. **Backend Version**: Defined in `backend/Cargo.toml`
2. **Frontend Version**: Defined in `package.json` (automatically imported by `src/services/version-service.ts`)
3. **Minimum Client Version**: Defined in `backend/src/handlers/version.rs`

The frontend version is automatically synced from `package.json`, so you only need to update one place.

The system checks version compatibility on:
- Application startup
- Every 5 minutes (periodic check)
- Manual refresh

If versions are incompatible, users are blocked from using the app and prompted to update.

## Version Format

We use semantic versioning: `MAJOR.MINOR.PATCH[-PRERELEASE]`

Example: `0.1.22-rc.1`

### Compatibility Rules

- **Major version** must match (0.x.x vs 1.x.x = incompatible)
- **Minor version** must be >= minimum (0.1.x vs 0.2.x = depends on min version)
- **Patch version** must be >= minimum if minor matches

## When to Update Versions

### 1. Breaking Changes (Update MIN_CLIENT_VERSION)

When you make changes that break compatibility with older clients:

**Backend Changes:**
```rust
// backend/src/handlers/version.rs
const MIN_CLIENT_VERSION: &str = "0.2.0"; // Update this!
```

**Examples of breaking changes:**
- API endpoint URL changes
- Request/response payload structure changes
- Authentication mechanism changes
- Database schema changes that affect API responses
- Removal of features

### 2. New Features (Update Backend Version)

When adding new features that don't break existing functionality:

```toml
# backend/Cargo.toml
[package]
version = "0.1.23" # Increment patch or minor
```

### 3. Frontend Updates (Update Frontend Version)

```json
// package.json
{
  "version": "0.1.1" // Increment to match or exceed MIN_CLIENT_VERSION
}
```

## Release Workflow

### For Breaking Changes:

1. **Update Backend Version**
   ```toml
   # backend/Cargo.toml
   version = "0.2.0"
   ```

2. **Update Minimum Client Version**
   ```rust
   // backend/src/handlers/version.rs
   const MIN_CLIENT_VERSION: &str = "0.2.0";
   ```

3. **Update Frontend Version**
   ```json
   // package.json
   "version": "0.2.0"
   ```
   
   > 💡 The frontend automatically imports this version from `package.json` via `version-service.ts`, so you only need to update one place.

4. **Deploy Backend First**
   - Old clients will see incompatibility warning
   - They'll be forced to update

5. **Release Frontend Update**
   - Users download/reload to get new version
   - Compatibility check passes

### For Non-Breaking Changes:

1. **Update Backend Version**
   ```toml
   # backend/Cargo.toml
   version = "0.1.23"
   ```

2. **Keep MIN_CLIENT_VERSION unchanged**
   ```rust
   // backend/src/handlers/version.rs
   const MIN_CLIENT_VERSION: &str = "0.1.0"; // No change
   ```

3. **Optionally Update Frontend**
   ```json
   // package.json
   "version": "0.1.1" // Optional
   ```

## Testing Version Compatibility

### Test Incompatible Version:

1. Set backend MIN_CLIENT_VERSION higher than frontend version:
   ```rust
   const MIN_CLIENT_VERSION: &str = "99.0.0";
   ```

2. Restart backend
3. Reload frontend
4. You should see the "Update Required" screen

### Test Compatible Version:

1. Ensure frontend version >= MIN_CLIENT_VERSION
2. Reload frontend
3. App should work normally

## Version Check Endpoint

**GET** `/api/version`

**Response:**
```json
{
  "version": "0.1.22-rc.1",
  "minClientVersion": "0.1.0"
}
```

## Disabling Version Check (Development Only)

If you need to temporarily disable version checking during development:

```typescript
// src/components/VersionGuard.tsx
// Comment out the version check in useEffect
```

**⚠️ Never disable in production!**

## Best Practices

1. **Always update MIN_CLIENT_VERSION for breaking changes**
2. **Document breaking changes in CHANGELOG.md**
3. **Test version compatibility before deploying**
4. **Deploy backend before frontend for breaking changes**
5. **Keep version numbers in sync across files**
6. **Use pre-release tags for testing (e.g., 0.2.0-rc.1)**

## Troubleshooting

### Users stuck on old version:

- Check if they're using cached version (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
- For Tauri app: They need to download new installer

### Version check fails:

- Check if `/api/version` endpoint is accessible
- Check CORS settings
- Check network connectivity
- System falls back to "compatible" on error to avoid blocking users

### False incompatibility warnings:

- Verify MIN_CLIENT_VERSION is set correctly
- Check version format (must be valid semver)
- Ensure frontend version in package.json is correct

## Example Scenarios

### Scenario 1: Adding New Optional Field

```
Backend: 0.1.22 → 0.1.23
MIN_CLIENT_VERSION: 0.1.0 (no change)
Frontend: 0.1.0 (no change needed)
Result: ✅ Compatible
```

### Scenario 2: Changing API Response Structure

```
Backend: 0.1.22 → 0.2.0
MIN_CLIENT_VERSION: 0.1.0 → 0.2.0
Frontend: 0.1.0 → 0.2.0 (required)
Result: ⚠️ Old clients blocked until update
```

### Scenario 3: Security Patch

```
Backend: 0.1.22 → 0.1.22-patch.1
MIN_CLIENT_VERSION: 0.1.0 (no change)
Frontend: 0.1.0 (no change)
Result: ✅ Compatible
```
