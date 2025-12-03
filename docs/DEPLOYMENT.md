# TestSpectra Deployment Guide

Quick reference for deploying TestSpectra backend and releasing desktop applications.

## 🐳 Backend Docker Deployment

### Automatic Deployment (GitHub Actions)

**Triggers:**
- Push to `main` branch (backend changes)
- Manual workflow dispatch

**Image Location:**
```
ghcr.io/testspectra/testspectra/backend:latest
```

### Manual Docker Build

```bash
cd backend

# Build image
docker build -t testspectra-backend .

# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/testspectra" \
  -e JWT_SECRET="your-secret-key" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="Admin123!" \
  testspectra-backend
```

### Pull from GitHub Container Registry

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull latest image
docker pull ghcr.io/testspectra/testspectra/backend:latest

# Run container
docker run -d \
  --name testspectra-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  ghcr.io/testspectra/testspectra/backend:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/testspectra/testspectra/backend:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://testspectra:password@db:5432/testspectra
      - JWT_SECRET=your-secret-key
      - ADMIN_EMAIL=admin@testspectra.com
      - ADMIN_PASSWORD=Admin123!
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=testspectra
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=testspectra
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 📦 Desktop App Release

### Create New Release

**Method 1: Git Tag (Recommended)**

```bash
# Update versions first
# - src-tauri/tauri.conf.json
# - src-tauri/Cargo.toml
# - package.json

# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Workflow automatically builds and creates release
```

**Method 2: Manual Workflow**

1. Go to GitHub → Actions
2. Select "Release Tauri App"
3. Click "Run workflow"
4. Enter version (e.g., `v1.0.0`)
5. Click "Run workflow"

### Release Artifacts

After workflow completes, the following will be available in GitHub Releases:

| Platform | File | Size (approx) |
|----------|------|---------------|
| macOS (Apple Silicon) | `TestSpectra_X.Y.Z_aarch64.dmg` | ~15 MB |
| macOS (Intel) | `TestSpectra_X.Y.Z_x64.dmg` | ~15 MB |
| Windows | `TestSpectra_X.Y.Z_x64_en-US.msi` | ~10 MB |

### Local Build (Testing)

**macOS:**
```bash
pnpm install
pnpm tauri build

# Output in: src-tauri/target/release/bundle/
```

**Windows:**
```powershell
pnpm install
pnpm tauri build

# Output in: src-tauri\target\release\bundle\
```

---

## 🚀 Deployment Checklist

### Before Release

- [ ] Update version numbers:
  - [ ] `src-tauri/tauri.conf.json`
  - [ ] `src-tauri/Cargo.toml`
  - [ ] `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test backend locally
- [ ] Test desktop app build locally
- [ ] Commit all changes
- [ ] Create and push tag

### After Release

- [ ] Verify GitHub Actions completed successfully
- [ ] Check Docker image in GHCR
- [ ] Download and test installers
- [ ] Verify release notes
- [ ] Announce release

---

## 🔧 Configuration

### Environment Variables (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | - | Secret key for JWT tokens |
| `SERVER_ADDR` | ❌ | `0.0.0.0:3000` | Server bind address |
| `ADMIN_EMAIL` | ✅ | - | Admin user email |
| `ADMIN_PASSWORD` | ✅ | - | Admin user password |
| `ADMIN_NAME` | ❌ | `Admin User` | Admin display name |
| `RUST_LOG` | ❌ | `info` | Log level |

### GitHub Secrets (Optional)

For code signing:
```
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

---

## 📊 Monitoring

### Docker Image Tags

View available tags:
```bash
# Using GitHub API
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/users/testspectra/packages/container/testspectra%2Fbackend/versions

# Or visit:
# https://github.com/orgs/testspectra/packages/container/package/testspectra%2Fbackend
```

### Release Status

Check workflow status:
```bash
# Using GitHub CLI
gh run list --workflow=release-tauri.yml

# View specific run
gh run view <run-id>
```

---

## 🐛 Troubleshooting

### Docker Build Fails

```bash
# Check build logs
cd backend
docker build --progress=plain -t test .

# Check Rust version
docker run --rm rust:1.91.1 cargo --version

# Verify dependencies
cd backend
cargo check
```

### Tauri Build Fails

**macOS:**
```bash
# Install dependencies
xcode-select --install

# Clear cache
cd src-tauri
cargo clean
cd ..
rm -rf node_modules
pnpm install
```

**Windows:**
```powershell
# Install Visual Studio Build Tools
# Install WebView2 Runtime

# Clear cache
cd src-tauri
cargo clean
cd ..
Remove-Item node_modules -Recurse -Force
pnpm install
```

### Release Workflow Fails

1. Check Actions logs in GitHub
2. Verify all version numbers match
3. Ensure tag follows `v*.*.*` format
4. Check workflow permissions:
   - Settings → Actions → General
   - Enable "Read and write permissions"

---

## 📚 Resources

- [Backend API Docs](./backend/README.md)
- [Tauri Guide](https://tauri.app/v1/guides/)
- [Docker Docs](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Packages](https://docs.github.com/en/packages)

---

## 💡 Tips

1. **Use semantic versioning**: `MAJOR.MINOR.PATCH`
2. **Test locally before releasing**
3. **Keep CHANGELOG.md updated**
4. **Monitor GHCR storage usage**
5. **Clean old Docker images regularly**
6. **Test installers on target platforms**
7. **Use draft releases for testing**

---

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review workflow logs in Actions tab
