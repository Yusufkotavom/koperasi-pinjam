#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DATABASE_URL=... ./scripts/db/restore.sh ./backups/dashboard-prod-xxx.dump
# Optional env:
#   RESTORE_CLEAN=1 (drop objects before recreate)

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "ERROR: pg_restore not found. Install PostgreSQL client tools first."
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "ERROR: Missing dump path."
  echo "Usage: DATABASE_URL=... $0 /path/to/file.dump"
  exit 1
fi

dump_file="$1"
if [[ ! -f "$dump_file" ]]; then
  echo "ERROR: Dump file not found: $dump_file"
  exit 1
fi

RESTORE_CLEAN="${RESTORE_CLEAN:-0}"

echo "Restoring dump: $dump_file"

args=(
  --dbname="$DATABASE_URL"
  --no-owner
  --no-privileges
  --verbose
)

if [[ "$RESTORE_CLEAN" == "1" ]]; then
  args+=(--clean --if-exists)
fi

pg_restore "${args[@]}" "$dump_file"

echo "Restore complete."
