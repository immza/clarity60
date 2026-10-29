#!/usr/bin/env bash
# Restore an encrypted nightly backup into a Postgres database.
#
#   1. GitHub → Actions → "Nightly database backup" → a run → download the artifact, unzip it.
#   2. BACKUP_PASSPHRASE=... ./scripts/restore-backup.sh clarity60-<stamp>.dump.enc "postgresql://..."
#
# Restore into a NEW, empty database first and check it before pointing the site at it.
# Needs openssl and pg_restore 17 (or Docker, used automatically if pg_restore is missing).
set -euo pipefail

ENC_FILE=${1:?usage: restore-backup.sh <file.dump.enc> <target DATABASE_URL>}
TARGET_URL=${2:?usage: restore-backup.sh <file.dump.enc> <target DATABASE_URL>}
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in "$ENC_FILE" -out "$TMP/db.dump" -pass env:BACKUP_PASSPHRASE

if command -v pg_restore >/dev/null; then
  pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$TARGET_URL" "$TMP/db.dump"
else
  docker run --rm -v "$TMP:/backup" postgres:17 pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$TARGET_URL" /backup/db.dump
fi
echo "Restored $ENC_FILE"
