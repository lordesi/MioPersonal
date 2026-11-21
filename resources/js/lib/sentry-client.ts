import { captureException, init } from '@sentry/react';

/**
 * The part of the error reporter that comes from Sentry: loaded by lib/sentry.ts
 * after the page has started, never with it. Named imports only, so the build
 * keeps out what we don't use (Profiler, router integrations…).
 *
 * No cookies, no performance tracing, no session replay: only the errors, to
 * stay in the free quota.
 */
export function start(dsn: string): void {
    init({
        dsn,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
        tracesSampleRate: 0,
        // Noise that isn't ours: browser extensions, a lost connection, a tab left
        // open across a deploy (the old chunks are gone).
        ignoreErrors: [
            'ResizeObserver loop',
            'Failed to fetch',
            'Load failed',
            'NetworkError',
            'Importing a module script failed',
            'Failed to fetch dynamically imported module',
        ],
        denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//],
    });
}

export { captureException };
