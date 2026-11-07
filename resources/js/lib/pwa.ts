import { useSyncExternalStore } from 'react';

/**
 * The app on the home screen (public/manifest.webmanifest, public/sw.js).
 *
 * - Android and desktop Chrome/Edge fire `beforeinstallprompt`: we keep it,
 *   and "Installa l'app" shows the browser's dialog.
 * - Safari on the iPhone has no such event: the user adds the app from
 *   Condividi → "Aggiungi alla schermata Home". Only from there the push
 *   notifications work (iOS 16.4 and later).
 */

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let installPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function changed(): void {
    listeners.forEach((listener) => listener());
}

/** Called once by app.tsx: the service worker and the install event. */
export function setUpPwa(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        // The browser's own mini-bar stays hidden: we offer it where it makes sense.
        event.preventDefault();
        installPrompt = event as InstallPromptEvent;
        changed();
    });

    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        changed();
    });

    if ('serviceWorker' in navigator) {
        // After the page: the service worker never slows down the first load.
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .catch(() => undefined);
        });
    }
}

/** True when the browser can show its install dialog now (Android, desktop). */
export function useCanInstall(): boolean {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        () => installPrompt !== null,
        () => false,
    );
}

/** The browser's install dialog; true if the user installed the app. */
export async function installApp(): Promise<boolean> {
    if (installPrompt === null) {
        return false;
    }

    const prompt = installPrompt;
    installPrompt = null;
    changed();
    await prompt.prompt();

    return (await prompt.userChoice).outcome === 'accepted';
}

/** Opened from the icon on the home screen, not in a browser tab. */
export function isStandalone(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

/** iPhone and iPad (also the iPad that says it's a Mac). */
export function isIos(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return (
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}
