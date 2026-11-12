import type { Page, SharedPageProps } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { Bell, Download, Smartphone, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import InstallSteps from '@/components/pwa/install-steps';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { enablePush, pushState } from '@/lib/push';
import type { PushState } from '@/lib/push';
import { installApp, onOpenAppPrompt, useInstallMethod } from '@/lib/pwa';

/**
 * "Installa l'app" (and, logged in, "Attiva le notifiche") as a popup, for
 * guests and every role but the admins. It opens by itself a few seconds
 * after a page, at most once every DISMISS_DAYS on this browser; the menu and
 * the settings open it any time (openAppPrompt in lib/pwa.ts).
 *
 * It sits next to the app like the cookie banner (lib/inertia-config.tsx), so
 * usePage() isn't available: the page comes from each navigation.
 */

const STORAGE_KEY = 'pwa-prompt:until';
const DAY = 24 * 60 * 60 * 1000;
const DISMISS_DAYS = 3;
/** "L'ho già aggiunta" on Safari: the browser can't tell, we trust the user. */
const DONE_DAYS = 90;
const OPEN_DELAY_MS = 4000;

function snoozedUntil(): number {
    try {
        return Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    } catch {
        return 0;
    }
}

function snooze(days: number): void {
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            String(Date.now() + days * DAY),
        );
    } catch {
        // Private mode: the popup simply comes back next time.
    }
}

/** Pages where a popup would be in the way: sign-in, onboarding, admin. */
function quietPage(component: string): boolean {
    return (
        component.startsWith('auth/') ||
        component.startsWith('onboarding/') ||
        component.startsWith('dev/') ||
        component.startsWith('admin/') ||
        component === 'client/booking-sent'
    );
}

export default function AppPrompt({
    initialPage,
}: {
    initialPage: Page<SharedPageProps>;
}) {
    const [page, setPage] = useState(initialPage);
    const [open, setOpen] = useState(false);
    const [push, setPush] = useState<PushState | null>(null);
    const [processing, setProcessing] = useState(false);
    const [failed, setFailed] = useState(false);
    const method = useInstallMethod();
    const isMobile = useIsMobile();

    useEffect(
        () => router.on('navigate', (event) => setPage(event.detail.page)),
        [],
    );

    const user = page.props.auth?.user ?? null;
    const role = user?.role;
    const publicKey = page.props.vapidPublicKey;
    const loggedIn = user !== null && role !== 'admin';

    // The push of this device, only for who can receive them.
    useEffect(() => {
        if (!loggedIn) {
            setPush(null);

            return;
        }

        let active = true;
        pushState(publicKey)
            .then((state) => active && setPush(state))
            .catch(() => active && setPush('unsupported'));

        return () => {
            active = false;
        };
    }, [loggedIn, publicKey]);

    const offerPush = loggedIn && push === 'off';
    const hasSomething = method !== null || offerPush;

    // By itself: after the cookie banner, on a quiet page, not snoozed.
    useEffect(() => {
        if (
            open ||
            !hasSomething ||
            role === 'admin' ||
            page.props.cookieConsent === null ||
            quietPage(page.component) ||
            snoozedUntil() > Date.now()
        ) {
            return;
        }

        const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [open, hasSomething, role, page]);

    useEffect(() => onOpenAppPrompt(() => setOpen(true)), []);

    const close = (days = DISMISS_DAYS) => {
        snooze(days);
        setOpen(false);
    };

    const install = async () => {
        if (await installApp()) {
            // Installed: the notifications are offered by the app itself.
            close(DONE_DAYS);
        }
    };

    const turnOnPush = async () => {
        if (publicKey === null) {
            return;
        }

        setProcessing(true);
        setFailed(false);

        try {
            const state = await enablePush(publicKey);
            setPush(state);

            if (state === 'on') {
                close(DONE_DAYS);
            }
        } catch {
            setFailed(true);
        } finally {
            setProcessing(false);
        }
    };

    // Opened from the menu with nothing left to do (e.g. installed meanwhile).
    if (!hasSomething) {
        return null;
    }

    const installing = method !== null;
    const title = installing
        ? isMobile
            ? 'Porta MioPersonal sul telefono'
            : 'Installa MioPersonal sul computer'
        : 'Attiva le notifiche';
    const description = installing
        ? 'Un’app vera e propria, senza passare dallo store.'
        : role === 'client'
          ? 'Conferme, cambi di orario e promemoria appena succedono.'
          : 'Nuove richieste e messaggi importanti appena arrivano.';

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => (next ? setOpen(true) : close())}
        >
            <DialogContent
                // A sheet from the bottom on the phone, a card in the middle on the computer.
                className="max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
            >
                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                    <img
                        src="/icons/icon-192.png"
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 rounded-2xl shadow-md"
                    />
                    <DialogTitle className="text-xl leading-7">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[15px] leading-5.5">
                        {description}
                    </DialogDescription>
                </div>

                {installing && (
                    <ul className="flex flex-col gap-2.5 rounded-2xl bg-muted px-4 py-3.5 text-sm">
                        <Benefit icon={<Zap className="size-4" />}>
                            Si apre con un tocco, a schermo intero
                        </Benefit>
                        <Benefit icon={<Bell className="size-4" />}>
                            {loggedIn
                                ? 'Notifiche di prenotazioni e promemoria'
                                : 'Notifiche quando ti confermano una seduta'}
                        </Benefit>
                        <Benefit icon={<Smartphone className="size-4" />}>
                            Leggera: niente da scaricare dallo store
                        </Benefit>
                    </ul>
                )}

                {(method === 'ios' || method === 'mac-safari') && (
                    <div className="flex flex-col gap-2 text-sm">
                        <strong className="font-semibold">
                            Ci vogliono 10 secondi:
                        </strong>
                        <InstallSteps
                            method={method}
                            withNotifications={loggedIn && method === 'ios'}
                        />
                    </div>
                )}

                {failed && (
                    <p role="alert" className="text-sm text-destructive">
                        Non siamo riusciti ad attivarle. Riprova tra poco.
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    {method === 'prompt' && (
                        <Button
                            type="button"
                            onClick={() => void install()}
                            className="h-11 font-semibold"
                        >
                            <Download aria-hidden="true" />
                            Installa l’app
                        </Button>
                    )}
                    {(method === 'ios' || method === 'mac-safari') && (
                        <Button
                            type="button"
                            onClick={() => close(DONE_DAYS)}
                            className="h-11 font-semibold"
                        >
                            L’ho aggiunta
                        </Button>
                    )}
                    {offerPush && (
                        <Button
                            type="button"
                            variant={installing ? 'outline' : 'default'}
                            disabled={processing}
                            onClick={() => void turnOnPush()}
                            className="h-11 font-semibold"
                        >
                            <Bell aria-hidden="true" />
                            {installing
                                ? 'Attiva solo le notifiche'
                                : 'Attiva le notifiche'}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => close()}
                        className="h-11"
                    >
                        Non ora
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Benefit({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <li className="flex items-center gap-2.5">
            <span
                aria-hidden="true"
                className="flex size-7 flex-none items-center justify-center rounded-lg bg-background"
            >
                {icon}
            </span>
            {children}
        </li>
    );
}
