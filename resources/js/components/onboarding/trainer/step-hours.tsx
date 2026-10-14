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
import { SESSION_MINUTES } from '@/lib/booking';
import { hourLabel } from '@/lib/calendar';
import { formatDuration } from '@/lib/format';
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
/** Start hours from 6:00 to 23:00, so the last slot ends at 24:00 (as on the server). */
const allHours = Array.from({ length: 18 }, (_, index) => 6 + index);
const range = (from: number, to: number) =>
    allHours.filter((hour) => hour >= from && hour < to);

/**
 * The buttons above the grid. "toggle": added to the selected days, or
 * removed from all of them when every selected day already has the whole
 * group. "set": the day gets exactly these hours (all of them, or none).
 */
const groups: {
    label: string;
    range: string;
    hours: number[];
    mode: 'toggle' | 'set';
}[] = [
    { label: 'Mattina', range: '6–12', hours: range(6, 12), mode: 'toggle' },
    {
        label: 'Pomeriggio',
        range: '12–18',
        hours: range(12, 18),
        mode: 'toggle',
    },
    { label: 'Sera', range: '18–24', hours: range(18, 24), mode: 'toggle' },
    { label: 'Tutto il giorno', range: '6–24', hours: allHours, mode: 'set' },
    { label: 'Svuota', range: '', hours: [], mode: 'set' },
];

const hoursLabel = (n: number) => (n === 1 ? '1 ora' : `${n} ore`);
const minutesLabel = (n: number) => (n === 0 ? 'Nessuna' : `${n} minuti`);

/** Radix Select doesn't accept null: "Nessun limite" uses this value. */
const NO_LIMIT = 'none';

const rules: {
    name: keyof TrainerDraft['rules'];
    label: string;
    hint: string;
    /** null = "Nessun limite". */
    options: (number | null)[];
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
        name: 'maxSessionsPerDay',
        label: 'Massimo sedute al giorno',
        hint: 'Poi il giorno risulta pieno.',
        options: [2, 3, 4, 5, 6, 7, 8, 10, null],
        format: String,
    },
    {
        name: 'freeCancellationHours',
        label: 'Cancellazione',
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

    /**
     * Applies a group to the selected days. The choice "add or remove" is made
     * once for all of them, so days with different hours end up the same.
     */
    const applyGroup = (group: (typeof groups)[number]) => {
        const removing =
            group.mode === 'toggle' &&
            selectedDays.every((day) =>
                group.hours.every((hour) => draft.hours[day].includes(hour)),
            );

        update({
            hours: draft.hours.map((current, day) => {
                if (!selectedDays.includes(day)) {
                    return current;
                }

                if (group.mode === 'set') {
                    return [...group.hours];
                }

                return removing
                    ? current.filter((hour) => !group.hours.includes(hour))
                    : [...new Set([...current, ...group.hours])].sort(
                          (a, b) => a - b,
                      );
            }),
        });
    };

    const toggleDuration = (minutes: number) => {
        const sessionMinutes = draft.sessionMinutes.includes(minutes)
            ? draft.sessionMinutes.filter((item) => item !== minutes)
            : [...draft.sessionMinutes, minutes].sort((a, b) => a - b);

        update({ sessionMinutes });
    };

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
                            disabled={selectedDays.length === 0}
                            onClick={() => applyGroup(group)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                                        {draft.hours[day].length} h
                                    </span>
                                </button>
                            );
                        })}

                        {allHours.map((hour) => (
                            <HourRow
                                key={hour}
                                hour={hour}
                                draft={draft}
                                selectedDays={selectedDays}
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
                    gruppo di ore oppure tocca le singole ore: si possono
                    cambiare solo le ore dei giorni selezionati.
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
                                    value={String(
                                        draft.rules[rule.name] ?? NO_LIMIT,
                                    )}
                                    onValueChange={(value) =>
                                        update({
                                            rules: {
                                                ...draft.rules,
                                                [rule.name]:
                                                    value === NO_LIMIT
                                                        ? null
                                                        : Number(value),
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
                                                key={option ?? NO_LIMIT}
                                                value={String(
                                                    option ?? NO_LIMIT,
                                                )}
                                            >
                                                {option === null
                                                    ? 'Nessun limite'
                                                    : rule.format(option)}
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
                        <span className="font-normal text-muted-foreground">
                            {' '}
                            · almeno una
                        </span>
                    </legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {SESSION_MINUTES.map((minutes) => (
                            <ConsentCheckbox
                                key={minutes}
                                name={`session_minutes_${minutes}`}
                                checked={draft.sessionMinutes.includes(minutes)}
                                onCheckedChange={() => toggleDuration(minutes)}
                            >
                                {formatDuration(minutes)}
                            </ConsentCheckbox>
                        ))}
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

/** One hour of the week; only the hours of the selected days can be changed. */
function HourRow({
    hour,
    draft,
    selectedDays,
    onToggle,
}: {
    hour: number;
    draft: TrainerDraft;
    selectedDays: number[];
    onToggle: (day: number, hour: number) => void;
}) {
    return (
        <>
            <span className="flex items-center justify-end pr-1.5 text-xs text-muted-foreground tabular-nums">
                {hourLabel(hour)}
            </span>
            {dayLabels.map((label, day) => {
                const on = draft.hours[day].includes(hour);
                const locked = !selectedDays.includes(day);

                return (
                    <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${label} ${hourLabel(hour)}, ${on ? 'disponibile' : 'non disponibile'}`}
                        disabled={locked}
                        onClick={() => onToggle(day, hour)}
                        className={cn(
                            'h-7.5 rounded-md disabled:cursor-not-allowed',
                            on
                                ? 'bg-primary'
                                : 'border border-dashed border-input bg-background',
                            locked && 'opacity-40',
                        )}
                    />
                );
            })}
        </>
    );
}
