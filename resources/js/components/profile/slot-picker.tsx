import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import ProfileSection from '@/components/profile/profile-section';
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
    /** The chosen service, in the black pill: "Seduta singola · 1 ora". */
    serviceName: string;
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

/** The black pills next to the title. */
const pill =
    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] leading-[18px] font-semibold whitespace-nowrap tabular-nums';

function slotCountLabel(count: number): string {
    if (count === 0) {
        return 'Nessuno slot libero';
    }

    return count === 1 ? '1 slot libero' : `${count} slot liberi`;
}

/** Under the day number: "3 liberi", "pieno" or "chiuso". */
function dayInfo(day: AvailabilityDay, count: number): string {
    if (count > 0) {
        return `${count} liberi`;
    }

    return day.closed ? 'chiuso' : 'pieno';
}

/** "Scegli uno slot": duration, week, day and free start times. */
export default function SlotPicker({
    serviceName,
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
        <ProfileSection
            id="prenota"
            titleId="slot-picker-title"
            title="Scegli uno slot"
            aside={
                durations.length > 1 ? (
                    // More durations: the client chooses one here.
                    <div
                        role="radiogroup"
                        aria-label="Durata della seduta"
                        className="flex max-w-full flex-wrap gap-1.5"
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
                                        pill,
                                        checked
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border bg-background text-foreground hover:border-primary',
                                    )}
                                >
                                    {checked && (
                                        <Clock
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                    )}
                                    {formatDuration(duration)}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <span
                        className={cn(
                            pill,
                            'bg-primary text-primary-foreground',
                        )}
                    >
                        <Clock aria-hidden="true" className="size-3.5" />
                        {serviceName} · {formatDuration(minutes)}
                    </span>
                )
            }
        >
            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Settimana precedente"
                    disabled={weekIndex === 0}
                    onClick={() => onWeekChange(weekIndex - 1)}
                    className="size-10 rounded-full"
                >
                    <ChevronLeft className="size-4.5" />
                </Button>
                <span
                    aria-live="polite"
                    className="text-base leading-[22px] font-bold tabular-nums"
                >
                    {formatDayRange(week[0].date, week[week.length - 1].date)}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Settimana successiva"
                    disabled={weekIndex === weekCount - 1}
                    onClick={() => onWeekChange(weekIndex + 1)}
                    className="size-10 rounded-full"
                >
                    <ChevronRight className="size-4.5" />
                </Button>
            </div>

            <div
                role="radiogroup"
                aria-label="Giorno"
                className="grid grid-cols-7 gap-1 md:gap-2"
            >
                {week.map((day) => {
                    const count = freeStarts(day, minutes).length;
                    const selected = day.date === selectedDate;
                    const info = dayInfo(day, count);

                    return (
                        <button
                            key={day.date}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${formatDayLong(day.date).toLowerCase()}, ${info}`}
                            disabled={count === 0}
                            onClick={() => onDateChange(day.date)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 rounded-2xl border px-0.5 py-2.5 md:px-1',
                                selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : count > 0
                                      ? 'bg-background text-foreground hover:border-primary'
                                      : 'cursor-not-allowed border-muted bg-muted text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'text-xs font-semibold',
                                    selected
                                        ? 'text-primary-foreground/60'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {formatWeekdayShort(day.date)}
                            </span>
                            <span className="text-[22px] leading-6.5 font-bold tracking-[-0.02em] tabular-nums">
                                {formatDayNumber(day.date)}
                            </span>
                            <span
                                className={cn(
                                    'text-[11px] leading-3.5 font-medium whitespace-nowrap tabular-nums',
                                    selected
                                        ? 'text-primary-foreground/80'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {info}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selectedDay && (
                <div className="flex flex-col gap-3.5 border-t pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-base leading-[22px] font-bold">
                            {formatDayLong(selectedDay.date)}
                        </span>
                        <span className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
                            {slotCountLabel(starts.length)}
                        </span>
                    </div>
                    {starts.length > 0 ? (
                        <div
                            role="radiogroup"
                            aria-label="Orari liberi"
                            className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2 tabular-nums"
                        >
                            {starts.map((start) => {
                                const checked = start === selectedStart;

                                return (
                                    <button
                                        key={start}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        onClick={() =>
                                            onStartChange(
                                                checked ? null : start,
                                            )
                                        }
                                        className={cn(
                                            'h-11 rounded-xl border px-1 text-sm font-semibold whitespace-nowrap',
                                            checked
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'bg-background text-foreground hover:border-primary',
                                        )}
                                    >
                                        {formatTimeRange(start, minutes / 60)}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-ring/60 p-4.5 text-sm text-muted-foreground">
                            Nessun orario libero in questo giorno. Prova un
                            altro giorno o la settimana successiva.
                        </p>
                    )}
                </div>
            )}
        </ProfileSection>
    );
}
