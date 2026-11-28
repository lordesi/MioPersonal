import { router } from '@inertiajs/react';
import { isStandalone } from '@/lib/pwa';

/*
 * Zooming the page, as in the apps of the phone: never in the app.
 *
 * - The public pages (public/*: home, search, profiles…) in a browser tab
 *   can be zoomed with two fingers, as every site (accessibility, Google).
 * - The private areas (trainer, client, gym, admin, chat, sign-in…) and
 *   every page of the installed app (from the icon) cannot: the viewport
 *   says so, the CSS (`.zoom-locked` in app.css) stops the pinch on Android
 *   and Chrome, and the Safari gestures are stopped here, as Safari ignores
 *   `user-scalable=no`.
 * - The double tap never zooms (`touch-action: manipulation` in app.css).
 * - Ctrl +/– of the keyboard always works: it is the user's choice.
 * - The photos opened full screen zoom on their own (ZoomableImage, marked
 *   `data-zoomable`): the gestures there are left to them.
 *
 * The first page gets it from the server (resources/views/app.blade.php,
 * same rule): here it follows the visits and the installed app.
 */

export const VIEWPORT = 'width=device-width, initial-scale=1';
export const VIEWPORT_LOCKED = `${VIEWPORT}, maximum-scale=1, user-scalable=no`;

/**
 * The pages whose photo goes up to the top of the phone, under the clock
 * and the battery (`viewport-fit=cover`): they leave the room for them
 * with env(safe-area-inset-*). Same list in resources/views/app.blade.php.
 */
const EDGE_TO_EDGE = ['public/profile'];

/** The `content` of the viewport meta for a page. */
export function viewportContent(component: string, isLocked: boolean): string {
    const base = isLocked ? VIEWPORT_LOCKED : VIEWPORT;

    return EDGE_TO_EDGE.includes(component)
        ? `${base}, viewport-fit=cover`
        : base;
}

/** The private areas: everything but the public pages. */
export function isAppPage(component: string): boolean {
    return !component.startsWith('public/');
}

export function isZoomLocked(component: string, installed: boolean): boolean {
    return installed || isAppPage(component);
}

/** A gesture on a photo that zooms on its own. */
function onZoomable(event: Event): boolean {
    return (
        event.target instanceof Element &&
        event.target.closest('[data-zoomable]') !== null
    );
}

function locked(): boolean {
    return document.documentElement.classList.contains('zoom-locked');
}

function apply(component: string, isLocked: boolean): void {
    document.documentElement.classList.toggle('zoom-locked', isLocked);
    document
        .querySelector('meta[name="viewport"]')
        ?.setAttribute('content', viewportContent(component, isLocked));
}

export function setUpZoomLock(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const installed = isStandalone();

    if (installed) {
        // The first page: locked, keeping the full screen the server set.
        const meta = document.querySelector('meta[name="viewport"]');
        const cover = meta?.getAttribute('content')?.includes('viewport-fit');
        document.documentElement.classList.add('zoom-locked');
        meta?.setAttribute(
            'content',
            cover ? `${VIEWPORT_LOCKED}, viewport-fit=cover` : VIEWPORT_LOCKED,
        );
    }

    router.on('navigate', (event) => {
        const { component } = event.detail.page;
        apply(component, isZoomLocked(component, installed));
    });

    // Safari: the pinch of iPhone and iPad, and of the trackpad of the Mac in
    // the installed app (in a Safari tab of the Mac it stays the browser's).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const stopGesture = (event: Event) => {
        if ((touch || installed) && locked() && !onZoomable(event)) {
            event.preventDefault();
        }
    };

    document.addEventListener('gesturestart', stopGesture, { passive: false });
    document.addEventListener('gesturechange', stopGesture, {
        passive: false,
    });

    // The installed app on the computer: the pinch of the trackpad arrives
    // as Ctrl + wheel. In a browser tab it stays the browser's.
    if (installed) {
        document.addEventListener(
            'wheel',
            (event) => {
                if (event.ctrlKey && !onZoomable(event)) {
                    event.preventDefault();
                }
            },
            { passive: false },
        );
    }
}
