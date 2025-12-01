# Prerelease Quick Reference

## Supported Identifiers

| Identifier | Example | Use Case |
|------------|---------|----------|
| `rc` | `v0.1.27-rc.0` | Release Candidate |
| `alpha` | `v1.0.0-alpha.1` | Early testing |
| `beta` | `v1.0.0-beta.1` | Feature complete |
| `dev` | `v0.2.0-dev.1` | Development snapshot |
| `preview` | `v1.5.0-preview.1` | Preview release |
| `pre` | `v2.0.0-pre.1` | Generic prerelease |

## Quick Commands

### Release Candidate

```bash
# Edit backend/Cargo.toml: version = "0.1.27-rc.0"
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27-rc.0"
git tag v0.1.27-rc.0
git push origin main v0.1.27-rc.0
```

### Alpha Release

```bash
# Edit backend/Cargo.toml: version = "1.0.0-alpha.1"
git add backend/Cargo.toml
git commit -m "chore: bump version to 1.0.0-alpha.1"
git tag v1.0.0-alpha.1
git push origin main v1.0.0-alpha.1
```

### Beta Release

```bash
# Edit backend/Cargo.toml: version = "1.0.0-beta.1"
git add backend/Cargo.toml
git commit -m "chore: bump version to 1.0.0-beta.1"
git tag v1.0.0-beta.1
git push origin main v1.0.0-beta.1
```

### Stable Release (after prerelease)

```bash
# Edit backend/Cargo.toml: version = "0.1.27"
git add backend/Cargo.toml
git commit -m "chore: bump version to 0.1.27"
git tag v0.1.27
git push origin main v0.1.27
```

## What Happens

### Prerelease (e.g., v0.1.27-rc.0)
- ✅ Workflow detects `rc.0` identifier
- ✅ Marks GitHub release as "Pre-release"
- ✅ Shows 🟡 badge on GitHub
- ✅ NOT marked as "Latest"
- ✅ Updater won't notify stable users

### Stable (e.g., v0.1.27)
- ✅ No prerelease identifier detected
- ✅ Marks GitHub release as stable
- ✅ Marked as "Latest"
- ✅ Updater notifies all users

## Version Progression

### Typical RC Flow
```
v0.1.27-rc.0  →  v0.1.27-rc.1  →  v0.1.27
```

### Full Alpha/Beta/RC Flow
```
v1.0.0-alpha.1  →  v1.0.0-beta.1  →  v1.0.0-rc.1  →  v1.0.0
```

## Important Notes

- ⚠️ **Format matters**: Use `rc.0` not `rc0` (dot is required)
- ⚠️ **Updater behavior**: Stable users won't get prerelease updates
- ✅ **Auto-detection**: Workflow automatically detects prerelease
- ✅ **Version sync**: All files updated automatically

## Full Documentation

See `docs/PRERELEASE_GUIDE.md` for complete details.
