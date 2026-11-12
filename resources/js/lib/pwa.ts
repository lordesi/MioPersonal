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

/**
 * How this browser installs the app:
 * - 'prompt': the browser's own dialog (Chrome, Edge, Samsung Internet);
 * - 'ios': Safari on the iPhone/iPad, Condividi → "Aggiungi alla schermata Home";
 * - 'mac-safari': Safari on the Mac (17+), File → "Aggiungi al Dock";
 * - null: already installed, or a browser without it (Firefox on the computer).
 */
export type InstallMethod = 'prompt' | 'ios' | 'mac-safari' | null;

function isMacSafari(): boolean {
    const ua = navigator.userAgent;

    return (
        /Macintosh/.test(ua) &&
        /Version\/(1[7-9]|[2-9]\d)\.[\d.]+ Safari/.test(ua) &&
        !/Chrome|Chromium|CriOS|FxiOS|Firefox|Edg|OPR/.test(ua) &&
        !isIos()
    );
}

export function installMethod(): InstallMethod {
    if (typeof window === 'undefined' || isStandalone()) {
        return null;
    }

    if (installPrompt !== null) {
        return 'prompt';
    }

    if (isIos()) {
        return 'ios';
    }

    return isMacSafari() ? 'mac-safari' : null;
}

/** installMethod(), updated when the browser's install event arrives. */
export function useInstallMethod(): InstallMethod {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        installMethod,
        () => null,
    );
}

/**
 * "Installa l'app" from a menu or the settings: opens the popup of
 * components/pwa/app-prompt.tsx, also when "Non ora" was pressed lately.
 */
const openListeners = new Set<() => void>();

export function openAppPrompt(): void {
    // After the menu that called it has closed: two Radix layers at once lose the focus.
    window.setTimeout(
        () => openListeners.forEach((listener) => listener()),
        100,
    );
}

export function onOpenAppPrompt(listener: () => void): () => void {
    openListeners.add(listener);

    return () => openListeners.delete(listener);
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
