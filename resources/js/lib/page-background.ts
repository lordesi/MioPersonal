import { router } from '@inertiajs/react';

/**
 * The colour behind the page (the <html> element): what shows before the
 * page is drawn (opening the app from its icon, a push notification, a
 * reload) and when a phone scrolls past the top or the bottom.
 *
 * Almost the whole site is dark (.theme-dark in app.css); the gym area and
 * the admin area are still light. The first page gets it from the server
 * (resources/views/app.blade.php, same rule): here it follows the visits.
 */
export const PAGE_BACKGROUND = { dark: '#000000', light: '#ffffff' } as const;

export function isLightPage(component: string): boolean {
    return ['gym/', 'admin/', 'dev/'].some((area) =>
        component.startsWith(area),
    );
}

export function setUpPageBackground(): void {
    if (typeof window === 'undefined') {
        return;
    }

    router.on('navigate', (event) => {
        const color = isLightPage(event.detail.page.component)
            ? PAGE_BACKGROUND.light
            : PAGE_BACKGROUND.dark;

        document.documentElement.style.backgroundColor = color;
        // Safari on iOS 26 tints the bar at the top with the body's colour.
        document.body.style.backgroundColor = color;
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', color);
    });
}
