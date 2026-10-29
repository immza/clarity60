#!/usr/bin/env bash
# Restore an encrypted nightly backup into an EMPTY Postgres database (disaster recovery).
# For a routine check, use the "Restore drill" GitHub workflow instead.
#
#   1. GitHub → Actions → "Nightly database backup" → a run → download the artifact, unzip it.
#   2. Create a NEW empty database (e.g. a fresh Supabase project).
#   3. BACKUP_PASSPHRASE=... ./scripts/restore-backup.sh clarity60-<stamp>.dump.enc "postgresql://..."
#   4. Check it, then point the site's DATABASE_URL at it.
#
# There is deliberately no "overwrite" mode: replacing a live database in place can leave it
# half-restored if anything fails. Restoring into a fresh database and switching over is safe.
# Remote targets use TLS (verify-full when PGSSLROOTCERT points at the provider's CA).
# Uses the postgres:17 Docker image, matching the server and the backup format.
set -euo pipefail

ENC_FILE=${1:?usage: restore-backup.sh <file.dump.enc> <empty target DATABASE_URL>}
TARGET_URL=${2:?usage: restore-backup.sh <file.dump.enc> <empty target DATABASE_URL>}
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
command -v docker >/dev/null || { echo "Docker is required (it provides pg_restore 17)."; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in "$ENC_FILE" -out "$TMP/db.dump" -pass env:BACKUP_PASSPHRASE

# TLS for anything that isn't this machine.
TLS=(-e PGSSLMODE=require)
case "$TARGET_URL" in *@localhost*|*@127.0.0.1*) TLS=(-e PGSSLMODE=disable) ;; esac
if [ -n "${PGSSLROOTCERT:-}" ]; then
  cp "$PGSSLROOTCERT" "$TMP/ca.pem"
  TLS=(-e PGSSLMODE=verify-full -e PGSSLROOTCERT=/backup/ca.pem)
fi
PG=(docker run --rm --network host "${TLS[@]}" -v "$TMP:/backup" postgres:17)

TABLES=$("${PG[@]}" psql -v ON_ERROR_STOP=1 -At "$TARGET_URL" -c "select count(*) from information_schema.tables where table_schema = 'public'")
if [ "$TABLES" != "0" ]; then
  echo "Refusing: the target database already has $TABLES tables. Restore into a new, empty database."
  exit 1
fi

# All-or-nothing: any error rolls the whole restore back.
"${PG[@]}" pg_restore --no-owner --no-privileges --single-transaction --exit-on-error --dbname "$TARGET_URL" /backup/db.dump
echo "Restored $ENC_FILE. Check it, then point DATABASE_URL at this database."
