#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DATABASE_URL=... ./scripts/db/backup.sh
# Optional env:
#   BACKUP_DIR=./backups
#   BACKUP_PREFIX=dashboard-prod
#   BACKUP_RETENTION_DAYS=14
#   BACKUP_DRY_RUN=1

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-dashboard-prod}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_DRY_RUN="${BACKUP_DRY_RUN:-0}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
dump_file="${BACKUP_DIR}/${BACKUP_PREFIX}-${timestamp}.dump"
sha_file="${dump_file}.sha256"

echo "Starting DB backup..."
echo "Output: ${dump_file}"

if [[ "$BACKUP_DRY_RUN" == "1" ]]; then
  echo "Dry run mode: no dump created."
  exit 0
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found. Install PostgreSQL client tools first."
  exit 1
fi

pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$dump_file"

sha256sum "$dump_file" > "$sha_file"

echo "Backup complete."
echo "SHA256: $(cut -d ' ' -f1 "$sha_file")"

if [[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}-*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -delete
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}-*.dump.sha256" -mtime +"$BACKUP_RETENTION_DAYS" -delete
fi

echo "Retention cleanup done (>${BACKUP_RETENTION_DAYS} days)."
