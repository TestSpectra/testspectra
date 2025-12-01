# Automatic Version Synchronization

## How It Works

When you create a release tag (e.g., `v0.1.27`), the GitHub Actions workflow automatically:

1. **Extracts version** from the tag (strips the `v` prefix)
2. **Updates all version files**:
   - ✅ `package.json`
   - ✅ `src-tauri/tauri.conf.json`
   - ✅ `src-tauri/Cargo.toml`
   - ✅ `src-tauri/Cargo.lock`
3. **Commits changes** back to the repository
4. **Builds and releases** with the synchronized version

## What You Need to Do

### Manual Update Required
- ⚠️ `backend/Cargo.toml` - Update this manually before tagging

### Automatic Updates
- ✅ `package.json` - Workflow updates
- ✅ `src-tauri/tauri.conf.json` - Workflow updates
- ✅ `src-tauri/Cargo.toml` - Workflow updates
- ✅ `src-tauri/Cargo.lock` - Workflow updates

## Release Process

```bash
# 1. Update backend version manually
# Edit backend/Cargo.toml: version = "0.1.27"

# 2. Commit backend version
git add backend/Cargo.toml
git commit -m "chore: bump backend version to 0.1.27"
git push origin main

# 3. Create and push tag
git tag v0.1.27
git push origin v0.1.27

# 4. Workflow automatically:
#    - Updates package.json, tauri.conf.json, Cargo.toml, Cargo.lock
#    - Commits the changes
#    - Builds and releases
```

## Why This Approach?

### Benefits
- ✅ **Single source of truth**: Version comes from git tag
- ✅ **No manual sync**: Frontend/Tauri versions always match
- ✅ **Less error-prone**: Can't forget to update a file
- ✅ **Clean history**: Automated commits are clearly marked

### Why Backend is Manual
The backend (`backend/Cargo.toml`) is separate because:
- It has its own release cycle
- It may have different versioning needs
- It's deployed independently

## Workflow Code

```yaml
- name: Sync Tauri app version
  run: |
    # Updates package.json
    # Updates src-tauri/tauri.conf.json
    # Updates src-tauri/Cargo.toml
    # Updates src-tauri/Cargo.lock

- name: Commit and push version bump
  run: |
    git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
    git commit -m "chore: bump app version to ${VERSION}"
    git push
```

## Verification

After the workflow runs, check that:
1. All files have matching versions
2. Commit appears in git history
3. Release is created with correct version
4. `latest.json` has correct version number

## Troubleshooting

### "Version mismatch" error
- Check that backend version is updated manually
- Verify tag format is correct (e.g., `v0.1.27`)

### Workflow fails to commit
- Check repository permissions
- Verify `GITHUB_TOKEN` has write access

### Files not updated
- Check workflow logs for errors
- Verify file paths are correct
- Ensure files exist in repository
