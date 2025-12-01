#!/bin/bash

# TestSpectra Database Backup Script
# Usage: ./backup-db.sh [backup_dir]

CONTAINER_NAME="testspectra-db"
DB_USER="testspectra"
DB_NAME="testspectra"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/testspectra_${TIMESTAMP}.sql.gz"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup..."
echo "📦 Container: $CONTAINER_NAME"
echo "💾 Database: $DB_NAME"
echo "📁 Output: $BACKUP_FILE"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container $CONTAINER_NAME is not running"
    exit 1
fi

# Perform backup
if docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "📊 Size: $BACKUP_SIZE"
    echo "📄 File: $BACKUP_FILE"
    
    # Keep only last 7 backups
    echo "🧹 Cleaning old backups (keeping last 7)..."
    ls -t "${BACKUP_DIR}"/testspectra_*.sql.gz | tail -n +8 | xargs -r rm
    
    echo "✨ Done!"
else
    echo "❌ Backup failed!"
    exit 1
fi
