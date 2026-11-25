import { ChevronLeft, ChevronRight } from 'lucide-react';
import { iconButtonClassName } from '@/components/mp/area-bits';
import { roundSoftClassName } from '@/components/trainer/ui/styles';
import { addDays, sessionsLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerWeekDay } from '@/types';

type WeekStripProps = {
    week: TrainerWeekDay[];
    day: string;
    today: string;
    minDate: string;
    maxDate: string;
    onPick: (date: string) => void;
    /** Desktop: bigger days, the arrows on the sides. */
    size?: 'sm' | 'lg';
};

/**
 * The 7 days of the week with a dot on the days with sessions: today is
 * written in turquoise, the chosen day is filled. The arrows go to the
 * Monday of the week before or after.
 */
export default function WeekStrip({
    week,
    day,
    today,
    minDate,
    maxDate,
    onPick,
    size = 'sm',
}: WeekStripProps) {
    const monday = week[0]?.date ?? day;
    const prev = addDays(monday, -7);
    const next = addDays(monday, 7);
    const large = size === 'lg';

    const arrows = (direction: 'prev' | 'next') => {
        const target = direction === 'prev' ? prev : next;
        const disabled =
            direction === 'prev'
                ? addDays(monday, -1) < minDate
                : target > maxDate;

        return (
            <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(target)}
                aria-label={
                    direction === 'prev'
                        ? 'Settimana precedente'
                        : 'Settimana successiva'
                }
                title={
                    direction === 'prev'
                        ? 'Settimana precedente'
                        : 'Settimana successiva'
                }
                className={large ? roundSoftClassName : iconButtonClassName}
            >
                {direction === 'prev' ? (
                    <ChevronLeft aria-hidden="true" className="size-5" />
                ) : (
                    <ChevronRight aria-hidden="true" className="size-5" />
                )}
            </button>
        );
    };

    const days = (
        <div
            role="group"
            aria-label="Giorni della settimana"
            className="grid flex-1 grid-cols-7 gap-1"
        >
            {week.map((item) => {
                const selected = item.date === day;
                const isToday = item.date === today;
                const past = item.date < today;

                return (
                    <button
                        key={item.date}
                        type="button"
                        onClick={() => onPick(item.date)}
                        aria-pressed={selected}
                        aria-label={`${formatDayLong(item.date)}${isToday ? ', oggi' : ''}, ${item.count > 0 ? sessionsLabel(item.count) : 'nessuna seduta'}`}
                        className="flex flex-col items-center gap-1.5 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <span
                            className={cn(
                                large ? 'text-xs' : 'text-[13px]',
                                'font-semibold',
                                selected
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {formatWeekdayShort(item.date)}
                        </span>
                        <span
                            className={cn(
                                'flex items-center justify-center text-xl font-semibold tabular-nums',
                                large
                                    ? 'size-12 rounded-2xl'
                                    : 'h-12 w-11 rounded-xl',
                                selected
                                    ? 'bg-brand text-black'
                                    : isToday
                                      ? 'text-brand'
                                      : past
                                        ? 'text-muted-foreground'
                                        : 'text-foreground',
                            )}
                        >
                            {formatDayNumber(item.date)}
                        </span>
                        <span
                            aria-hidden="true"
                            className={cn(
                                'size-1.25 rounded-full',
                                item.count === 0
                                    ? 'bg-transparent'
                                    : past
                                      ? 'bg-input'
                                      : 'bg-brand',
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );

    if (large) {
        return (
            <div className="flex flex-1 items-center gap-2">
                {arrows('prev')}
                {days}
                {arrows('next')}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold first-letter:uppercase">
                    {monthLabel(week[3]?.date ?? day)}
                </h2>
                <div className="flex gap-1">
                    {arrows('prev')}
                    {arrows('next')}
                </div>
            </div>
            {days}
        </div>
    );
}

/** "2026-11-19" → "novembre 2026" */
export function monthLabel(date: string): string {
    return new Intl.DateTimeFormat('it-IT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
}
