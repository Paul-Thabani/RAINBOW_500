#!/usr/bin/env bash
#
# Nightly backup of the Rainbow 500 database.
#
# This is not optional housekeeping. Every buyer's uploaded logo or doodle
# exists only as base64 inside this database, and that artwork is the thing
# they paid for. It cannot be regenerated from anywhere else. If the disk goes
# and there is no dump, the campaign loses what its supporters bought.
#
# Installed via /etc/cron.d/rainbow500-backup. Run it by hand any time:
#   /var/www/shirt.hbufc.co.za/scripts/backup-db.sh
#
# To restore:
#   pg_restore --clean --if-exists --dbname "$DATABASE_URL" <the .dump file>

set -euo pipefail

APP_DIR=/var/www/shirt.hbufc.co.za
BACKUP_DIR=/var/backups/rainbow500
LOG=/var/log/rainbow500-backup.log
KEEP_DAYS=14

log() {
  printf '%s  %s\n' "$(date -Is)" "$1" >> "$LOG"
}

# DATABASE_URL lives in .env.local, which is deliberately not committed.
if [[ ! -r "$APP_DIR/.env.local" ]]; then
  log "FAILED: cannot read $APP_DIR/.env.local"
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" | head -1 | cut -d= -f2-)
if [[ -z "${DATABASE_URL:-}" ]]; then
  log "FAILED: DATABASE_URL not set in .env.local"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/rainbow500-$STAMP.dump"

# Custom format: compressed, and restorable selectively with pg_restore.
if ! pg_dump --format=custom --file="$OUT" "$DATABASE_URL" 2>>"$LOG"; then
  log "FAILED: pg_dump errored"
  rm -f "$OUT"
  exit 1
fi

chmod 600 "$OUT"

# A dump that exists but cannot be read is worse than no dump, because it looks
# like a backup. Prove the archive parses before trusting it.
if ! pg_restore --list "$OUT" > /dev/null 2>>"$LOG"; then
  log "FAILED: dump $OUT is not readable by pg_restore, keeping it for inspection"
  exit 1
fi

SIZE=$(stat -c %s "$OUT")
ROWS=$(psql "$DATABASE_URL" -tAc 'select count(*) from squares' 2>/dev/null || echo "?")
log "ok: $OUT ($SIZE bytes, $ROWS square rows)"

# Prune old dumps. Deliberately after a successful new one, so a failing backup
# never deletes the last good copy.
find "$BACKUP_DIR" -name 'rainbow500-*.dump' -type f -mtime "+$KEEP_DAYS" -delete

# --- Offsite ----------------------------------------------------------------
# Handled separately, not from this script, because the rclone `gdrive` remote
# is configured for root while this runs as harrison from cron:
#
#   /usr/local/sbin/rainbow500-drive-backup.sh
#   rainbow500-drive-backup.timer   daily at 03:50, after this script's 03:17
#   destination                     gdrive:Rainbow500Backups, 30 day retention
#
# That mirrors the existing sonar-drive-backup pattern on this box. Verified by
# uploading a dump, pulling it back down, and confirming pg_restore parses it.
