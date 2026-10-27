import { router } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useId, useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDays, romeParts } from '@/lib/calendar';
import { formatUntilDayShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerVisibility } from '@/types';

type Pause = '1w' | '2w' | '1m';

/** "2026-10-22" + 1 month → "2026-11-22", like Carbon's addMonths() on the server. */
function addMonths(date: string, months: number): string {
    const day = new Date(`${date}T12:00:00Z`);
    day.setUTCMonth(day.getUTCMonth() + months);

    return day.toISOString().slice(0, 10);
}

/** The first day bookable again for each duration, from today in Rome. */
function pauseEnds(today: string): Record<Pause, string> {
    return {
        '1w': addDays(today, 7),
        '2w': addDays(today, 14),
        '1m': addMonths(today, 1),
    };
}

const pauseLabels: Record<Pause, string> = {
    '1w': '1 settimana',
    '2w': '2 settimane',
    '1m': '1 mese',
};

/**
 * Whether the trainer shows up in the search and takes new clients, and the
 * pause for holidays. Every change is saved right away.
 */
export default function ProfileVisibilitySection({
    visibleInSearch,
    acceptsNewClients,
    pausedUntil,
    paused: pausedWithoutEnd,
}: TrainerVisibility) {
    const [visible, setVisible] = useState(visibleInSearch);
    const [newClients, setNewClients] = useState(acceptsNewClients);
    const [customOpen, setCustomOpen] = useState(false);
    const [until, setUntil] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [processing, setProcessing] = useState(false);
    const pauseTitleId = useId();
    const untilId = useId();

    const today = romeParts(new Date()).date;
    const ends = pauseEnds(today);
    const tomorrow = addDays(today, 1);
    // The server accepts a pause of at most one year.
    const lastDay = addMonths(today, 12);
    const untilValid = until >= tomorrow && until <= lastDay;

    const save = (
        changes: { visible?: boolean; newClients?: boolean },
        pause?: Pause | 'custom' | 'none',
    ) => {
        const next = {
            visible: changes.visible ?? visible,
            newClients: changes.newClients ?? newClients,
        };
        const previous = { visible, newClients };

        // The switch moves at once; it goes back if the server says no.
        setVisible(next.visible);
        setNewClients(next.newClients);
        router.patch(
            TrainerProfileSettingsController.updateVisibility.url(),
            {
                visible_in_search: next.visible,
                accepts_new_clients: next.newClients,
                pause: pause ?? null,
                pause_until: pause === 'custom' ? until : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setError(undefined);

                    if (pause === 'custom') {
                        setCustomOpen(false);
                    }
                },
                onError: (errors) => {
                    setVisible(previous.visible);
                    setNewClients(previous.newClients);
                    setError(errors.pause_until);
                },
            },
        );
    };

    const paused = pausedUntil !== null;
    // A chip is black when the current pause ends on its day.
    const activePause = (Object.keys(ends) as Pause[]).find(
        (pause) => ends[pause] === pausedUntil,
    );
    const customActive = customOpen || (paused && activePause === undefined);

    const status = pausedWithoutEnd
        ? {
              tone: 'pause',
              title: 'In pausa',
              hint: 'Non compari nella ricerca e nessuno può prenotare finché non riprendi.',
          }
        : paused
          ? {
                tone: 'pause',
                title: `In pausa fino ${formatUntilDayShort(pausedUntil)}`,
                hint: 'Il profilo resta visibile ma non si può prenotare.',
            }
          : !visible && !newClients
            ? {
                  tone: 'off',
                  title: 'Nascosto e chiuso ai nuovi',
                  hint: 'Raggiungibile solo con il link diretto, prenotano solo i clienti già seguiti.',
              }
            : !visible
              ? {
                    tone: 'off',
                    title: 'Nascosto dalla ricerca',
                    hint: 'Raggiungibile solo con il link diretto.',
                }
              : !newClients
                ? {
                      tone: 'off',
                      title: 'Solo clienti già seguiti',
                      hint: 'Compari nella ricerca, ma i nuovi clienti non possono prenotare.',
                  }
                : {
                      tone: 'on',
                      title: 'Online e prenotabile',
                      hint: 'I clienti ti trovano e possono prenotare.',
                  };

    const chipClass = (active: boolean) =>
        cn(
            'inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium',
            active
                ? 'border-foreground bg-foreground text-background'
                : 'bg-background hover:bg-accent',
        );

    return (
        <SettingsSection
            id="visibilita"
            title="Visibilità del profilo"
            icon={Eye}
            description="Decidi se comparire nella ricerca e se accettare nuovi clienti."
        >
            <div
                role="status"
                className="flex flex-wrap items-center gap-3.5 rounded-[20px] bg-sidebar px-5 py-4.5 text-sidebar-foreground"
            >
                <span
                    aria-hidden="true"
                    className="flex size-10 flex-none items-center justify-center rounded-full bg-sidebar-accent"
                >
                    <span
                        className={cn(
                            'size-3 rounded-full',
                            status.tone === 'on' &&
                                'bg-sidebar-primary ring-4 ring-sidebar-primary/20',
                            status.tone === 'pause' &&
                                'border-2 border-sidebar-primary',
                            status.tone === 'off' &&
                                'bg-sidebar-muted-foreground/60',
                        )}
                    />
                </span>
                <span className="flex min-w-50 flex-1 flex-col gap-0.5">
                    <span className="text-[17px] leading-6 font-bold tracking-tight">
                        {status.title}
                    </span>
                    <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                        {status.hint}
                    </span>
                </span>
                {(paused || pausedWithoutEnd) && (
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => save({}, 'none')}
                        className="h-10 bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    >
                        Riprendi ora
                    </Button>
                )}
            </div>

            <SettingSwitch
                label="Visibile nella ricerca"
                description="Se lo deselezioni, il profilo resta raggiungibile solo con il link diretto."
                checked={visible}
                onCheckedChange={(checked) => save({ visible: checked })}
            />
            <SettingSwitch
                label="Accetto nuovi clienti"
                description="Se lo deselezioni, possono prenotare solo i clienti che hai già seguito."
                checked={newClients}
                onCheckedChange={(checked) => save({ newClients: checked })}
            />

            <div className="flex flex-col gap-2.5 rounded-2xl border bg-muted/50 p-4">
                <span
                    id={pauseTitleId}
                    className="text-[15px] leading-5.5 font-semibold"
                >
                    Metti in pausa per un periodo
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    Il profilo resta online ma non è possibile ricevere
                    prenotazioni.
                </span>
                <div
                    role="group"
                    aria-labelledby={pauseTitleId}
                    className="flex flex-wrap gap-2"
                >
                    {(Object.keys(pauseLabels) as Pause[]).map((pause) => {
                        const active =
                            !customOpen && paused && activePause === pause;

                        return (
                            <button
                                key={pause}
                                type="button"
                                aria-pressed={active}
                                disabled={processing}
                                onClick={() => {
                                    setCustomOpen(false);
                                    save({}, active ? 'none' : pause);
                                }}
                                className={chipClass(active)}
                            >
                                {pauseLabels[pause]}
                                <span
                                    className={cn(
                                        'text-xs tabular-nums',
                                        active
                                            ? 'text-background/70'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    fino {formatUntilDayShort(ends[pause])}
                                </span>
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        aria-pressed={customActive}
                        aria-expanded={customOpen}
                        onClick={() => setCustomOpen(!customOpen)}
                        className={chipClass(customActive)}
                    >
                        Scegli le date
                        {paused && activePause === undefined && !customOpen && (
                            <span className="text-xs text-background/70 tabular-nums">
                                fino {formatUntilDayShort(pausedUntil)}
                            </span>
                        )}
                    </button>
                </div>
                {customOpen && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-end gap-2.5">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor={untilId}
                                    className="text-[13px] leading-4.5 font-semibold"
                                >
                                    Fino al
                                </label>
                                <Input
                                    id={untilId}
                                    type="date"
                                    min={tomorrow}
                                    max={lastDay}
                                    value={until}
                                    onChange={(event) =>
                                        setUntil(event.target.value)
                                    }
                                    aria-invalid={!!error}
                                    className="h-11 w-auto rounded-[10px] bg-background text-[15px] md:text-[15px]"
                                />
                            </div>
                            <Button
                                type="button"
                                disabled={!untilValid || processing}
                                onClick={() => save({}, 'custom')}
                                className="h-11 font-semibold"
                            >
                                Metti in pausa
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
