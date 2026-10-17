import { useState } from 'react';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import { hourLabel } from '@/lib/calendar';
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

            <p className="text-sm text-muted-foreground tabular-nums">
                <strong className="text-foreground">
                    {weeklyHours(hours)} ore a settimana.
                </strong>{' '}
                Tocca un giorno in alto per selezionarlo, poi aggiungi un gruppo
                di ore oppure tocca le singole ore: si possono cambiare solo le
                ore dei giorni selezionati.
            </p>
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
            <span className="flex items-center justify-end pr-1.5 text-xs text-muted-foreground tabular-nums">
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
