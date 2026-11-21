/**
 * Error tracking in the browser (free Sentry plan). Without VITE_SENTRY_DSN it
 * does nothing and the build leaves Sentry out, so local development and the
 * tests never call out.
 *
 * Sentry is not in the code the page starts with: setUpSentry() downloads it
 * right after (lib/sentry-client.ts). Errors reported in the meantime wait in
 * a small queue. To report an error by hand use reportError(), never
 * '@sentry/react' directly (it would put Sentry back in the first download).
 */
type Extra = Record<string, unknown>;
type Client = typeof import('./sentry-client');

const MAX_QUEUED = 10;

let client: Client | null = null;
let queue: Array<[unknown, Extra | undefined]> | null = [];

export function setUpSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn || typeof window === 'undefined') {
        queue = null;

        return;
    }

    import('./sentry-client')
        .then((loaded) => {
            loaded.start(dsn);
            client = loaded;
            queue?.forEach(([error, extra]) => send(error, extra));
        })
        // No connection, or an old build: the queued errors are lost.
        .catch(() => undefined)
        .finally(() => {
            queue = null;
        });
}

export function reportError(error: unknown, extra?: Extra): void {
    if (client) {
        send(error, extra);
    } else if (queue && queue.length < MAX_QUEUED) {
        queue.push([error, extra]);
    }
}

function send(error: unknown, extra?: Extra): void {
    client?.captureException(error, extra ? { extra } : undefined);
}
