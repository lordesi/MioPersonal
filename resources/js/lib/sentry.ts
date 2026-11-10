import * as Sentry from '@sentry/react';

/**
 * Error tracking in the browser (free Sentry plan). Without VITE_SENTRY_DSN it
 * does nothing, so local development and the tests never call out. No cookies,
 * no performance tracing, no session replay: only the errors, to stay in the
 * free quota.
 */
export function setUpSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        return;
    }

    Sentry.init({
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

export { Sentry };
