import { useState } from 'react';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import { hourLabel } from '@/lib/calendar';
import { formatHours } from '@/lib/format';
import { cn } from '@/lib/utils';

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

/** The three steps written above the grid, "a", "b" and "c". */
const steps = [
    { letter: 'a', text: 'Scegli i giorni in alto' },
    { letter: 'b', text: 'Aggiungi una fascia oraria' },
    { letter: 'c', text: 'Ritocca le singole ore con un tocco' },
];

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

type WeeklyHoursGridProps = {
    /** Start hours by day, 0 = Monday … 6 = Sunday. */
    hours: number[][];
    onChange: (hours: number[][]) => void;
};

/**
 * The weekly working hours, one button per hour: used by step 5 of
 * "Diventa trainer" and by "Disponibilità" in the trainer area.
 */
export default function WeeklyHoursGrid({
    hours,
    onChange,
}: WeeklyHoursGridProps) {
    const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
    const selectedNames = dayNames.filter((_, day) =>
        selectedDays.includes(day),
    );

    const setDay = (day: number, dayHours: number[]) =>
        onChange(
            hours.map((current, index) =>
                index === day ? [...dayHours].sort((a, b) => a - b) : current,
            ),
        );

    const toggleHour = (day: number, hour: number) =>
        setDay(
            day,
            hours[day].includes(hour)
                ? hours[day].filter((item) => item !== hour)
                : [...hours[day], hour],
        );

    /**
     * Applies a group to the selected days. The choice "add or remove" is made
     * once for all of them, so days with different hours end up the same.
     */
    const applyGroup = (group: (typeof groups)[number]) => {
        const removing =
            group.mode === 'toggle' &&
            selectedDays.every((day) =>
                group.hours.every((hour) => hours[day].includes(hour)),
            );

        onChange(
            hours.map((current, day) => {
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
        );
    };

    return (
        <div className="flex flex-col gap-4.5">
            <ol className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-[14px] bg-secondary px-4 py-3.5 text-[13px] leading-4.5">
                {steps.map((step) => (
                    <li key={step.letter} className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background"
                        >
                            {step.letter}
                        </span>
                        {step.text}
                    </li>
                ))}
            </ol>

            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[13px] leading-4.5 font-semibold">
                    {selectedNames.length > 0
                        ? `Ai giorni selezionati (${selectedNames.join(', ')}):`
                        : 'Seleziona almeno un giorno:'}
                </span>
                {groups.map((group) => (
                    <button
                        key={group.label}
                        type="button"
                        disabled={selectedDays.length === 0}
                        onClick={() => applyGroup(group)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px] leading-4.5 font-semibold hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
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
                    className="grid min-w-70 grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-x-1 gap-y-1 sm:gap-x-1.5 md:min-w-140 md:grid-cols-[52px_repeat(7,minmax(0,1fr))]"
                >
                    <span />
                    {dayNames.map((name, day) => {
                        const on = selectedDays.includes(day);

                        return (
                            <button
                                key={name}
                                type="button"
                                aria-pressed={on}
                                aria-label={`${dayLabels[day]}, ${formatHours(hours[day].length)}`}
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
                                    'mb-1 flex h-13 flex-col items-center justify-center gap-0.5 rounded-xl border',
                                    on
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'bg-card hover:bg-secondary',
                                )}
                            >
                                <span className="text-[13px] leading-4.5 font-bold">
                                    {name}
                                </span>
                                <span
                                    className={cn(
                                        'text-[11px] leading-3.5 font-medium tabular-nums',
                                        on
                                            ? 'text-sidebar-muted-foreground'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {hours[day].length} h
                                </span>
                            </button>
                        );
                    })}

                    {allHours.map((hour) => (
                        <HourRow
                            key={hour}
                            hour={hour}
                            hours={hours}
                            selectedDays={selectedDays}
                            onToggle={toggleHour}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t pt-3.5">
                <span className="text-[15px] leading-5.5 font-bold tabular-nums">
                    {formatHours(weeklyHours(hours))} a settimana
                </span>
                <span className="flex items-center gap-3.5 text-[13px] leading-4.5 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="h-2.5 w-3.5 rounded-sm bg-foreground"
                        />
                        Disponibile
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="h-2.5 w-3.5 rounded-sm border border-dashed border-ring"
                        />
                        Libero da aggiungere
                    </span>
                </span>
            </div>
        </div>
    );
}

/** One hour of the week; only the hours of the selected days can be changed. */
function HourRow({
    hour,
    hours,
    selectedDays,
    onToggle,
}: {
    hour: number;
    hours: number[][];
    selectedDays: number[];
    onToggle: (day: number, hour: number) => void;
}) {
    return (
        <>
            <span className="flex h-6.5 items-center justify-end pr-1.5 text-[11px] leading-3.5 font-medium text-ring tabular-nums">
                {hourLabel(hour)}
            </span>
            {dayLabels.map((label, day) => {
                const on = hours[day].includes(hour);
                const locked = !selectedDays.includes(day);

                return (
                    <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${label} ${hourLabel(hour)}–${hourLabel(hour + 1)}, ${on ? 'disponibile' : 'non disponibile'}${locked ? ', seleziona il giorno per modificarla' : ''}`}
                        disabled={locked}
                        onClick={() => onToggle(day, hour)}
                        className={cn(
                            'h-6.5 w-full rounded-[7px] border',
                            on && !locked && 'border-foreground bg-foreground',
                            on &&
                                locked &&
                                'border-transparent bg-foreground/75',
                            !on &&
                                !locked &&
                                'border-dashed border-ring bg-card hover:border-foreground',
                            !on && locked && 'border-dashed bg-secondary/60',
                        )}
                    />
                );
            })}
        </>
    );
}
