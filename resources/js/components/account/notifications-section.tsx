import { router } from '@inertiajs/react';
import { Bell, BellRing, CalendarClock, Download } from 'lucide-react';
import { useState } from 'react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { installApp, isStandalone, useCanInstall } from '@/lib/pwa';
import type { PushState } from '@/lib/push';

type NotificationsSectionProps = {
    reminders: boolean;
    /** Who gets the reminders: the text changes for trainers. */
    forTrainer?: boolean;
};

const pushTexts: Record<PushState, string> = {
    on: 'Attive su questo dispositivo.',
    off: 'Spente su questo dispositivo: ti scriviamo solo per email.',
    denied: 'Bloccate dal browser: per riattivarle apri le impostazioni del sito nel browser e consenti le notifiche.',
    'needs-install':
        'Su iPhone arrivano solo dall’app: in Safari tocca Condividi → “Aggiungi alla schermata Home”, poi aprila e attivale da qui.',
    unsupported: 'Questo browser non le supporta: ti scriviamo per email.',
};

/**
 * "Notifiche": the reminders before the sessions (saved on the account) and
 * the push notifications of this device (lib/push.ts).
 */
export default function NotificationsSection({
    reminders: savedReminders,
    forTrainer = false,
}: NotificationsSectionProps) {
    const [reminders, setReminders] = useState(savedReminders);
    const push = usePushNotifications();
    const canInstall = useCanInstall();

    const saveReminders = (checked: boolean) => {
        // The switch moves at once; it goes back if the server says no.
        setReminders(checked);
        router.patch(
            AccountSettingsController.updateNotifications.url(),
            { reminders: checked },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => setReminders(!checked),
            },
        );
    };

    return (
        <SettingsSection
            id="notifiche"
            title="Notifiche"
            icon={Bell}
            description={
                forTrainer
                    ? 'Le nuove richieste e i promemoria delle sedute, anche sul telefono.'
                    : 'Conferme, cambi di orario e promemoria delle sedute, anche sul telefono.'
            }
        >
            <SettingSwitch
                icon={CalendarClock}
                label="Promemoria prima delle sedute"
                description={
                    forTrainer
                        ? 'Il giorno prima di ogni seduta confermata.'
                        : 'Il giorno prima e 2 ore prima della seduta.'
                }
                checked={reminders}
                onCheckedChange={saveReminders}
            />

            {push.state !== null && (
                <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border bg-card px-4 py-3.5">
                    <span
                        aria-hidden="true"
                        className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-muted"
                    >
                        <BellRing className="size-4" />
                    </span>
                    <span className="flex min-w-50 flex-1 flex-col gap-px">
                        <span className="text-[15px] leading-5.5 font-semibold">
                            Notifiche su questo dispositivo
                        </span>
                        <span
                            role="status"
                            className="text-[13px] leading-4.5 text-muted-foreground"
                        >
                            {push.failed
                                ? 'Non è andata: riprova tra poco.'
                                : pushTexts[push.state]}
                        </span>
                    </span>
                    {push.state === 'off' && (
                        <Button
                            type="button"
                            disabled={push.processing}
                            onClick={() => void push.enable()}
                            className="h-10 font-semibold"
                        >
                            Attiva
                        </Button>
                    )}
                    {push.state === 'on' && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={push.processing}
                            onClick={() => void push.disable()}
                            className="h-10"
                        >
                            Disattiva
                        </Button>
                    )}
                </div>
            )}

            {canInstall && !isStandalone() && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void installApp()}
                    className="h-10 self-start"
                >
                    <Download aria-hidden="true" />
                    Installa l’app sul dispositivo
                </Button>
            )}
        </SettingsSection>
    );
}
