#!/bin/bash

# TestSpectra Backend Stop Script

echo "🛑 Stopping TestSpectra Backend..."
echo ""

PID_FILE="logs/backend.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping backend (PID: $PID)..."
        kill "$PID"
        sleep 1
        if kill -0 "$PID" 2>/dev/null; then
            echo "Force killing..."
            kill -9 "$PID"
        fi
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend is not running"
    fi
    rm -f "$PID_FILE"
else
    echo "⚠️  PID file not found"
fi

echo ""
echo "✅ Done!"
