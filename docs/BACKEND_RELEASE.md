# Backend Release Guide

## Overview

The backend Docker image is built and pushed to GitHub Container Registry (GHCR) automatically when you create a version tag.

## Important: Version Synchronization

**⚠️ CRITICAL**: You must update `backend/Cargo.toml` BEFORE creating the git tag!

### Why?

The workflow builds the Docker image from the tagged commit. If `backend/Cargo.toml` doesn't have the correct version when you create the tag, the Docker image will be built with the old version.

### What Happens

```
Tag v0.3.0 created
    ↓
Workflow checks out tag v0.3.0
    ↓
Reads backend/Cargo.toml
    ↓
If version != 0.3.0 → ❌ FAIL
If version == 0.3.0 → ✅ Build Docker image
```

## Release Process

### 1. Update Backend Version

```bash
# Edit backend/Cargo.toml
version = "0.3.0"
```

### 2. Commit Changes

```bash
git add backend/Cargo.toml
git commit -m "chore: bump backend version to 0.3.0"
git push origin main
```

### 3. Create Tag

```bash
git tag v0.3.0
git push origin v0.3.0
```

### 4. Workflow Runs Automatically

The `backend-docker.yml` workflow will:

1. **Verify version** - Check that `backend/Cargo.toml` matches tag
2. **Build Docker image** - Build from `backend/Dockerfile`
3. **Push to GHCR** - Push to `ghcr.io/testspectra/server`
4. **Tag images** - Create multiple tags:
   - `latest` (if on main branch)
   - `0.3.0` (exact version)
   - `0.3` (major.minor)
   - `sha-abc123` (commit SHA)

## Verification

### Check Workflow Status

```bash
# Using GitHub CLI
gh run list --workflow=backend-docker.yml

# View specific run
gh run view <run-id>
```

### Verify Docker Image

```bash
# Pull the image
docker pull ghcr.io/testspectra/server:0.3.0

# Check version
docker run --rm ghcr.io/testspectra/server:0.3.0 --version
```

### Test API Version Endpoint

```bash
# Deploy the new image
docker run -d -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  ghcr.io/testspectra/server:0.3.0

# Check version
curl http://localhost:3000/api/version
```

Expected response:
```json
{
  "version": "0.3.0",
  "minClientVersion": "0.3.0"
}
```

## Troubleshooting

### Version Mismatch Error

**Error:**
```
❌ ERROR: Version mismatch!
Tag version: 0.3.0
Cargo.toml version: 0.2.2
Please update backend/Cargo.toml to version 0.3.0 before creating the tag
```

**Solution:**
1. Delete the tag: `git tag -d v0.3.0 && git push origin :refs/tags/v0.3.0`
2. Update `backend/Cargo.toml` to correct version
3. Commit: `git add backend/Cargo.toml && git commit -m "chore: bump backend version to 0.3.0"`
4. Push: `git push origin main`
5. Recreate tag: `git tag v0.3.0 && git push origin v0.3.0`

### Docker Image Has Wrong Version

If you deployed the image but `/api/version` returns the wrong version:

1. **Check which image you deployed:**
   ```bash
   docker ps
   docker inspect <container-id> | grep Image
   ```

2. **Pull the correct image:**
   ```bash
   docker pull ghcr.io/testspectra/server:0.3.0
   ```

3. **Verify the image version:**
   ```bash
   # Check Cargo.toml in the image
   docker run --rm ghcr.io/testspectra/server:0.3.0 \
     cat /app/Cargo.toml | grep "^version"
   ```

4. **Redeploy with correct image:**
   ```bash
   docker stop <container-id>
   docker rm <container-id>
   docker run -d -p 3000:3000 \
     -e DATABASE_URL="..." \
     ghcr.io/testspectra/server:0.3.0
   ```

### Workflow Doesn't Trigger

The workflow only triggers when:
- A tag matching `v*` is pushed
- OR manually via workflow_dispatch

If the workflow doesn't run:
1. Check tag format: Must be `v0.3.0` (with `v` prefix)
2. Check GitHub Actions permissions
3. Manually trigger: Go to Actions → Backend Docker → Run workflow

## Manual Build (Emergency)

If GitHub Actions is down or you need to build manually:

```bash
cd backend

# Build image
docker build -t ghcr.io/testspectra/server:0.3.0 .

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push image
docker push ghcr.io/testspectra/server:0.3.0

# Tag as latest
docker tag ghcr.io/testspectra/server:0.3.0 ghcr.io/testspectra/server:latest
docker push ghcr.io/testspectra/server:latest
```

## Version in Code

The backend reads its version from `Cargo.toml` at compile time:

```rust
// backend/src/handlers/version.rs
const VERSION: &str = env!("CARGO_PKG_VERSION");
```

This means:
- ✅ Version is embedded in the binary at build time
- ✅ No runtime configuration needed
- ⚠️ Must rebuild to change version

## Related Documentation

- [Release Checklist](RELEASE_CHECKLIST.md) - Full release process
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Version Management](VERSION_MANAGEMENT.md) - Version compatibility rules
