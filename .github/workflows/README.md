# GitHub Actions Workflows

This directory contains automated workflows for building, testing, and releasing TestSpectra.

## Workflows

### 1. Backend Docker Image (`backend-docker.yml`)

**Purpose:** Automatically builds and publishes the backend Docker image to GitHub Container Registry (GHCR).

**Triggers:**
- Push to `main` branch (when backend files change)
- Pull requests (build only, no push)
- Manual trigger via workflow dispatch

**What it does:**
1. Builds multi-platform Docker image (amd64, arm64)
2. Pushes to `ghcr.io/[your-org]/testspectra/server`
3. Tags with:
   - `latest` (for main branch)
   - Branch name
   - Git SHA
   - PR number (for pull requests)

**Usage:**

Pull the latest backend image:
```bash
docker pull ghcr.io/testspectra/testspectra/server:latest
```

Pull specific version:
```bash
docker pull ghcr.io/testspectra/testspectra/server:main-abc123
```

Run the image:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  ghcr.io/testspectra/testspectra/backend:latest
```

**Configuration:**
- No secrets required (uses `GITHUB_TOKEN` automatically)
- Image visibility controlled by repository settings

---

### 2. Tauri Release (`release-tauri.yml`)

**Purpose:** Builds and releases cross-platform desktop applications for Windows and macOS.

**Triggers:**
- Push tags matching `v*.*.*` (e.g., `v1.0.0`)
- Manual trigger with custom version

**What it does:**
1. Creates GitHub Release
2. Builds for multiple platforms:
   - **macOS Apple Silicon** (M1/M2/M3)
   - **macOS Intel** (x86_64)
   - **Windows 64-bit**
3. Uploads installers to the release
4. Generates release notes

**Platform-specific outputs:**

| Platform | File Format | Example Filename |
|----------|-------------|------------------|
| macOS (Apple Silicon) | `.dmg` | `TestSpectra_0.1.0_aarch64.dmg` |
| macOS (Intel) | `.dmg` | `TestSpectra_0.1.0_x64.dmg` |
| Windows | `.msi` | `TestSpectra_0.1.0_x64_en-US.msi` |

**How to create a release:**

**Option 1: Git Tag (Recommended)**
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

**Option 2: Manual Workflow Dispatch**
1. Go to Actions tab on GitHub
2. Select "Release Tauri App"
3. Click "Run workflow"
4. Enter version (e.g., `v1.0.0`)
5. Click "Run workflow"

**Code Signing (Optional):**

To enable code signing for macOS and Windows:

1. Generate signing keys:
   - **macOS:** Apple Developer Certificate
   - **Windows:** Code signing certificate

2. Add GitHub secrets:
   ```
   TAURI_SIGNING_PRIVATE_KEY
   TAURI_SIGNING_PRIVATE_KEY_PASSWORD
   ```

3. Configure in `src-tauri/tauri.conf.json`

**Release Process:**
1. Workflow creates GitHub Release draft
2. Builds for all platforms in parallel
3. Uploads artifacts to release
4. Publishes release

---

## Setup Instructions

### Prerequisites

1. **Enable GitHub Actions** in repository settings
2. **Enable GitHub Packages** for container registry
3. **Configure repository permissions:**
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"

### Backend Docker Workflow Setup

1. **Make GHCR packages public** (optional):
   - Go to package settings
   - Change visibility to public

2. **Test locally:**
```bash
cd backend
docker build -t testspectra-backend .
docker run -p 3000:3000 testspectra-backend
```

### Tauri Release Workflow Setup

1. **Update version** in `src-tauri/tauri.conf.json`:
```json
{
  "version": "1.0.0"
}
```

2. **Update version** in `src-tauri/Cargo.toml`:
```toml
[package]
version = "1.0.0"
```

3. **Test build locally:**

**macOS:**
```bash
pnpm tauri build
```

**Windows:**
```powershell
pnpm tauri build
```

4. **Create release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Troubleshooting

### Backend Docker Build Fails

**Check:**
- Rust dependencies in `Cargo.toml`
- Database migrations in `migrations/` folder
- Dockerfile syntax

**Debug locally:**
```bash
cd backend
docker build --progress=plain -t test .
```

### Tauri Build Fails

**macOS Issues:**
- Install Xcode Command Line Tools
- Check code signing certificates

**Windows Issues:**
- Install Visual Studio Build Tools
- Check WebView2 runtime

**Common fixes:**
```bash
# Clear build cache
cd src-tauri
cargo clean

# Reinstall dependencies
cd ..
pnpm install

# Try build again
pnpm tauri build
```

### Release Not Created

**Check:**
- Tag format matches `v*.*.*`
- Workflow permissions enabled
- No syntax errors in YAML

**View logs:**
1. Go to Actions tab
2. Click on failed workflow
3. Check job logs

---

## Best Practices

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version: Breaking changes
- **MINOR** version: New features
- **PATCH** version: Bug fixes

Example:
- `v1.0.0` → Initial release
- `v1.1.0` → Add new feature
- `v1.1.1` → Bug fix

### Release Checklist

Before creating a release:

- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test build locally
- [ ] Create and push tag
- [ ] Verify GitHub Actions success
- [ ] Test downloaded installers

### Docker Image Management

**Clean old images:**
```bash
# List images
docker images

# Remove old images
docker rmi ghcr.io/testspectra/testspectra/backend:old-tag
```

**Monitor registry usage:**
- GitHub Packages has storage limits
- Clean up old/unused tags regularly

---

## CI/CD Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Changes                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Push to main / Create PR    │
              └───────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Backend Changes?    │              │   Create Tag?        │
│  → Build Docker      │              │   → Build Tauri      │
│  → Push to GHCR      │              │   → Create Release   │
└──────────────────────┘              └──────────────────────┘
          │                                       │
          ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Docker Image Ready  │              │  Installers Ready    │
│  ghcr.io/.../backend │              │  Download from       │
│                      │              │  GitHub Releases     │
└──────────────────────┘              └──────────────────────┘
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Docker Documentation](https://docs.docker.com/)
