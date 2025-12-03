#!/bin/bash
# Manually test the version sync logic without act

set -e

VERSION=${1:-v0.3.0}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Testing Version Sync Logic ===${NC}"
echo -e "Input version: ${YELLOW}$VERSION${NC}"
echo ""

# Step 1: Extract version (strip 'v' prefix)
echo -e "${BLUE}Step 1: Extract version${NC}"
CLEAN_VERSION="${VERSION#v}"
echo "  Raw version: $VERSION"
echo "  Normalized version: $CLEAN_VERSION"
echo ""

# Step 2: Backup Cargo.toml
echo -e "${BLUE}Step 2: Backup Cargo.toml${NC}"
cp backend/Cargo.toml backend/Cargo.toml.test-backup
echo "  ✓ Backed up to backend/Cargo.toml.test-backup"
echo ""

# Step 3: Update version in Cargo.toml
echo -e "${BLUE}Step 3: Update Cargo.toml${NC}"
CURRENT_VERSION=$(grep '^version = ' backend/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
echo "  Current version: $CURRENT_VERSION"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/^version = ".*"/version = "'"$CLEAN_VERSION"'"/' backend/Cargo.toml
else
    # Linux
    sed -i 's/^version = ".*"/version = "'"$CLEAN_VERSION"'"/' backend/Cargo.toml
fi

NEW_VERSION=$(grep '^version = ' backend/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
echo "  New version: $NEW_VERSION"
echo ""

# Step 4: Verify the change
echo -e "${BLUE}Step 4: Verify change${NC}"
if [ "$NEW_VERSION" == "$CLEAN_VERSION" ]; then
    echo -e "  ${GREEN}✓ Version updated successfully${NC}"
else
    echo -e "  ${RED}✗ Version mismatch!${NC}"
    echo "    Expected: $CLEAN_VERSION"
    echo "    Got: $NEW_VERSION"
fi
echo ""

# Step 5: Show diff
echo -e "${BLUE}Step 5: Show diff${NC}"
diff -u backend/Cargo.toml.test-backup backend/Cargo.toml || true
echo ""

# Step 6: Test Docker build (optional)
echo -e "${BLUE}Step 6: Test Docker build (optional)${NC}"
read -p "Build Docker image to verify? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  Building Docker image..."
    cd backend
    docker build -t testspectra-backend:test-$CLEAN_VERSION .
    
    echo ""
    echo "  Checking version in built image..."
    DOCKER_VERSION=$(docker run --rm testspectra-backend:test-$CLEAN_VERSION cat Cargo.toml | grep '^version = ' | head -1 | sed 's/version = "\(.*\)"/\1/')
    echo "  Docker image version: $DOCKER_VERSION"
    
    if [ "$DOCKER_VERSION" == "$CLEAN_VERSION" ]; then
        echo -e "  ${GREEN}✓ Docker image has correct version${NC}"
    else
        echo -e "  ${RED}✗ Docker image version mismatch!${NC}"
    fi
    
    cd ..
else
    echo "  Skipped Docker build"
fi
echo ""

# Step 7: Restore original
echo -e "${BLUE}Step 7: Restore original Cargo.toml${NC}"
read -p "Restore original Cargo.toml? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    mv backend/Cargo.toml.test-backup backend/Cargo.toml
    echo -e "  ${GREEN}✓ Restored original Cargo.toml${NC}"
else
    echo -e "  ${YELLOW}! Keeping modified Cargo.toml${NC}"
    echo "  Backup saved at: backend/Cargo.toml.test-backup"
fi
echo ""

echo -e "${GREEN}=== Test Complete ===${NC}"
echo ""
echo "Summary:"
echo "  Input version: $VERSION"
echo "  Normalized version: $CLEAN_VERSION"
echo "  Current Cargo.toml version: $(grep '^version = ' backend/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')"
