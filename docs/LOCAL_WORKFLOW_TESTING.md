# Testing GitHub Actions Workflows Locally

## Install `act`

`act` adalah tool untuk menjalankan GitHub Actions workflows di local menggunakan Docker.

### macOS (Homebrew)

```bash
brew install act
```

### Verify Installation

```bash
act --version
```

## Testing Backend Docker Workflow

### 1. Dry Run (List Jobs)

```bash
# List all jobs in the workflow
act -l -W .github/workflows/backend-docker.yml
```

### 2. Test with Specific Event

**Test with tag push:**
```bash
# Simulate pushing tag v0.3.0
act push -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')
```

**Test with workflow_dispatch:**
```bash
# Simulate manual trigger with version input
act workflow_dispatch -W .github/workflows/backend-docker.yml \
  --input version=v0.3.0
```

### 3. Test Specific Job

```bash
# Test only prepare-version job
act -j prepare-version -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')

# Test only build-and-push job (requires prepare-version output)
act -j build-and-push -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')
```

### 4. Dry Run (Don't Actually Run)

```bash
# Show what would run without executing
act -n -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')
```

### 5. With Secrets

```bash
# Create .secrets file
cat > .secrets << EOF
GITHUB_TOKEN=your_github_token_here
EOF

# Run with secrets
act push -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}') \
  --secret-file .secrets
```

## Testing Desktop App Release Workflow

```bash
# Test release workflow
act push -W .github/workflows/release.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')
```

## Common Options

| Option | Description |
|--------|-------------|
| `-l` | List workflows and jobs |
| `-n` | Dry run (don't execute) |
| `-j <job>` | Run specific job |
| `-W <file>` | Specify workflow file |
| `--eventpath <file>` | Event payload JSON |
| `--input <key>=<value>` | Workflow dispatch inputs |
| `--secret-file <file>` | File with secrets |
| `-v` | Verbose output |
| `--container-architecture linux/amd64` | Specify architecture |

## Limitations

### What Works
- ✅ Basic workflow syntax validation
- ✅ Job dependencies (`needs`)
- ✅ Environment variables
- ✅ Conditional steps (`if`)
- ✅ Matrix builds
- ✅ Secrets (with `.secrets` file)

### What Doesn't Work
- ❌ GitHub-specific contexts (some)
- ❌ Actual pushing to registries (unless configured)
- ❌ Git push operations (runs in container)
- ❌ Some GitHub Actions features

## Quick Test Script

Create a test script for easy testing:

```bash
#!/bin/bash
# test-workflow.sh

VERSION=${1:-v0.3.0}

echo "Testing backend-docker workflow with version: $VERSION"

# Test prepare-version job
echo "=== Testing prepare-version job ==="
act -j prepare-version -W .github/workflows/backend-docker.yml \
  --eventpath <(echo "{\"ref\": \"refs/tags/$VERSION\"}") \
  -v

# Test build-and-push job (dry run)
echo "=== Testing build-and-push job (dry run) ==="
act -j build-and-push -W .github/workflows/backend-docker.yml \
  --eventpath <(echo "{\"ref\": \"refs/tags/$VERSION\"}") \
  -n
```

Make it executable:
```bash
chmod +x test-workflow.sh
./test-workflow.sh v0.3.0
```

## Alternative: Manual Testing

If `act` doesn't work well, you can manually test the logic:

### Test Version Extraction

```bash
# Simulate the version extraction logic
TAG="v0.3.0"
VERSION="${TAG#v}"
echo "Normalized version: $VERSION"
```

### Test Cargo.toml Update

```bash
# Test the sed command
VERSION="0.3.0"
cp backend/Cargo.toml backend/Cargo.toml.backup
sed -i '' 's/^version = ".*"/version = "'"$VERSION"'"/' backend/Cargo.toml
grep "^version" backend/Cargo.toml
mv backend/Cargo.toml.backup backend/Cargo.toml
```

### Test Docker Build

```bash
# Test Docker build locally
cd backend
docker build -t testspectra-backend:test .

# Check version in built image
docker run --rm testspectra-backend:test cat Cargo.toml | grep "^version"
```

## Debugging Workflows

### View Workflow Logs

```bash
# Run with verbose output
act -v -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')
```

### Interactive Shell

```bash
# Drop into shell in the runner container
act -W .github/workflows/backend-docker.yml \
  --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}') \
  --shell
```

### Check Event Payload

```bash
# Create event.json
cat > event.json << EOF
{
  "ref": "refs/tags/v0.3.0",
  "repository": {
    "name": "testspectra",
    "owner": {
      "login": "TestSpectra"
    }
  }
}
EOF

# Use it
act push -W .github/workflows/backend-docker.yml \
  --eventpath event.json
```

## Troubleshooting

### Docker Not Running
```bash
# Start Docker Desktop or Docker daemon
open -a Docker  # macOS
```

### Permission Denied
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Container Architecture Issues
```bash
# Specify architecture explicitly
act --container-architecture linux/amd64 \
  -W .github/workflows/backend-docker.yml
```

### Out of Disk Space
```bash
# Clean up Docker
docker system prune -a
```

## Best Practices

1. **Test locally before pushing** - Catch syntax errors early
2. **Use dry run first** - See what would happen without executing
3. **Test specific jobs** - Faster iteration
4. **Keep .secrets secure** - Add to .gitignore
5. **Use verbose mode** - Better debugging

## Resources

- [act GitHub](https://github.com/nektos/act)
- [act Documentation](https://nektosact.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## Quick Reference

```bash
# Install
brew install act

# List workflows
act -l

# Dry run
act -n

# Run specific workflow
act -W .github/workflows/backend-docker.yml

# Run with tag event
act push --eventpath <(echo '{"ref": "refs/tags/v0.3.0"}')

# Verbose output
act -v

# Interactive shell
act --shell
```
