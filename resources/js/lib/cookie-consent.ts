/** The optional categories of the cookie banner: the technical ones are always on. */
export type CookieConsent = {
    analytics: boolean;
    marketing: boolean;
};

const openEvent = 'mp:open-cookie-settings';

/** Opens "Impostazioni cookie" from anywhere: footer, cookie policy… */
export function openCookieSettings() {
    window.dispatchEvent(new Event(openEvent));
}

/** Calls `open` when someone asks for "Impostazioni cookie"; returns the cleanup. */
export function onOpenCookieSettings(open: () => void) {
    window.addEventListener(openEvent, open);

    return () => window.removeEventListener(openEvent, open);
}

/**
 * Runs on every page with the saved choice. No tracker is used yet: when one
 * is added, load its script here and only with consent, for example Google
 * Analytics only if `consent.analytics` is true.
 */
export function applyConsent(_consent: CookieConsent) {}
