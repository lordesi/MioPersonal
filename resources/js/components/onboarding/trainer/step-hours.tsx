import { useState } from 'react';
import FormField from '@/components/auth/form-field';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { hourLabel } from '@/lib/calendar';
import { cn } from '@/lib/utils';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const dayLabels = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];
const allHours = Array.from({ length: 14 }, (_, index) => 7 + index);
const range = (from: number, to: number) =>
    allHours.filter((hour) => hour >= from && hour < to);

const groups = [
    { label: 'Mattina', range: '7–12', hours: range(7, 12) },
    { label: 'Pomeriggio', range: '12–18', hours: range(12, 18) },
    { label: 'Sera', range: '18–21', hours: range(18, 21) },
    { label: 'Tutto il giorno', range: '7–21', hours: allHours },
    { label: 'Svuota', range: '', hours: [] },
];

const hoursLabel = (n: number) => (n === 1 ? '1 ora' : `${n} ore`);
const minutesLabel = (n: number) => (n === 0 ? 'Nessuna' : `${n} minuti`);

const rules: {
    name: keyof TrainerDraft['rules'];
    label: string;
    hint: string;
    options: number[];
    format: (value: number) => string;
}[] = [
    {
        name: 'noticeHours',
        label: 'Preavviso minimo',
        hint: 'Niente prenotazioni all’ultimo minuto.',
        options: [2, 6, 12, 24, 48],
        format: hoursLabel,
    },
    {
        name: 'bookingWindowDays',
        label: 'Prenotabile fino a',
        hint: 'Oltre, il calendario è chiuso.',
        options: [14, 30, 60, 90],
        format: (n) => `${n} giorni`,
    },
    {
        name: 'breakMinutes',
        label: 'Pausa tra due sedute',
        hint: 'Per rifiatare e preparare.',
        options: [0, 15, 30],
        format: minutesLabel,
    },
    {
        name: 'travelMinutes',
        label: 'Spostamento per il domicilio',
        hint: 'Prima e dopo le sedute a casa del cliente.',
        options: [0, 15, 30, 45, 60],
        format: minutesLabel,
    },
    {
        name: 'maxSessionsPerDay',
        label: 'Massimo sedute al giorno',
        hint: 'Poi il giorno risulta pieno.',
        options: [2, 3, 4, 5, 6, 7, 8, 10],
        format: String,
    },
    {
        name: 'freeCancellationHours',
        label: 'Cancellazione gratuita',
        hint: 'La vedono i clienti prima di prenotare.',
        options: [12, 24, 48],
        format: (n) => `Fino a ${n} ore prima`,
    },
];

/** Step 5: weekly hours grid and booking rules. */
export default function StepHours({ draft, update }: StepProps) {
    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);

    const setDay = (day: number, hours: number[]) =>
        update({
            hours: draft.hours.map((current, index) =>
                index === day ? [...hours].sort((a, b) => a - b) : current,
            ),
        });

    const toggleHour = (day: number, hour: number) =>
        setDay(
            day,
            draft.hours[day].includes(hour)
                ? draft.hours[day].filter((item) => item !== hour)
                : [...draft.hours[day], hour],
        );

    /** Adds the group to the selected days, or removes it if all are there. */
    const applyGroup = (hours: number[]) =>
        update({
            hours: draft.hours.map((current, day) => {
                if (!selectedDays.includes(day)) {
                    return current;
                }

                if (hours.length === 0) {
                    return [];
                }

                const complete = hours.every((hour) => current.includes(hour));

                return complete
                    ? current.filter((hour) => !hours.includes(hour))
                    : [...new Set([...current, ...hours])].sort(
                          (a, b) => a - b,
                      );
            }),
        });

    return (
        <>
            <StepTitle
                title="I tuoi orari di lavoro"
                description="Da qui nascono gli slot prenotabili sul tuo profilo. Tocca le fasce in cui lavori; gli orari esatti li rifinisci dalla tua area."
            />

            <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-sm font-medium">
                        Ai giorni selezionati:
                    </span>
                    {groups.map((group) => (
                        <button
                            key={group.label}
                            type="button"
                            onClick={() => applyGroup(group.hours)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                        >
                            {group.label}
                            {group.range && (
                                <span className="font-normal text-muted-foreground tabular-nums">
                                    {group.range}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <div
                        role="group"
                        aria-label="Orari di lavoro della settimana"
                        className="grid min-w-80 grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-1 md:min-w-160 md:grid-cols-[60px_repeat(7,minmax(0,1fr))]"
                    >
                        <span />
                        {dayNames.map((name, day) => {
                            const on = selectedDays.includes(day);

                            return (
                                <button
                                    key={name}
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`Seleziona ${dayLabels[day].toLowerCase()}`}
                                    onClick={() =>
                                        setSelectedDays(
                                            on
                                                ? selectedDays.filter(
                                                      (item) => item !== day,
                                                  )
                                                : [...selectedDays, day],
                                        )
                                    }
                                    className={cn(
                                        'flex flex-col items-center gap-0.5 rounded-lg py-2',
                                        on
                                            ? 'border-2 border-foreground bg-secondary'
                                            : 'border bg-background text-muted-foreground',
                                    )}
                                >
                                    <span className="text-[13px] font-semibold">
                                        {name}
                                    </span>
                                    <span className="text-[11px] tabular-nums opacity-75">
                                        {draft.hours[day].length
                                            ? `${draft.hours[day].length} h`
                                            : 'riposo'}
                                    </span>
                                </button>
                            );
                        })}

                        {allHours.map((hour) => (
                            <HourRow
                                key={hour}
                                hour={hour}
                                draft={draft}
                                onToggle={toggleHour}
                            />
                        ))}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground tabular-nums">
                    <strong className="text-foreground">
                        {weeklyHours(draft)} ore a settimana.
                    </strong>{' '}
                    Tocca un giorno in alto per selezionarlo, poi aggiungi un
                    gruppo di ore; oppure tocca le singole ore. Sono gli stessi
                    slot da un’ora che i clienti vedono sul tuo profilo.
                </p>
            </div>

            <div className="flex flex-col gap-4 border-t pt-5">
                <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                        Regole di prenotazione
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Puoi cambiarle quando vuoi dalla tua area.
                    </span>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                    {rules.map((rule) => (
                        <FormField
                            key={rule.name}
                            label={rule.label}
                            hint={rule.hint}
                        >
                            {({ id, describedBy }) => (
                                <Select
                                    value={String(draft.rules[rule.name])}
                                    onValueChange={(value) =>
                                        update({
                                            rules: {
                                                ...draft.rules,
                                                [rule.name]: Number(value),
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id={id}
                                        aria-describedby={describedBy}
                                        className="h-10 w-full tabular-nums"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rule.options.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={String(option)}
                                            >
                                                {rule.format(option)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                    ))}
                </div>

                <fieldset className="flex flex-col gap-1">
                    <legend className="pb-1.5 text-sm font-medium">
                        Durate prenotabili
                    </legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        <ConsentCheckbox
                            name="duration_one"
                            checked={draft.durations.one}
                            onCheckedChange={(one) =>
                                update({
                                    durations: { ...draft.durations, one },
                                })
                            }
                        >
                            1 ora
                        </ConsentCheckbox>
                        <ConsentCheckbox
                            name="duration_two"
                            checked={draft.durations.two}
                            onCheckedChange={(two) =>
                                update({
                                    durations: { ...draft.durations, two },
                                })
                            }
                        >
                            2 ore
                        </ConsentCheckbox>
                    </div>
                </fieldset>

                <div className="rounded-lg bg-muted p-3">
                    <ConsentCheckbox
                        name="auto_confirm"
                        checked={draft.autoConfirm}
                        onCheckedChange={(autoConfirm) =>
                            update({ autoConfirm })
                        }
                    >
                        <span className="flex flex-col">
                            <span className="font-semibold">
                                Conferma automatica
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Se attiva, le prenotazioni sono confermate
                                subito. Se no, hai 24 ore per rispondere.
                            </span>
                        </span>
                    </ConsentCheckbox>
                </div>
            </div>
        </>
    );
}

function HourRow({
    hour,
    draft,
    onToggle,
}: {
    hour: number;
    draft: TrainerDraft;
    onToggle: (day: number, hour: number) => void;
}) {
    return (
        <>
            <span className="flex items-center justify-end pr-1.5 text-xs text-muted-foreground tabular-nums">
                {hourLabel(hour)}
            </span>
            {dayLabels.map((label, day) => {
                const on = draft.hours[day].includes(hour);

                return (
                    <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${label} ${hourLabel(hour)}, ${on ? 'disponibile' : 'non disponibile'}`}
                        onClick={() => onToggle(day, hour)}
                        className={cn(
                            'h-7.5 rounded-md',
                            on
                                ? 'bg-primary'
                                : 'border border-dashed border-input bg-background',
                        )}
                    />
                );
            })}
        </>
    );
}
