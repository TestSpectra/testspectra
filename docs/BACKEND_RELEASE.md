# Backend Release Guide

## Overview

The backend Docker image is built and pushed to GitHub Container Registry (GHCR) automatically when you create a version tag.

## How It Works

The workflow automatically updates `backend/Cargo.toml` version based on the git tag:

```
Tag v0.3.0 created
    ↓
Workflow extracts version: 0.3.0
    ↓
Updates backend/Cargo.toml to version = "0.3.0"
    ↓
Commits and pushes to main branch
    ↓
Builds Docker image with correct version
```

## Release Process

### Simple: Just Create a Tag

```bash
# Create and push tag - workflow handles the rest!
git tag v0.3.0
git push origin v0.3.0
```

The workflow will automatically:
1. Extract version from tag (strips `v` prefix)
2. Update `backend/Cargo.toml` to match
3. Commit and push the change
4. Build Docker image with correct version
5. Push to GHCR with multiple tags

### Workflow Steps

The `backend-docker.yml` workflow will:

1. **Extract version** - Get version from tag (e.g., `v0.3.0` → `0.3.0`)
2. **Update Cargo.toml** - Set `version = "0.3.0"` in `backend/Cargo.toml`
3. **Commit & push** - Commit the version change to main branch
4. **Build Docker image** - Build from the updated commit
5. **Push to GHCR** - Push to `ghcr.io/testspectra/server`
6. **Tag images** - Create multiple tags:
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

### Workflow Fails to Update Version

If the workflow fails during the commit step, check:
1. GitHub Actions has write permissions
2. Branch protection rules allow bot commits
3. No merge conflicts in `backend/Cargo.toml`

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
