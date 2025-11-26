#!/bin/bash

# TestSpectra Backend Startup Script

set -e

echo "🚀 Starting TestSpectra Backend..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration!"
    exit 1
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! PGPASSWORD=password psql -h localhost -p 5432 -U testspectra -d testspectra -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running or database 'testspectra' doesn't exist"
    echo ""
    echo "Quick start with Docker:"
    echo "  docker run -d --name postgres-local \\"
    echo "    -e POSTGRES_USER=testspectra \\"
    echo "    -e POSTGRES_PASSWORD=password \\"
    echo "    -e POSTGRES_DB=testspectra \\"
    echo "    -p 5432:5432 postgres:16"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Build
echo "🔨 Building backend..."
cargo build --release

echo ""
echo "✅ Build complete!"
echo ""

# Create logs directory
mkdir -p logs

# Start backend in background
echo "🚀 Starting Backend (port 3000)..."
./target/release/testspectra-backend > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "$BACKEND_PID" > logs/backend.pid

echo ""
echo "✅ Backend started successfully!"
echo ""
echo "📊 Service Status:"
echo "  - Backend API: http://localhost:3000"
echo ""
echo "📝 Logs: tail -f logs/backend.log"
echo ""
echo "🛑 To stop: ./stop-services.sh"
echo ""
