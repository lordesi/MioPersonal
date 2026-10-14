import { router } from '@inertiajs/react';
import { useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import SettingsSection from '@/components/account/settings-section';
import ChoiceChips from '@/components/shared/choice-chips';
import SwitchRow from '@/components/shared/switch-row';
import { Button } from '@/components/ui/button';
import { formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerVisibility } from '@/types';

type Pause = '1w' | '2w' | '1m' | 'custom';

const pauseOptions: { value: Pause; label: string }[] = [
    { value: '1w', label: '1 settimana' },
    { value: '2w', label: '2 settimane' },
    { value: '1m', label: '1 mese' },
    { value: 'custom', label: 'Scegli le date' },
];

/**
 * Whether the trainer shows up in the search and takes new clients, and the
 * pause for holidays. Every change is saved right away.
 */
export default function ProfileVisibilitySection({
    visibleInSearch,
    acceptsNewClients,
    pausedUntil,
}: TrainerVisibility) {
    const [visible, setVisible] = useState(visibleInSearch);
    const [newClients, setNewClients] = useState(acceptsNewClients);
    // TODO: open a date range picker for "Scegli le date".
    const [custom, setCustom] = useState(false);
    const [processing, setProcessing] = useState(false);

    const save = (
        changes: { visible?: boolean; newClients?: boolean },
        pause?: '1w' | '2w' | '1m' | 'none',
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
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: () => {
                    setVisible(previous.visible);
                    setNewClients(previous.newClients);
                },
            },
        );
    };

    const choosePause = (value: Pause) => {
        if (value === 'custom') {
            setCustom(!custom);

            return;
        }

        setCustom(false);
        save({}, value);
    };

    const paused = pausedUntil !== null;
    const online = !paused && visible && newClients;
    const title = paused
        ? 'In pausa'
        : !visible
          ? 'Nascosto dalla ricerca'
          : !newClients
            ? 'Solo clienti già seguiti'
            : 'Online e prenotabile';
    const hint = paused
        ? `Nessuno può prenotare fino ${formatUntilDay(pausedUntil)}`
        : online
          ? 'I clienti ti trovano e possono prenotare'
          : 'Controlla le opzioni qui sotto';

    return (
        <SettingsSection
            id="visibilita"
            title="Visibilità del profilo"
            description="Decidi se comparire nella ricerca e se accettare nuovi clienti."
        >
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3.5">
                <span
                    aria-hidden="true"
                    className={cn(
                        'size-3 flex-none rounded-full',
                        online ? 'bg-foreground' : 'border-2 border-foreground',
                    )}
                />
                <span role="status" className="flex flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{title}</span>
                    <span className="text-[13px] text-muted-foreground">
                        {hint}
                    </span>
                </span>
            </div>

            <div className="flex flex-col">
                <SwitchRow
                    label="Visibile nella ricerca"
                    description="Se lo spegni, il profilo resta raggiungibile solo con il link diretto"
                    checked={visible}
                    onCheckedChange={(checked) => save({ visible: checked })}
                    className="border-b py-3"
                />
                <SwitchRow
                    label="Accetto nuovi clienti"
                    description="Se lo spegni, possono prenotare solo i clienti che hai già seguito"
                    checked={newClients}
                    onCheckedChange={(checked) => save({ newClients: checked })}
                    className="border-b py-3"
                />
            </div>

            <div className="flex flex-col gap-2.5">
                <span id="pause-title" className="text-[15px] font-semibold">
                    Metti in pausa per un periodo
                </span>
                <span className="text-[13px] leading-4.75 text-muted-foreground">
                    Per ferie o infortuni: il profilo resta online ma non si può
                    prenotare, e chi ti ha salvato tra i preferiti viene
                    avvisato al rientro.
                </span>
                <ChoiceChips
                    aria-labelledby="pause-title"
                    options={pauseOptions}
                    value={custom ? 'custom' : null}
                    onChange={choosePause}
                />
                {custom && (
                    <span className="text-[13px] text-muted-foreground">
                        La scelta delle date arriva presto: per ora usa una
                        delle durate qui sopra.
                    </span>
                )}
                {paused && (
                    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border-[1.5px] border-foreground px-3.5 py-3 text-sm">
                        <span>
                            <strong>
                                In pausa fino {formatUntilDay(pausedUntil)}.
                            </strong>{' '}
                            Le prenotazioni già confermate restano valide.
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            disabled={processing}
                            onClick={() => save({}, 'none')}
                        >
                            Riprendi ora
                        </Button>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
