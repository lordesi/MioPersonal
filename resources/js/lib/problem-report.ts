/**
 * "Segnala un problema": the account menus and the footer open the same
 * window (components/problem-report/problem-report-host.tsx), mounted once
 * next to the page.
 */
const openListeners = new Set<() => void>();

export function openProblemReport(): void {
    // After the menu that called it has closed: two Radix layers at once lose the focus.
    window.setTimeout(
        () => openListeners.forEach((listener) => listener()),
        100,
    );
}

export function onOpenProblemReport(listener: () => void): () => void {
    openListeners.add(listener);

    return () => openListeners.delete(listener);
}

/** What the site adds by itself: the page and the screen, never what is on it. */
export function problemContext(): {
    page: string;
    viewport: string;
    installed: boolean;
} {
    return {
        page: window.location.pathname,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        installed:
            window.matchMedia('(display-mode: standalone)').matches ||
            // iPhone and iPad, from the home screen.
            ('standalone' in navigator && navigator.standalone === true),
    };
}
