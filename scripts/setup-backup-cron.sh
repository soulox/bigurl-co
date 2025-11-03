#!/usr/bin/env bash
set -euo pipefail

# Setup automated database backups via cron
# Usage: bash scripts/setup-backup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-db.sh"

if [ ! -f "$BACKUP_SCRIPT" ]; then
  echo "Error: Backup script not found at ${BACKUP_SCRIPT}" >&2
  exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create cron job (runs daily at 2 AM)
CRON_CMD="0 2 * * * cd ${PROJECT_DIR} && bash ${BACKUP_SCRIPT} >> ${PROJECT_DIR}/backups/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
  echo "Cron job for database backup already exists"
  exit 0
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "Cron job added successfully!"
echo "Database will be backed up daily at 2 AM"
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove: crontab -e (then delete the line)"
echo ""
echo "Manual backup: bash ${BACKUP_SCRIPT}"

