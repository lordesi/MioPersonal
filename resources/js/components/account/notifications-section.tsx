import { useState } from 'react';
import SettingsSection from '@/components/account/settings-section';
import SwitchRow from '@/components/shared/switch-row';
import type { NotificationSetting } from '@/types';

type NotificationsSectionProps = {
    /** Different for clients and trainers. */
    settings: NotificationSetting[];
};

/**
 * Booking emails are always on; the rest can be switched off.
 * TODO: save the choices on the server; for now they only live in the page.
 */
export default function NotificationsSection({
    settings,
}: NotificationsSectionProps) {
    const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(settings.map((item) => [item.key, item.defaultOn])),
    );

    return (
        <SettingsSection
            id="notifiche"
            title="Notifiche"
            description="Scegli cosa ricevere e dove. Le email sulle prenotazioni non si possono disattivare: servono a confermarle."
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-3 border-b py-3">
                    <span className="flex flex-1 flex-col">
                        <span className="text-sm font-semibold">
                            Conferme, cambi e annullamenti
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Via email, sempre attive
                        </span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                        Obbligatorie
                    </span>
                </div>
                {settings.map((item) => (
                    <SwitchRow
                        key={item.key}
                        label={item.label}
                        description={item.hint}
                        checked={enabled[item.key]}
                        onCheckedChange={(checked) =>
                            setEnabled({ ...enabled, [item.key]: checked })
                        }
                        className="border-b py-3"
                    />
                ))}
            </div>
        </SettingsSection>
    );
}
