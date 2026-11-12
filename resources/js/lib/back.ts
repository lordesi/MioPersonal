import { router } from '@inertiajs/react';

/**
 * "Indietro" of the mobile headers (trainer, gym, event): back to the page the
 * visitor came from when it was on this site, otherwise to a sensible page
 * (the search of the city). Inertia visits don't change document.referrer,
 * so the pages seen in this tab are counted here.
 */
let pagesSeen = 0;

export function setUpBack(): void {
    router.on('navigate', () => {
        pagesSeen += 1;
    });
}

/** True when the browser's "back" stays on this site. */
export function canGoBack(): boolean {
    return pagesSeen > 1 && window.history.length > 1;
}
