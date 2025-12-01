#!/bin/bash

# TestSpectra Database Restore Script
# Usage: ./restore-db.sh <backup_file>

CONTAINER_NAME="testspectra-db"
DB_USER="testspectra"
DB_NAME="testspectra"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: Please provide backup file"
    echo "Usage: ./restore-db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "📦 Container: $CONTAINER_NAME"
echo "💾 Database: $DB_NAME"
echo "📁 Backup: $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container $CONTAINER_NAME is not running"
    exit 1
fi

echo "🔄 Starting restore..."

# Drop existing connections
echo "🔌 Closing existing connections..."
docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "🗑️  Dropping database..."
docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "📦 Creating database..."
docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore backup
echo "📥 Restoring backup..."
if gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME"; then
    echo "✅ Restore completed successfully!"
    echo "✨ Done!"
else
    echo "❌ Restore failed!"
    exit 1
fi
