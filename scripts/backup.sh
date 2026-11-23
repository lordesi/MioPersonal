#!/usr/bin/env bash
# Nightly backup of miopersonal.it. Runs ON the server as the `ploi` user, started by the
# Laravel scheduler at 02:30 UTC (routes/console.php); by hand: bash scripts/backup.sh
# How to restore: docs/deploy.md, "Backup".
#
# - the database (pg_dump) goes to db/, one file per night, deleted after 30 days;
#   the last 7 also stay in ~/backups on the server, for a quick restore;
# - photos and certificates go to files/current/; what the site deleted or replaced
#   moves to files/deleted-YYYY-MM-DD/, deleted after 30 days;
# - everything is encrypted on the server by rclone (remote "miopersonal-backup", a
#   crypt remote over Backblaze B2) before it leaves: Backblaze sees only scrambled data;
# - Healthchecks.io is pinged at the start and at the end (or with /fail): when a night
#   is missing, it emails the team.
#
# 30 days at most on purpose: the privacy policy says that the data of a deleted
# account disappears from the backups within 30 days.
#
# Until rclone is set up (docs/deploy.md) it does nothing and says so.

set -Eeuo pipefail

main() {
    local app
    app="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    local remote=miopersonal-backup:
    local keep_days=30
    local local_dir="${HOME:-/home/ploi}/backups"
    local keep_local=7

    cd "${app}"
    export HOME="${HOME:-/home/ploi}"

    if ! command -v rclone > /dev/null || ! rclone listremotes | grep -qx "${remote}"; then
        echo "$(date -u '+%F %T') Backup skipped: the rclone remote ${remote} is not set up yet."
        exit 0
    fi

    local healthcheck
    healthcheck="$(env_value BACKUP_HEALTHCHECK_URL)"

    if [[ -z "${healthcheck}" ]]; then
        echo "Warning: BACKUP_HEALTHCHECK_URL is not in .env, nobody is told if a backup fails." >&2
    fi

    # Never two backups at once (the scheduler and one started by hand).
    exec 9> "${HOME}/.backup.lock"
    if ! flock -n 9; then
        echo "Another backup is running: stopping." >&2
        exit 1
    fi

    trap 'echo "$(date -u "+%F %T") Backup FAILED at line ${LINENO}" >&2; ping_healthcheck "${healthcheck}" /fail' ERR

    ping_healthcheck "${healthcheck}" /start
    echo "$(date -u '+%F %T') Backup started."

    # 1. The database.
    local stamp dump port
    stamp="$(date -u +%F-%H%M)"
    port="$(env_value DB_PORT)"
    mkdir -p "${local_dir}"
    dump="${local_dir}/miopersonal-${stamp}-notte.dump"

    PGPASSWORD="$(env_value DB_PASSWORD)" pg_dump \
        -h "$(env_value DB_HOST)" -p "${port:-5432}" \
        -U "$(env_value DB_USERNAME)" -Fc -f "${dump}" "$(env_value DB_DATABASE)"
    # A dump that pg_restore can't read is not a backup.
    pg_restore --list "${dump}" > /dev/null

    rclone copy "${dump}" "${remote}db/"
    rclone delete "${remote}db/" --min-age "${keep_days}d"

    # Only the nightly copies are rotated: the ones made by hand before a deploy stay.
    find "${local_dir}" -maxdepth 1 -name 'miopersonal-*-notte.dump' -printf '%T@ %p\n' \
        | sort -rn | tail -n +"$((keep_local + 1))" | cut -d' ' -f2- | xargs -r rm --

    # 2. Photos and certificates. Not copied: the photos and PDFs of "Messaggi" (chat/,
    # deleted by the site after 10 days) and the WebP copies of the photos (the site
    # makes them again: php artisan photos:variants).
    local today
    today="$(date -u +%F)"

    for disk in public private; do
        rclone sync "storage/app/${disk}" "${remote}files/current/${disk}" \
            --backup-dir "${remote}files/deleted-${today}/${disk}" \
            --fast-list \
            --exclude 'chat/**' \
            --exclude '*.sm.webp' --exclude '*.md.webp' --exclude '*.lg.webp'
    done

    # What was deleted or replaced more than 30 days ago goes for good.
    local cutoff dir
    cutoff="$(date -u -d "-${keep_days} days" +%F)"

    while read -r dir; do
        if [[ "${dir}" == deleted-* && "${dir#deleted-}" < "${cutoff}" ]]; then
            rclone purge "${remote}files/${dir}"
        fi
    done < <(rclone lsf --dirs-only "${remote}files/" | sed 's#/$##')

    ping_healthcheck "${healthcheck}" ''
    echo "$(date -u '+%F %T') Backup done: $(basename "${dump}") ($(du -h "${dump}" | cut -f1))."
}

# A value of .env, without quotes; empty when it is not there.
env_value() {
    grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/' || true
}

# Healthchecks.io: '' = done, /start, /fail. A ping that doesn't go through never stops the backup.
ping_healthcheck() {
    if [[ -n "$1" ]]; then
        curl -fsS -m 10 --retry 3 -o /dev/null "$1$2" || true
    fi
}

main "$@"
