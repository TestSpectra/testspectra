#!/bin/bash

echo "🔧 Building Web Inspector..."

# Build the web inspector
cd tools/inspector/web-inspector
pnpm run build

# Create resources directory
mkdir -p ../../../src-tauri/resources/web-inspector

# Copy all built files to resources/web-inspector
cp -r dist/* ../../../src-tauri/resources/web-inspector/

echo "✅ Web Inspector files copied to resources/web-inspector"

cd ../../..