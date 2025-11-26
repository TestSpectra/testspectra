#!/bin/bash

# TestSpectra Docker Startup Script
# Starts DB and Backend service in Docker

set -e

echo "🚀 Starting TestSpectra Backend Services with Docker..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Using default values."
    echo "💡 Copy .env.example to .env and customize if needed."
    echo ""
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop and remove existing containers (optional cleanup)
echo "🧹 Cleaning up old containers..."
docker-compose down 2>/dev/null || true
echo ""

# Build backend image manually (workaround for buildx version issues)
echo "🔨 Building backend image..."
docker build -t backend-backend:latest -f Dockerfile . || {
    echo "❌ Build failed. Check errors above."
    exit 1
}

# Start services with pre-built image
echo "🚀 Starting services..."
docker-compose up -d

# Wait a bit for services to start
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Check backend logs
echo ""
echo "📋 Recent Backend Logs:"
docker-compose logs backend | tail -20

echo ""
echo "✅ TestSpectra Backend is running!"
echo ""
echo "🌐 Services:"
echo "   - HTTP API:  http://localhost:3000"
echo "   - gRPC API:  http://localhost:50051"
echo "   - Database:  localhost:5432"
echo ""
echo "🔐 Admin Login:"
echo "   Email:    admin@testspectra.com"
echo "   Password: Admin123!"
echo ""
echo "📝 Useful commands:"
echo "   docker-compose logs -f backend   # Follow logs"
echo "   docker-compose ps                # Check status"
echo "   docker-compose down              # Stop services"
echo "   docker-compose restart backend   # Restart backend"
echo ""
echo "🧪 Test API:"
echo "   curl http://localhost:3000/health"
echo "   curl -X POST http://localhost:3000/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@testspectra.com\",\"password\":\"Admin123!\"}'"
