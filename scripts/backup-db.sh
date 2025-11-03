#!/usr/bin/env bash
set -euo pipefail

# Database backup script for BigURL
# Usage: bash scripts/backup-db.sh [backup-destination]
#
# By default, backs up to ./backups/ with timestamp
# Can also be used with cron for automated backups

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="bigurl-co-server-1"
DB_PATH="/data/links.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Error: Container ${CONTAINER_NAME} is not running" >&2
  exit 1
fi

# SQLite checkpoint to ensure WAL is flushed
echo "Checkpointing WAL..."
docker exec "$CONTAINER_NAME" sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);" || true

# Copy database files
BACKUP_FILE="${BACKUP_DIR}/links_${TIMESTAMP}.db"
echo "Backing up to ${BACKUP_FILE}..."
docker cp "${CONTAINER_NAME}:${DB_PATH}" "$BACKUP_FILE"

# Also backup WAL and SHM if they exist
docker cp "${CONTAINER_NAME}:${DB_PATH}-wal" "${BACKUP_FILE}-wal" 2>/dev/null || true
docker cp "${CONTAINER_NAME}:${DB_PATH}-shm" "${BACKUP_FILE}-shm" 2>/dev/null || true

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed: ${BACKUP_FILE} (${SIZE})"
  
  # Test integrity
  if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" > /dev/null 2>&1; then
    echo "Integrity check: OK"
  else
    echo "Warning: Integrity check failed" >&2
  fi
else
  echo "Error: Backup file not created" >&2
  exit 1
fi

# Optional: Keep only last N backups (default: 30)
KEEP_BACKUPS="${KEEP_BACKUPS:-30}"
echo "Cleaning up old backups (keeping last ${KEEP_BACKUPS})..."
cd "$BACKUP_DIR"
ls -t links_*.db 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t links_*.db-wal 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t links_*.db-shm 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true

echo "Backup completed at $(date)"

