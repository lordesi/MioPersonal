import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { freeStarts } from '@/lib/booking';
import {
    formatDayLong,
    formatDayNumber,
    formatDayRange,
    formatDuration,
    formatTimeRange,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AvailabilityDay } from '@/types';

type SlotPickerProps = {
    trainerFirstName: string;
    /** The 7 days of the week being shown. */
    week: AvailabilityDay[];
    weekIndex: number;
    weekCount: number;
    onWeekChange: (weekIndex: number) => void;
    /** The durations of the chosen service, in minutes (one for fixed services). */
    durations: number[];
    minutes: number;
    onMinutesChange: (minutes: number) => void;
    selectedDate: string | null;
    onDateChange: (date: string) => void;
    selectedStart: string | null;
    /** null = the time chosen before is tapped again: nothing chosen. */
    onStartChange: (start: string | null) => void;
};

function slotCountLabel(count: number, minutes: number): string {
    const duration = formatDuration(minutes);

    if (count === 0) {
        return `nessun orario libero da ${duration}`;
    }

    return count === 1
        ? `1 orario libero da ${duration}`
        : `${count} orari liberi da ${duration}`;
}

/** "Scegli giorno e orario": duration, week, day and free start times. */
export default function SlotPicker({
    trainerFirstName,
    week,
    weekIndex,
    weekCount,
    onWeekChange,
    durations,
    minutes,
    onMinutesChange,
    selectedDate,
    onDateChange,
    selectedStart,
    onStartChange,
}: SlotPickerProps) {
    const selectedDay = week.find((day) => day.date === selectedDate) ?? null;
    const starts = selectedDay ? freeStarts(selectedDay, minutes) : [];

    return (
        <section
            id="prenota"
            aria-labelledby="slot-picker-title"
            className="flex scroll-mt-6 flex-col gap-4"
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2
                        id="slot-picker-title"
                        className="text-xl font-semibold tracking-tight md:text-2xl"
                    >
                        Scegli giorno e orario
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        Orari aggiornati dal calendario di {trainerFirstName}.
                    </span>
                </div>
                <div
                    role="radiogroup"
                    aria-label="Durata della seduta"
                    className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.75"
                >
                    {durations.map((duration) => {
                        const checked = duration === minutes;

                        return (
                            <button
                                key={duration}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                onClick={() => onMinutesChange(duration)}
                                className={cn(
                                    'h-8.5 rounded-md px-3 text-sm font-medium whitespace-nowrap',
                                    checked
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {formatDuration(duration)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 md:p-5">
                <div className="flex items-center justify-between gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Settimana precedente"
                        disabled={weekIndex === 0}
                        onClick={() => onWeekChange(weekIndex - 1)}
                        className="size-11 rounded-full"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <span className="text-base font-semibold tabular-nums">
                        {formatDayRange(
                            week[0].date,
                            week[week.length - 1].date,
                        )}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Settimana successiva"
                        disabled={weekIndex === weekCount - 1}
                        onClick={() => onWeekChange(weekIndex + 1)}
                        className="size-11 rounded-full"
                    >
                        <ChevronRight className="size-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {week.map((day) => {
                        const count = freeStarts(day, minutes).length;
                        const selected = day.date === selectedDate;

                        return (
                            <button
                                key={day.date}
                                type="button"
                                aria-pressed={selected}
                                aria-label={`${formatDayLong(day.date).toLowerCase()}: ${
                                    count === 0
                                        ? 'nessun orario libero'
                                        : count === 1
                                          ? '1 orario libero'
                                          : `${count} orari liberi`
                                }`}
                                disabled={count === 0}
                                onClick={() => onDateChange(day.date)}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-2.5 md:px-1',
                                    selected
                                        ? 'border-2 border-primary bg-primary text-primary-foreground'
                                        : count > 0
                                          ? 'border bg-background text-foreground'
                                          : 'cursor-not-allowed border border-transparent bg-muted text-muted-foreground',
                                )}
                            >
                                <span className="text-xs font-medium">
                                    {formatWeekdayShort(day.date)}
                                </span>
                                <span className="text-xl font-bold tabular-nums">
                                    {formatDayNumber(day.date)}
                                </span>
                                <span className="text-[11px] leading-3.5 whitespace-nowrap tabular-nums opacity-75">
                                    {count > 0 ? `${count} liberi` : 'pieno'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {selectedDay && (
                    <div className="flex flex-col gap-3 border-t pt-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <span className="text-base font-semibold">
                                {formatDayLong(selectedDay.date)}
                            </span>
                            <span className="text-sm text-muted-foreground tabular-nums">
                                {slotCountLabel(starts.length, minutes)}
                            </span>
                        </div>
                        {starts.length > 0 ? (
                            <div
                                role="group"
                                aria-label="Orari liberi"
                                className="grid grid-cols-3 gap-2 tabular-nums md:grid-cols-4"
                            >
                                {starts.map((start) => (
                                    <button
                                        key={start}
                                        type="button"
                                        aria-pressed={start === selectedStart}
                                        onClick={() =>
                                            onStartChange(
                                                start === selectedStart
                                                    ? null
                                                    : start,
                                            )
                                        }
                                        className={cn(
                                            'h-11 rounded-md px-1 text-sm font-medium whitespace-nowrap md:px-2',
                                            start === selectedStart
                                                ? 'border-2 border-primary bg-primary text-primary-foreground'
                                                : 'border border-input bg-background text-foreground',
                                        )}
                                    >
                                        {formatTimeRange(start, minutes / 60)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                Nessun orario libero da{' '}
                                {formatDuration(minutes)} in questo giorno.
                                Prova un altro giorno o una durata più breve.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
