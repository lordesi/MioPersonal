import { Head, Link, usePage } from '@inertiajs/react';
import { Check, MapPin, Navigation, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import MinimalHeader from '@/components/layout/minimal-header';
import ChoiceChips from '@/components/shared/choice-chips';
import ProgressBar from '@/components/shared/progress-bar';
import SwitchRow from '@/components/shared/switch-row';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { bookings } from '@/routes/client';

const options = (labels: string[]) =>
    labels.map((label) => ({ value: label, label }));

const modes = options(['In presenza', 'Online', 'Entrambe']);
// Training goals only: never ask about health (conditions, injuries…).
const goals = options([
    'Rimettermi in forma',
    'Diventare più forte',
    'Migliorare postura e mobilità',
    'Prepararmi a una gara',
    'Stare meglio',
]);
const disciplines = options([
    'Functional',
    'Pesi',
    'Pilates',
    'Yoga',
    'Crossfit',
    'Boxe',
    'Calisthenics',
]);
const times = options([
    'Mattina presto',
    'In mattinata',
    'Pausa pranzo',
    'Pomeriggio',
    'Sera',
    'Weekend',
]);
const budgets = options(['Fino a 35 €', '35–45 €', '45–60 €', 'Più di 60 €']);

const switches = [
    {
        key: 'reminders',
        label: 'Promemoria il giorno prima',
        hint: 'Via email, per ogni seduta confermata',
    },
    {
        key: 'push',
        label: 'Notifiche sul telefono',
        hint: 'Conferme e cambi di orario in tempo reale',
    },
    {
        key: 'news',
        label: 'Novità e consigli',
        hint: 'Facoltativo, al massimo una email al mese',
    },
] as const;

/**
 * Optional page right after the client sign-up.
 * TODO: save the preferences (needs a client_preferences table: ask first).
 */
export default function CompleteProfile() {
    const { auth } = usePage().props;
    const zoneId = useId();

    const [zone, setZone] = useState('');
    const [mode, setMode] = useState<string | null>(null);
    const [goal, setGoal] = useState<string | null>(null);
    const [chosenDisciplines, setChosenDisciplines] = useState<string[]>([]);
    const [chosenTimes, setChosenTimes] = useState<string[]>([]);
    const [budget, setBudget] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        reminders: true,
        push: false,
        news: false,
    });

    // Account and name count as already done, as in the design.
    const filled =
        2 +
        Number(goal !== null) +
        Number(chosenDisciplines.length > 0) +
        Number(chosenTimes.length > 0) +
        Number(budget !== null) +
        Number(zone.trim() !== '');
    const percent = Math.round((filled / 7) * 100);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Completa il tuo profilo" />

            <MinimalHeader logoLinksHome={false}>
                <Link href={bookings()} className="font-medium text-foreground">
                    Salta per ora
                </Link>
            </MinimalHeader>

            <main className="mx-auto flex w-full max-w-190 flex-col gap-5 px-4 pt-5 pb-10 md:px-8 md:pt-10 md:pb-16">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm tabular-nums">
                            <span className="font-medium">
                                Profilo completo al {percent}%
                            </span>
                            <span className="text-muted-foreground">
                                Facoltativo
                            </span>
                        </div>
                        <ProgressBar
                            value={percent}
                            label="Completamento del profilo"
                        />
                    </div>
                    <span className="inline-flex h-6.5 items-center gap-1.5 self-start rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground">
                        <Check aria-hidden="true" className="size-3.5" />
                        Account creato
                    </span>
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-4xl">
                        Completa il tuo profilo
                    </h1>
                    <p className="text-muted-foreground">
                        Un minuto in più ci aiuta a suggerirti i trainer e gli
                        orari giusti.
                    </p>
                </div>

                <Card>
                    <div className="flex items-center gap-4">
                        <UserAvatar
                            name={auth?.user?.name ?? ''}
                            size="xl"
                            className="size-16"
                        />
                        <div className="flex flex-col items-start gap-1.5">
                            <span className="text-[15px] font-semibold">
                                Foto profilo
                            </span>
                            {/* TODO: upload and store the photo. */}
                            <Button type="button" variant="outline" size="sm">
                                <Upload aria-hidden="true" />
                                Carica una foto
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                La vedono solo i trainer che prenoti.
                            </span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={zoneId} className="text-[15px]">
                            Dove ti alleni di solito
                        </Label>
                        <div className="flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-[3px] focus-within:ring-ring/50">
                            <MapPin
                                aria-hidden="true"
                                className="size-4 text-muted-foreground"
                            />
                            <input
                                id={zoneId}
                                type="search"
                                autoComplete="street-address"
                                placeholder="Quartiere, via o CAP"
                                value={zone}
                                onChange={(event) =>
                                    setZone(event.target.value)
                                }
                                className="min-w-0 flex-1 bg-transparent text-base outline-none"
                            />
                        </div>
                        {/* TODO: fill the field from the browser's location. */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="self-start px-0 hover:bg-transparent hover:underline"
                        >
                            <Navigation aria-hidden="true" />
                            Usa la mia posizione attuale
                        </Button>
                    </div>
                    <Choice legend="Come preferisci allenarti">
                        {(labelId) => (
                            <ChoiceChips
                                aria-labelledby={labelId}
                                options={modes}
                                value={mode}
                                onChange={setMode}
                            />
                        )}
                    </Choice>
                </Card>

                <Card>
                    <Choice legend="Il tuo obiettivo">
                        {(labelId) => (
                            <ChoiceChips
                                aria-labelledby={labelId}
                                options={goals}
                                value={goal}
                                onChange={setGoal}
                            />
                        )}
                    </Choice>
                    <Choice
                        legend="Discipline che ti interessano"
                        note="anche più di una"
                    >
                        {(labelId) => (
                            <ChoiceChips
                                multiple
                                aria-labelledby={labelId}
                                options={disciplines}
                                value={chosenDisciplines}
                                onChange={setChosenDisciplines}
                            />
                        )}
                    </Choice>
                    <Choice
                        legend="Quando preferisci allenarti"
                        note="anche più di una"
                    >
                        {(labelId) => (
                            <ChoiceChips
                                multiple
                                aria-labelledby={labelId}
                                options={times}
                                value={chosenTimes}
                                onChange={setChosenTimes}
                            />
                        )}
                    </Choice>
                    <Choice legend="Budget indicativo a seduta">
                        {(labelId) => (
                            <ChoiceChips
                                aria-labelledby={labelId}
                                options={budgets}
                                value={budget}
                                onChange={setBudget}
                            />
                        )}
                    </Choice>
                </Card>

                <Card>
                    <span className="text-[15px] font-semibold">
                        Promemoria e notifiche
                    </span>
                    {switches.map((item) => (
                        <SwitchRow
                            key={item.key}
                            label={item.label}
                            description={item.hint}
                            checked={settings[item.key]}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    [item.key]: checked,
                                })
                            }
                        />
                    ))}
                </Card>

                <div className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        className="h-12 flex-[1_1_220px] text-base font-semibold"
                    >
                        <Link href={bookings()}>Salva e continua</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 flex-[1_1_220px] text-base"
                    >
                        <Link href={bookings()}>Salta per ora</Link>
                    </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    Puoi completare o cambiare tutto quando vuoi da Account. Non
                    ti chiediamo dati sulla salute.
                </p>
            </main>
        </div>
    );
}

function Card({ children }: { children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6">
            {children}
        </section>
    );
}

/** A group of chips with its title, read as one question by screen readers. */
function Choice({
    legend,
    note,
    children,
}: {
    legend: string;
    note?: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <span id={labelId} className="text-[15px] font-semibold">
                {legend}
                {note && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        · {note}
                    </span>
                )}
            </span>
            {children(labelId)}
        </div>
    );
}
