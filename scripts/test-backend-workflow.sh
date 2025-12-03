#!/bin/bash
# Test backend-docker workflow locally using act

set -e

VERSION=${1:-v0.3.0}
MODE=${2:-dry-run}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Testing Backend Docker Workflow ===${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo ""

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}Error: 'act' is not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  brew install act"
    echo ""
    echo "Or see: https://github.com/nektos/act"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo ""
    echo "Start Docker Desktop or Docker daemon"
    exit 1
fi

# Create event payload
EVENT_JSON=$(cat <<EOF
{
  "ref": "refs/tags/$VERSION",
  "repository": {
    "name": "testspectra",
    "owner": {
      "login": "TestSpectra"
    }
  }
}
EOF
)

case $MODE in
  "dry-run")
    echo -e "${YELLOW}Running in dry-run mode (no execution)${NC}"
    echo ""
    act -n -W .github/workflows/backend-docker.yml \
      --eventpath <(echo "$EVENT_JSON")
    ;;
    
  "list")
    echo -e "${YELLOW}Listing jobs in workflow${NC}"
    echo ""
    act -l -W .github/workflows/backend-docker.yml
    ;;
    
  "prepare-version")
    echo -e "${YELLOW}Testing prepare-version job${NC}"
    echo ""
    act -j prepare-version -W .github/workflows/backend-docker.yml \
      --eventpath <(echo "$EVENT_JSON") \
      -v
    ;;
    
  "build-and-push")
    echo -e "${YELLOW}Testing build-and-push job (dry-run)${NC}"
    echo ""
    act -j build-and-push -W .github/workflows/backend-docker.yml \
      --eventpath <(echo "$EVENT_JSON") \
      -n
    ;;
    
  "full")
    echo -e "${YELLOW}Running full workflow${NC}"
    echo ""
    act push -W .github/workflows/backend-docker.yml \
      --eventpath <(echo "$EVENT_JSON") \
      -v
    ;;
    
  "manual")
    echo -e "${YELLOW}Testing manual workflow_dispatch${NC}"
    echo ""
    CLEAN_VERSION="${VERSION#v}"
    act workflow_dispatch -W .github/workflows/backend-docker.yml \
      --input version="$VERSION" \
      -v
    ;;
    
  *)
    echo -e "${RED}Unknown mode: $MODE${NC}"
    echo ""
    echo "Usage: $0 [version] [mode]"
    echo ""
    echo "Modes:"
    echo "  dry-run          - Show what would run (default)"
    echo "  list             - List all jobs"
    echo "  prepare-version  - Test prepare-version job"
    echo "  build-and-push   - Test build-and-push job"
    echo "  full             - Run full workflow"
    echo "  manual           - Test workflow_dispatch"
    echo ""
    echo "Examples:"
    echo "  $0 v0.3.0 dry-run"
    echo "  $0 v0.3.0 list"
    echo "  $0 v0.3.0 prepare-version"
    echo "  $0 v0.3.0 full"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
