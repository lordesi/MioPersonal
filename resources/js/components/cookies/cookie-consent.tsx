import type { Page, SharedPageProps } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import CookieBanner from '@/components/cookies/cookie-banner';
import CookiePreferencesDialog from '@/components/cookies/cookie-preferences-dialog';
import type { CookieConsent as Consent } from '@/lib/cookie-consent';
import { applyConsent, onOpenCookieSettings } from '@/lib/cookie-consent';
import { store } from '@/routes/cookie-consent';

/**
 * The cookie banner and "Impostazioni cookie", on every page. It sits next
 * to the app (see app.tsx), outside the pages, so usePage() isn't available:
 * the choice comes from the first page and then from each navigation.
 */
export default function CookieConsent({
    initialPage,
}: {
    initialPage: Page<SharedPageProps>;
}) {
    const [consent, setConsent] = useState(initialPage.props.cookieConsent);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(
        () =>
            router.on('navigate', (event) =>
                setConsent(event.detail.page.props.cookieConsent),
            ),
        [],
    );

    useEffect(() => onOpenCookieSettings(() => setDialogOpen(true)), []);

    useEffect(() => {
        if (consent) {
            applyConsent(consent);
        }
    }, [consent]);

    function save(choice: Consent) {
        router.post(store.url(), choice, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setSaving(true),
            // Back on the same page: Inertia doesn't fire "navigate" for it.
            onSuccess: (page) => {
                setConsent(page.props.cookieConsent);
                setDialogOpen(false);
            },
            onFinish: () => setSaving(false),
        });
    }

    // Only necessary cookies exist for now: every button saves "nothing optional".
    const saveNecessaryOnly = () => save({ analytics: false, marketing: false });

    return (
        <>
            {consent === null && !dialogOpen && (
                <CookieBanner
                    onAccept={saveNecessaryOnly}
                    onManage={() => setDialogOpen(true)}
                    disabled={saving}
                />
            )}
            <CookiePreferencesDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={saveNecessaryOnly}
                disabled={saving}
            />
        </>
    );
}
