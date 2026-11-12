import { Bell, Download, X } from 'lucide-react';
import { useState } from 'react';
import InstallSteps from '@/components/pwa/install-steps';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { installApp, isStandalone, useCanInstall } from '@/lib/pwa';
import { cn } from '@/lib/utils';

type AppNotificationsCardProps = {
    /** "Ricevi subito le nuove richieste" */
    title: string;
    /** Why the notifications help on this page. */
    description: string;
    /** "Non ora" hides the card on this browser for DISMISS_DAYS (one key per page). */
    dismissKey: string;
    className?: string;
};

const DISMISS_DAYS = 14;

function dismissedUntil(key: string): number {
    try {
        return Number(window.localStorage.getItem(`pwa-card:${key}`) ?? 0);
    } catch {
        return 0;
    }
}

function dismiss(key: string): void {
    try {
        window.localStorage.setItem(
            `pwa-card:${key}`,
            String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
        );
    } catch {
        // Private mode: the card simply comes back next time.
    }
}

/**
 * "Attiva le notifiche", and "Installa l'app" where the browser allows it.
 * On the iPhone in Safari: how to add the app to the home screen, the only
 * place where iOS delivers the push notifications. Hidden when they are on,
 * blocked, not supported, or after "Non ora".
 */
export default function AppNotificationsCard({
    title,
    description,
    dismissKey,
    className,
}: AppNotificationsCardProps) {
    const push = usePushNotifications();
    const canInstall = useCanInstall();
    const [hidden, setHidden] = useState(
        () =>
            typeof window === 'undefined' ||
            dismissedUntil(dismissKey) > Date.now(),
    );

    const offerInstall = canInstall && !isStandalone();
    const visible =
        !hidden &&
        (push.state === 'off' ||
            push.state === 'needs-install' ||
            (push.state === 'unsupported' && offerInstall));

    if (!visible) {
        return null;
    }

    const close = () => {
        dismiss(dismissKey);
        setHidden(true);
    };

    return (
        <section
            aria-label={title}
            className={cn(
                'relative flex gap-3 rounded-[14px] border bg-card p-4 pr-11 text-sm',
                className,
            )}
        >
            <Bell aria-hidden="true" className="mt-0.5 size-5 flex-none" />
            <div className="flex min-w-0 flex-col gap-2.5">
                {push.state === 'needs-install' ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <strong className="font-semibold">
                                Ricevi le notifiche sull’iPhone
                            </strong>
                            <span className="text-muted-foreground">
                                Su iPhone le notifiche arrivano solo dall’app
                                sulla schermata Home. Ci vogliono 10 secondi:
                            </span>
                        </div>
                        <InstallSteps method="ios" withNotifications />
                    </>
                ) : (
                    <div className="flex flex-col gap-1">
                        <strong className="font-semibold">
                            {push.state === 'off' ? title : 'Installa l’app'}
                        </strong>
                        <span className="text-muted-foreground">
                            {push.state === 'off'
                                ? description
                                : 'MioPersonal sulla schermata Home, a un tocco come le altre app.'}
                        </span>
                    </div>
                )}

                {push.state !== 'needs-install' && (
                    <div className="flex flex-wrap gap-2">
                        {push.state === 'off' && (
                            <Button
                                type="button"
                                disabled={push.processing}
                                onClick={() => void push.enable()}
                                className="h-10 font-semibold"
                            >
                                <Bell aria-hidden="true" />
                                Attiva le notifiche
                            </Button>
                        )}
                        {offerInstall && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void installApp()}
                                className="h-10"
                            >
                                <Download aria-hidden="true" />
                                Installa l’app
                            </Button>
                        )}
                    </div>
                )}
                {push.failed && (
                    <p role="alert" className="text-destructive">
                        Non siamo riusciti ad attivarle. Riprova tra poco.
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={close}
                aria-label="Non ora"
                className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
                <X aria-hidden="true" className="size-4" />
            </button>
        </section>
    );
}
