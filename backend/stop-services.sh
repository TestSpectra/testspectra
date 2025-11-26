#!/bin/bash

# TestSpectra Backend Services Stop Script

echo "🛑 Stopping TestSpectra Backend Services..."
echo ""

# Stop User Service
if [ -f "logs/user-service.pid" ]; then
    USER_SERVICE_PID=$(cat logs/user-service.pid)
    if ps -p $USER_SERVICE_PID > /dev/null 2>&1; then
        echo "🛑 Stopping User Service (PID: $USER_SERVICE_PID)..."
        kill $USER_SERVICE_PID
        echo "✅ User Service stopped"
    else
        echo "⚠️  User Service not running"
    fi
    rm logs/user-service.pid
fi

# Stop gRPC Proxy
if [ -f "logs/grpc-proxy.pid" ]; then
    PROXY_PID=$(cat logs/grpc-proxy.pid)
    if ps -p $PROXY_PID > /dev/null 2>&1; then
        echo "🛑 Stopping gRPC Proxy (PID: $PROXY_PID)..."
        kill $PROXY_PID
        echo "✅ gRPC Proxy stopped"
    else
        echo "⚠️  gRPC Proxy not running"
    fi
    rm logs/grpc-proxy.pid
fi

echo ""
echo "✅ All services stopped"
