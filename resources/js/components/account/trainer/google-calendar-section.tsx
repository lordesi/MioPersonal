import { router } from '@inertiajs/react';
import { CalendarDays, CalendarX2 } from 'lucide-react';
import { useState } from 'react';
import TrainerGoogleCalendarController from '@/actions/App/Http/Controllers/TrainerGoogleCalendarController';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { formatDayShort, formatTime } from '@/lib/format';
import type { TrainerGoogleCalendar } from '@/types';

/**
 * "Collega Google Calendar": the confirmed sessions and the events are
 * written on a calendar "MioPersonal" made on the trainer's Google account.
 * Optional, the other way ("Blocca gli orari occupati"): the times they're
 * busy on their Google calendars can't be booked. Only when, never what.
 */
export default function GoogleCalendarSection({
    connected,
    email,
    error,
    readsBusy,
    busySyncedAt,
}: TrainerGoogleCalendar) {
    const [processing, setProcessing] = useState(false);

    const disconnect = () =>
        router.delete(TrainerGoogleCalendarController.disconnect.url(), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });

    const toggleBusy = (on: boolean) => {
        if (on) {
            // A normal page change: Google asks the trainer for the permission.
            setProcessing(true);
            window.location.href = TrainerGoogleCalendarController.connect.url({
                query: { occupato: 1 },
            });

            return;
        }

        router.delete(TrainerGoogleCalendarController.disableBusy.url(), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    const busyDescription = !readsBusy
        ? 'Vediamo solo quando sei impegnato su Google, mai cosa fai.'
        : busySyncedAt
          ? `Aggiornato ${formatDayShort(busySyncedAt)} alle ${formatTime(busySyncedAt)}`
          : 'Stiamo leggendo i tuoi impegni…';

    return (
        <SettingsSection
            id="calendario"
            title="Google Calendar"
            icon={CalendarDays}
            description="Le sedute confermate compaiono da sole nel tuo calendario Google, anche sul telefono."
        >
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-3.5">
                <span className="flex min-w-40 flex-1 flex-col">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        {connected ? email : 'Non collegato'}
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {connected
                            ? error
                                ? `${error} Ricollega il calendario.`
                                : 'Collegato · calendario “MioPersonal”'
                            : 'Creiamo un calendario “MioPersonal” solo per le sedute. Se vuoi, dopo puoi bloccare gli orari in cui sei già impegnato.'}
                    </span>
                </span>
                {connected && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 font-semibold"
                        disabled={processing}
                        onClick={disconnect}
                    >
                        Scollega
                    </Button>
                )}
                {(!connected || error) && (
                    // A normal link, not Inertia: the page goes to Google.
                    <Button asChild className="h-10 font-semibold">
                        <a href={TrainerGoogleCalendarController.connect.url()}>
                            {connected ? 'Ricollega' : 'Collega'}
                        </a>
                    </Button>
                )}
            </div>
            {connected && !error && (
                <SettingSwitch
                    label="Blocca gli orari occupati"
                    description={busyDescription}
                    icon={CalendarX2}
                    checked={readsBusy}
                    onCheckedChange={toggleBusy}
                    disabled={processing}
                />
            )}
        </SettingsSection>
    );
}
