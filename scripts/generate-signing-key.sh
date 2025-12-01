#!/bin/bash

# Generate Tauri signing keys for update verification
# This script helps generate the public/private key pair needed for secure updates

set -e

echo "🔐 Tauri Signing Key Generator"
echo "=============================="
echo ""

# Check if tauri CLI is available
if ! command -v tauri &> /dev/null; then
    echo "❌ Tauri CLI not found. Please install it first:"
    echo "   pnpm add -D @tauri-apps/cli"
    exit 1
fi

# Default key path
KEY_DIR="$HOME/.tauri"
KEY_FILE="$KEY_DIR/testspectra.key"

# Create directory if it doesn't exist
mkdir -p "$KEY_DIR"

# Check if key already exists
FORCE_FLAG=""
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  Key already exists at: $KEY_FILE"
    echo ""
    echo "To view existing public key, run: pnpm view-pubkey"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    FORCE_FLAG="--force"
fi

echo ""
echo "Generating signing key..."
echo ""

# Generate the key
cd src-tauri
tauri signer generate -w "$KEY_FILE" $FORCE_FLAG

echo ""
echo "✅ Keys generated successfully!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Private key saved to: $KEY_FILE"
echo "   ⚠️  KEEP THIS SECRET! Never commit to git!"
echo ""
echo "2. Add the public key to src-tauri/tauri.conf.json:"
echo "   Look for the output above and copy the public key"
echo ""
echo "3. For CI/CD, add private key to GitHub Secrets:"
echo "   - Go to: Settings > Secrets and variables > Actions"
echo "   - Create secret: TAURI_SIGNING_PRIVATE_KEY"
echo "   - Paste the content of: $KEY_FILE"
echo ""
echo "4. Update .gitignore to exclude private keys (already done)"
echo ""
