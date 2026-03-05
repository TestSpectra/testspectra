#!/bin/bash

echo "🔧 Building Web Inspector..."

# Build the web inspector
cd tools/inspector/web-inspector
pnpm run build

# Create resources directory
mkdir -p ../../../src-tauri/resources

# Copy the built JS file to resources
cp dist/bin/web-inspector.js ../../../src-tauri/resources/web-inspector.js

echo "✅ Web Inspector JS file copied to resources"

cd ../../..