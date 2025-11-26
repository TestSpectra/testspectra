#!/bin/bash

# TestSpectra Docker Stop Script
# Stops all Docker services

echo "🛑 Stopping TestSpectra Backend Services..."
echo ""

docker-compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "💡 To remove volumes (delete database data):"
echo "   docker-compose down -v"
