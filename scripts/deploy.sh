#!/usr/bin/env bash
# Deploys miopersonal.it. Runs ON the server as the `ploi` user and is read from stdin,
# so the version being deployed is always the one that runs (see docs/deploy.md):
#
#   GitHub Actions:  ssh ploi@server "bash -s -- <sha>" < scripts/deploy.sh
#   Ploi (emergency): git show origin/main:scripts/deploy.sh | bash -s -- "$(git rev-parse origin/main)"
#
# The whole script is a function, so bash reads all of it before running anything.

set -Eeuo pipefail

main() {
    local sha="${1:?usage: deploy.sh <commit-sha>}"
    local app=/home/ploi/miopersonal.it
    local php=php8.4
    local log=/home/ploi/deploys.log
    local started
    started="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

    # Never two deploys at once (GitHub and the Ploi button share this lock).
    exec 9>/home/ploi/.deploy.lock
    if ! flock -n 9; then
        echo "Another deploy is running: stopping." >&2
        exit 1
    fi

    trap 'echo "${started}  ${sha:0:7}  FAILED at line ${LINENO}" >> "${log}"' ERR

    cd "${app}"

    echo "==> Fetching ${sha:0:7}"
    git fetch --quiet origin main
    sha="$(git rev-parse --verify "${sha}^{commit}")"

    # Only commits that are on main.
    if ! git merge-base --is-ancestor "${sha}" origin/main; then
        echo "${sha:0:7} is not on main: stopping." >&2
        exit 1
    fi

    # A slow, older run must not take the site back (the same commit can be deployed again).
    local current
    current="$(git rev-parse HEAD)"
    if [[ "${sha}" != "${current}" ]] && git merge-base --is-ancestor "${sha}" "${current}"; then
        echo "${sha:0:7} is older than the live ${current:0:7}: nothing to do."
        echo "${started}  ${sha:0:7}  SKIPPED (older than ${current:0:7})" >> "${log}"
        exit 0
    fi

    git reset --hard "${sha}"

    echo "==> PHP dependencies"
    composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

    echo "==> Database"
    "${php}" artisan optimize:clear
    "${php}" artisan migrate --force

    echo "==> Front end (client + SSR)"
    npm ci --no-audit --no-fund
    npm run build:ssr

    echo "==> Caches, queue, SSR, PHP"
    "${php}" artisan optimize
    "${php}" artisan storage:link
    "${php}" artisan queue:restart
    # The Ploi daemon restarts the SSR server with the new bundle; fine if none is running yet.
    "${php}" artisan inertia:stop-ssr || true
    sudo -n service php8.4-fpm reload

    echo "${started}  ${sha:0:7}  OK" >> "${log}"
    echo "==> Deployed ${sha:0:7}"
}

main "$@"
