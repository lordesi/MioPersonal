import type { Page, SharedPageProps } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { Bell, Download, Monitor, Smartphone, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import DarkDialog, {
    darkSecondaryButtonClassName,
} from '@/components/mp/dark-dialog';
import InstallSteps from '@/components/pwa/install-steps';
import { useIsMobile } from '@/hooks/use-mobile';
import { enablePush, pushState } from '@/lib/push';
import type { PushState } from '@/lib/push';
import { installApp, onOpenAppPrompt, useInstallMethod } from '@/lib/pwa';
import { cn } from '@/lib/utils';

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
    const title = installing ? (
        isMobile ? (
            'Installa l’app'
        ) : (
            <>
                Installa <strong className="font-bold">MioPersonal</strong> sul
                computer
            </>
        )
    ) : (
        <>
            Attiva le <strong className="font-bold">notifiche</strong>
        </>
    );
    const description = installing
        ? // Phones: said in the "App" card instead.
          isMobile
            ? undefined
            : 'Un’app vera e propria, senza passare dallo store.'
        : role === 'client'
          ? 'Conferme, cambi di orario e promemoria appena succedono.'
          : 'Nuove richieste e messaggi importanti appena arrivano.';

    const primaryClassName =
        'btn-brand h-12.5 w-full text-[17px] tracking-[-0.43px]';

    return (
        <DarkDialog
            open={open}
            onOpenChange={(next) => (next ? setOpen(true) : close())}
            title={title}
            description={description}
            logo
        >
            {installing && isMobile && (
                <Section title="App">
                    <div className="flex items-center gap-3 rounded-[20px] bg-[#141414] px-4 py-3.5 shadow-[inset_0_0_0_1.5px_var(--brand)]">
                        <img
                            src="/icons/icon-192.png"
                            alt=""
                            width={48}
                            height={48}
                            className="size-12 shrink-0 rounded-xl"
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-[17px] leading-5.5 font-semibold tracking-[-0.43px]">
                                MioPersonal sul telefono
                            </span>
                            <span className="text-[13px] leading-4.5 tracking-[-0.08px] text-muted-foreground">
                                Un’app vera e propria, senza passare dallo store
                            </span>
                        </div>
                    </div>
                </Section>
            )}

            {installing && (
                <Section title="Cosa ottieni" titleClassName="md:sr-only">
                    <ul className="flex flex-col gap-2 md:gap-3">
                        <Benefit icon={<Zap />}>
                            {isMobile
                                ? 'Si apre con un tocco, a schermo intero'
                                : 'Si apre con un clic, in una finestra tutta sua'}
                        </Benefit>
                        <Benefit icon={<Bell />}>
                            {loggedIn
                                ? 'Notifiche di prenotazioni e promemoria'
                                : 'Notifiche quando ti confermano una seduta'}
                        </Benefit>
                        <Benefit icon={isMobile ? <Smartphone /> : <Monitor />}>
                            Leggera: niente da scaricare dallo store
                        </Benefit>
                    </ul>
                </Section>
            )}

            {(method === 'ios' || method === 'mac-safari') && (
                <Section title="Ci vogliono 10 secondi">
                    <div className="text-[15px] leading-5 text-muted-foreground [&_strong]:text-foreground">
                        <InstallSteps
                            method={method}
                            withNotifications={loggedIn && method === 'ios'}
                        />
                    </div>
                </Section>
            )}

            {failed && (
                <p role="alert" className="text-[15px] text-destructive">
                    Non siamo riusciti ad attivarle. Riprova tra poco.
                </p>
            )}

            <div className="flex flex-col gap-3 pt-2 md:gap-2.5 md:pt-1">
                {method === 'prompt' && (
                    <button
                        type="button"
                        onClick={() => void install()}
                        className={primaryClassName}
                    >
                        <Download aria-hidden="true" className="size-5" />
                        Installa l’app
                    </button>
                )}
                {(method === 'ios' || method === 'mac-safari') && (
                    <button
                        type="button"
                        onClick={() => close(DONE_DAYS)}
                        className={primaryClassName}
                    >
                        L’ho aggiunta
                    </button>
                )}
                {offerPush && (
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => void turnOnPush()}
                        className={
                            installing
                                ? 'flex h-12.5 w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold tracking-[-0.43px] shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60'
                                : primaryClassName
                        }
                    >
                        <Bell aria-hidden="true" className="size-5" />
                        {installing
                            ? 'Attiva solo le notifiche'
                            : 'Attiva le notifiche'}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => close()}
                    className={darkSecondaryButtonClassName}
                >
                    Non ora
                </button>
            </div>
        </DarkDialog>
    );
}

/** "App", "Cosa ottieni": a small title over its content. */
function Section({
    title,
    titleClassName,
    children,
}: {
    title: string;
    titleClassName?: string;
    children: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-3">
            <h3
                className={cn(
                    'text-[15px] leading-5 font-semibold tracking-[-0.23px]',
                    titleClassName,
                )}
            >
                {title}
            </h3>
            {children}
        </section>
    );
}

/** A row of "Cosa ottieni": grey card on phones, turquoise outline on desktop. */
function Benefit({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <li className="flex items-center gap-3 rounded-[20px] bg-[#141414] px-4 py-3 text-[15px] leading-5 tracking-[-0.23px] shadow-[inset_0_0_0_1px_var(--border)] md:min-h-16 md:rounded-[14px] md:bg-transparent md:px-4.5 md:py-2 md:font-semibold md:shadow-[inset_0_0_0_1px_var(--brand)]">
            <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1f1f1f] text-foreground md:size-5 md:bg-transparent md:text-brand [&_svg]:size-5"
            >
                {icon}
            </span>
            {children}
        </li>
    );
}
