import type { LinkPrefetchOption } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { xsrfToken } from '@/lib/notifications';
import { pendingVisit } from '@/routes/stats';

/**
 * Pages opened at once: Inertia downloads a page before the click (the
 * pointer on a link, the tab bar of the areas) and keeps it for a while
 * (`prefetch` in app.tsx). Around that, what Inertia doesn't do by itself:
 *
 * - the code of the page is downloaded together with its data, so a section
 *   opened for the first time doesn't wait for it after the click;
 * - after any change (a booking accepted, a session moved, login, logout…)
 *   the kept pages are thrown away: none can show data from before it;
 * - a kept page older than FRESH_MS is shown at once and then refreshed in
 *   the background, without the loading bar;
 * - a kept page shown counts as a view or a search (App\Support\Stats).
 *
 * Docs: docs/velocita.md.
 */

/** Links of menus, headers and cards: downloaded when the pointer is on them. */
export const hoverPrefetch: LinkPrefetchOption[] = ['hover'];

/**
 * The tab bar of the areas on phones (no pointer): downloaded when it appears,
 * and again when they are no longer kept (refillTabBar()). Its links also have
 * `data-prefetch="mount"`.
 */
export const tabBarPrefetch: LinkPrefetchOption[] = ['mount', 'hover'];

/** How long the kept pages are kept: fresh for 10 s, then shown and refreshed, up to 5 minutes. */
export const prefetchCacheFor = ['10s', '5m'];

/**
 * A kept page older than this is refreshed right after it is shown. Short on
 * purpose: opening a page can change another (the chat read in "Messaggi"
 * takes the dot off "Home"). Only a link just hovered and clicked is not
 * downloaded twice.
 */
const FRESH_MS = 3_000;

/** When each kept page was downloaded, by address. */
const fetchedAt = new Map<string, number>();

function addressOf(url: URL | string): string {
    const parsed =
        typeof url === 'string' ? new URL(url, window.location.origin) : url;

    return parsed.pathname + parsed.search;
}

/** The name of the page in a prefetched response (the JSON of Inertia). */
function componentOf(data: unknown): string | null {
    let page = data;

    if (typeof page === 'string') {
        try {
            page = JSON.parse(page);
        } catch {
            return null;
        }
    }

    if (typeof page === 'object' && page !== null && 'component' in page) {
        const { component } = page as { component: unknown };

        return typeof component === 'string' ? component : null;
    }

    return null;
}

/** Counts the views and searches of a kept page that was shown (PendingVisitController). */
function recordPending(token: string): void {
    void fetch(pendingVisit.url(), {
        method: 'POST',
        keepalive: true,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ token }),
    }).catch(() => {
        // A number missing from the statistics, nothing for the visitor.
    });
}

/**
 * Something changed: no kept page may show data from before. Done by itself
 * after every Inertia change; called by hand after the changes sent with
 * fetch() (lib/chat.ts, lib/notifications.ts, lib/push.ts).
 */
export function forgetKeptPages(): void {
    router.flushAll();
    fetchedAt.clear();
    refillTabBar();
}

let refillTimer: number | undefined;

/**
 * The tab bar stays on screen from page to page, so Inertia downloads its
 * links only once: after a change (everything thrown away) or after 5
 * minutes they would open slowly again. Shortly after each page, the ones no
 * longer kept are downloaded again.
 */
function refillTabBar(): void {
    window.clearTimeout(refillTimer);
    refillTimer = window.setTimeout(() => {
        const current = addressOf(window.location.href);

        document
            .querySelectorAll<HTMLAnchorElement>('a[data-prefetch="mount"]')
            .forEach((link) => {
                const address = addressOf(link.href);

                if (address !== current && !router.getCached(address)) {
                    router.prefetch(
                        address,
                        { method: 'get' },
                        { cacheFor: prefetchCacheFor },
                    );
                }
            });
    }, 300);
}

export function setUpPrefetch(): void {
    if (typeof window === 'undefined') {
        return;
    }

    router.on('prefetched', (event) => {
        const { response, visit, fetchedAt: at } = event.detail;

        fetchedAt.set(addressOf(visit.url), at);

        const component = componentOf(response.data);

        if (component !== null) {
            // Only downloads the code (it is kept by the browser); errors show at the click.
            void router.resolveComponent(component).catch(() => {});
        }
    });

    router.on('finish', (event) => {
        if (event.detail.visit.method !== 'get') {
            forgetKeptPages();
        }
    });

    router.on('success', refillTabBar);

    router.on('navigate', (event) => {
        const { page, cached } = event.detail;

        refillTabBar();

        if (!cached) {
            return;
        }

        const token = page.props.pendingVisit;

        if (typeof token === 'string') {
            recordPending(token);
        }

        const at = fetchedAt.get(addressOf(page.url));

        if (at === undefined || Date.now() - at > FRESH_MS) {
            // Marked as a prefetch: the server doesn't count it as a second view.
            router.reload({
                headers: { Purpose: 'prefetch' },
                showProgress: false,
            });
        }
    });
}
