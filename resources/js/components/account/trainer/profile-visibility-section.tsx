import { useState } from 'react';
import SettingsSection from '@/components/account/settings-section';
import ChoiceChips from '@/components/shared/choice-chips';
import SwitchRow from '@/components/shared/switch-row';
import { Button } from '@/components/ui/button';
import { addDays, romeParts } from '@/lib/calendar';
import { formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';

type Pause = '1w' | '2w' | '1m' | 'custom';

const pauseOptions: { value: Pause; label: string }[] = [
    { value: '1w', label: '1 settimana' },
    { value: '2w', label: '2 settimane' },
    { value: '1m', label: '1 mese' },
    { value: 'custom', label: 'Scegli le date' },
];

/** "fino al 15 ottobre", counted from today in Rome. */
function pauseLabel(pause: Pause): string {
    const today = romeParts(new Date()).date;

    if (pause === 'custom') {
        // TODO: open a date range picker and show the chosen dates.
        return 'nelle date che scegli';
    }

    if (pause === '1m') {
        const day = new Date(`${today}T12:00:00Z`);
        day.setUTCMonth(day.getUTCMonth() + 1);

        return `fino ${formatUntilDay(day.toISOString().slice(0, 10))}`;
    }

    return `fino ${formatUntilDay(addDays(today, pause === '1w' ? 7 : 14))}`;
}

/**
 * Whether the trainer shows up in the search and takes new clients.
 * TODO: save on the server; for now it only lives in the page.
 */
export default function ProfileVisibilitySection() {
    const [visible, setVisible] = useState(true);
    const [newClients, setNewClients] = useState(true);
    const [pause, setPause] = useState<Pause | null>(null);

    const online = !pause && visible && newClients;
    const title = pause
        ? 'In pausa'
        : !visible
          ? 'Nascosto dalla ricerca'
          : !newClients
            ? 'Solo clienti già seguiti'
            : 'Online e prenotabile';
    const hint = pause
        ? `Nessuno può prenotare ${pauseLabel(pause)}`
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
                    onCheckedChange={setVisible}
                    className="border-b py-3"
                />
                <SwitchRow
                    label="Accetto nuovi clienti"
                    description="Se lo spegni, possono prenotare solo i clienti che hai già seguito"
                    checked={newClients}
                    onCheckedChange={setNewClients}
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
                    value={pause}
                    onChange={(value) =>
                        setPause(value === pause ? null : value)
                    }
                />
                {pause && (
                    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border-[1.5px] border-foreground px-3.5 py-3 text-sm">
                        <span>
                            <strong>In pausa {pauseLabel(pause)}.</strong> Le
                            prenotazioni già confermate restano valide.
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={() => setPause(null)}
                        >
                            Riprendi ora
                        </Button>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
