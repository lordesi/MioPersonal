/**
 * A tab left open across a deploy: the old build's files are gone from the
 * server. Normal clicks are covered by Inertia (the asset version changes →
 * full reload), but a page fetched in advance (prefetch on hover, the tab bar)
 * still asks for its old file when it's opened. Vite then fires
 * `vite:preloadError`: we reload the page once, on the new build.
 *
 * At most one reload every 10 seconds, so a file that is really missing
 * can't loop: the error then goes on as usual (and reaches Sentry).
 */
const KEY = 'stale-build-reload';
const MIN_INTERVAL = 10_000;

function lastReload(): number {
    try {
        return Number(window.sessionStorage.getItem(KEY)) || 0;
    } catch {
        return 0;
    }
}

function rememberReload(): void {
    try {
        window.sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
        // Storage off (private mode): the reload still happens.
    }
}

export function setUpStaleBuildReload(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('vite:preloadError', (event) => {
        if (Date.now() - lastReload() < MIN_INTERVAL) {
            return;
        }

        event.preventDefault();
        rememberReload();
        window.location.reload();
    });
}
