#!/usr/bin/env bash
# Restore an encrypted nightly backup into a Postgres database (manual disaster recovery).
# For a routine check, use the "Restore drill" GitHub workflow instead: it never touches production.
#
#   1. GitHub → Actions → "Nightly database backup" → a run → download the artifact, unzip it.
#   2. BACKUP_PASSPHRASE=... ./scripts/restore-backup.sh clarity60-<stamp>.dump.enc "postgresql://..."
#
# By default the target must be EMPTY: the script refuses a database that already has tables,
# so production can't be overwritten by mistake. Pass --overwrite only for a deliberate rollback.
# Uses the postgres:17 Docker image, matching the server and the backup format.
set -euo pipefail

OVERWRITE=false
if [ "${1:-}" = "--overwrite" ]; then OVERWRITE=true; shift; fi
ENC_FILE=${1:?usage: restore-backup.sh [--overwrite] <file.dump.enc> <target DATABASE_URL>}
TARGET_URL=${2:?usage: restore-backup.sh [--overwrite] <file.dump.enc> <target DATABASE_URL>}
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
command -v docker >/dev/null || { echo "Docker is required (it provides pg_restore 17)."; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in "$ENC_FILE" -out "$TMP/db.dump" -pass env:BACKUP_PASSPHRASE

PG=(docker run --rm --network host -e PGSSLMODE=prefer -v "$TMP:/backup" postgres:17)
TABLES=$("${PG[@]}" psql -At "$TARGET_URL" -c "select count(*) from information_schema.tables where table_schema = 'public'")

if [ "$TABLES" != "0" ] && [ "$OVERWRITE" != "true" ]; then
  echo "Refusing: the target database already has $TABLES tables. Restore into an empty database,"
  echo "or re-run with --overwrite if you really mean to replace it."
  exit 1
fi

if [ "$OVERWRITE" = "true" ]; then
  read -r -p "This REPLACES every table in the target database. Type 'overwrite' to continue: " CONFIRM
  [ "$CONFIRM" = "overwrite" ] || { echo "Cancelled."; exit 1; }
  "${PG[@]}" pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$TARGET_URL" /backup/db.dump
else
  "${PG[@]}" pg_restore --no-owner --no-privileges --dbname "$TARGET_URL" /backup/db.dump
fi
echo "Restored $ENC_FILE"
