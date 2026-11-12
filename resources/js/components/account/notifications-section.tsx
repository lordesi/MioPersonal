import { router } from '@inertiajs/react';
import { Bell, BellRing, CalendarClock, Download } from 'lucide-react';
import { useState } from 'react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import type { PushState } from '@/lib/push';
import { installApp, openAppPrompt, useInstallMethod } from '@/lib/pwa';
import type { PushCategorySetting } from '@/types';

type NotificationsSectionProps = {
    role: 'client' | 'trainer' | 'gym';
    /** "Promemoria prima delle sedute": clients and trainers only. */
    reminders: boolean;
    /** "Cosa ricevere sul dispositivo" (App\Enums\PushCategory::forRole). */
    push: PushCategorySetting[];
};

const pushTexts: Record<PushState, string> = {
    on: 'Attive su questo dispositivo.',
    off: 'Spente su questo dispositivo: gli avvisi li trovi nella campanella del sito.',
    denied: 'Bloccate dal browser: per riattivarle apri le impostazioni del sito nel browser e consenti le notifiche.',
    'needs-install':
        'Su iPhone arrivano solo dall’app: in Safari tocca Condividi → “Aggiungi alla schermata Home”, poi aprila e attivale da qui.',
    unsupported:
        'Questo browser non le supporta: gli avvisi li trovi nella campanella del sito.',
};

const descriptions = {
    client: 'Conferme, cambi di orario e promemoria nella campanella del sito, e sul telefono se attivi le notifiche.',
    trainer:
        'Nuove richieste e promemoria nella campanella del sito, e sul telefono se attivi le notifiche.',
    gym: 'Richieste dei trainer e inviti agli eventi nella campanella del sito, e sul telefono se attivi le notifiche.',
};

/** One switch saved at once; it goes back if the server says no. */
function save(
    data: { reminders: boolean } | { push: Record<string, boolean> },
    undo: () => void,
): void {
    router.patch(AccountSettingsController.updateNotifications.url(), data, {
        preserveScroll: true,
        preserveState: true,
        onError: undo,
    });
}

/**
 * "Notifiche": the reminders before the sessions and the kinds of push
 * (saved on the account), the push notifications of this device (lib/push.ts)
 * and "Installa l'app".
 */
export default function NotificationsSection({
    role,
    reminders: savedReminders,
    push: savedCategories,
}: NotificationsSectionProps) {
    const [reminders, setReminders] = useState(savedReminders);
    const [categories, setCategories] = useState(() =>
        Object.fromEntries(savedCategories.map((c) => [c.key, c.enabled])),
    );
    const push = usePushNotifications();
    const installMethod = useInstallMethod();

    const saveReminders = (checked: boolean) => {
        setReminders(checked);
        save({ reminders: checked }, () => setReminders(!checked));
    };

    const saveCategory = (key: string, checked: boolean) => {
        const set = (value: boolean) =>
            setCategories((current) => ({ ...current, [key]: value }));
        set(checked);
        save({ push: { [key]: checked } }, () => set(!checked));
    };

    return (
        <SettingsSection
            id="notifiche"
            title="Notifiche"
            icon={Bell}
            description={descriptions[role]}
        >
            {role !== 'gym' && (
                <SettingSwitch
                    icon={CalendarClock}
                    label="Promemoria prima delle sedute"
                    description={
                        role === 'trainer'
                            ? 'Il giorno prima di ogni seduta confermata.'
                            : 'Il giorno prima e 2 ore prima della seduta.'
                    }
                    checked={reminders}
                    onCheckedChange={saveReminders}
                />
            )}

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

            {savedCategories.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-[15px] leading-5.5 font-semibold">
                            Cosa ricevere sul dispositivo
                        </h3>
                        <p className="text-[13px] leading-4.5 text-muted-foreground">
                            Valgono su tutti i dispositivi in cui attivi le
                            notifiche. Gli avvisi spenti restano nella
                            campanella del sito.
                        </p>
                    </div>
                    {savedCategories.map((category) => (
                        <SettingSwitch
                            key={category.key}
                            label={category.label}
                            description={category.description}
                            checked={categories[category.key] ?? true}
                            onCheckedChange={(checked) =>
                                saveCategory(category.key, checked)
                            }
                        />
                    ))}
                </div>
            )}

            {installMethod !== null && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        installMethod === 'prompt'
                            ? void installApp()
                            : openAppPrompt()
                    }
                    className="h-10 self-start"
                >
                    <Download aria-hidden="true" />
                    Installa l’app sul dispositivo
                </Button>
            )}
        </SettingsSection>
    );
}
