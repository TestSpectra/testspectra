#!/bin/bash

# TestSpectra Backend Services Startup Script

set -e

echo "🚀 Starting TestSpectra Backend Services..."
echo ""

# Check if .env files exist
if [ ! -f "user-service/.env" ]; then
    echo "⚠️  user-service/.env not found. Copying from .env.example..."
    cp user-service/.env.example user-service/.env
    echo "⚠️  Please edit user-service/.env with your configuration!"
    exit 1
fi

if [ ! -f "grpc-proxy/.env" ]; then
    echo "⚠️  grpc-proxy/.env not found. Copying from .env.example..."
    cp grpc-proxy/.env.example grpc-proxy/.env
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
    echo "    -p 5432:5432 postgres:18"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Build services
echo "🔨 Building services..."
cargo build --release

echo ""
echo "✅ Build complete!"
echo ""

# Start User Service in background
echo "🚀 Starting User Service (port 50051)..."
cd user-service
../target/release/user-service > ../logs/user-service.log 2>&1 &
USER_SERVICE_PID=$!
cd ..

echo "✅ User Service started (PID: $USER_SERVICE_PID)"

# Wait for User Service to be ready
echo "⏳ Waiting for User Service to be ready..."
sleep 3

# Start gRPC Proxy in background
echo "🚀 Starting gRPC Proxy (port 3000)..."
cd grpc-proxy
../target/release/grpc-proxy > ../logs/grpc-proxy.log 2>&1 &
PROXY_PID=$!
cd ..

echo "✅ gRPC Proxy started (PID: $PROXY_PID)"
echo ""

# Save PIDs to file
mkdir -p logs
echo "$USER_SERVICE_PID" > logs/user-service.pid
echo "$PROXY_PID" > logs/grpc-proxy.pid

echo "✅ All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "  - User Service:  http://localhost:50051 (gRPC)"
echo "  - gRPC Proxy:    http://localhost:3000 (HTTP/REST)"
echo ""
echo "📝 Logs:"
echo "  - User Service:  tail -f logs/user-service.log"
echo "  - gRPC Proxy:    tail -f logs/grpc-proxy.log"
echo ""
echo "🛑 To stop services: ./stop-services.sh"
echo ""
