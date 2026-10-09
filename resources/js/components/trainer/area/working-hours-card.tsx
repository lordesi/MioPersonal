import { useId } from 'react';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDayRange } from '@/lib/format';
import type { WorkingDay } from '@/types';

export type Holiday = { id: number; from: string; to: string };

type WorkingHoursCardProps = {
    weekdays: WorkingDay[];
    onToggleDay: (day: number, enabled: boolean) => void;
    durations: string[];
    onDurationsChange: (durations: string[]) => void;
    holidays: Holiday[];
    onRemoveHoliday: (id: number) => void;
};

const durationOptions = [
    { value: '1', label: '1 ora' },
    { value: '2', label: '2 ore' },
];

/** Weekly hours, bookable durations and holidays of the trainer. */
export default function WorkingHoursCard({
    weekdays,
    onToggleDay,
    durations,
    onDurationsChange,
    holidays,
    onRemoveHoliday,
}: WorkingHoursCardProps) {
    const titleId = useId();
    const durationsId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-[1_1_380px] flex-col gap-3 rounded-xl border bg-card p-4 md:p-5"
        >
            <h2 id={titleId} className="text-lg font-semibold">
                Orari di lavoro
            </h2>

            {weekdays.map((day) => (
                <div
                    key={day.day}
                    className="flex items-center gap-3 border-b py-2"
                >
                    <Switch
                        checked={day.enabled}
                        onCheckedChange={(checked) =>
                            onToggleDay(day.day, checked)
                        }
                        aria-label={day.label}
                    />
                    <span className="w-24 text-sm font-semibold">
                        {day.label}
                    </span>
                    <span className="flex-1 text-sm text-muted-foreground tabular-nums">
                        {day.enabled && day.ranges.length > 0
                            ? day.ranges
                                  .map((range) => `${range.from}–${range.to}`)
                                  .join(' · ')
                            : 'Non disponibile'}
                    </span>
                    {/* TODO: open the editor of the day's time ranges. */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden px-2.5 text-[13px] font-normal md:inline-flex"
                    >
                        Modifica
                    </Button>
                </div>
            ))}

            <div className="flex flex-col gap-2 pt-2">
                <span id={durationsId} className="text-sm font-semibold">
                    Durate prenotabili
                </span>
                <ChoiceChips
                    multiple
                    aria-labelledby={durationsId}
                    options={durationOptions}
                    value={durations}
                    // At least one duration must stay bookable.
                    onChange={(value) =>
                        value.length > 0 && onDurationsChange(value)
                    }
                />
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <span className="text-sm font-semibold">
                    Ferie e giorni di chiusura
                </span>
                {holidays.map((holiday) => (
                    <div
                        key={holiday.id}
                        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm tabular-nums"
                    >
                        {formatDayRange(holiday.from, holiday.to)}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[13px] font-normal underline"
                            onClick={() => onRemoveHoliday(holiday.id)}
                        >
                            Rimuovi
                        </Button>
                    </div>
                ))}
                {/* TODO: open a date range picker. */}
                <Button
                    type="button"
                    variant="outline"
                    className="self-start border-dashed bg-transparent shadow-none"
                >
                    + Aggiungi un periodo
                </Button>
            </div>
        </section>
    );
}
