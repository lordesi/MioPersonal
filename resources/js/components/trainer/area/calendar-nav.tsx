import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarItem } from '@/lib/calendar';
import { sessionsLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

export type CalendarView = 'day' | 'week' | 'month';

const views: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
    { value: 'month', label: 'Mese' },
];

/** What the arrows move: "Giorno precedente", "Settimana successiva"… */
const arrowLabels: Record<CalendarView, [string, string]> = {
    day: ['Giorno precedente', 'Giorno successivo'],
    week: ['Settimana precedente', 'Settimana successiva'],
    month: ['Mese precedente', 'Mese successivo'],
};

type CalendarNavProps = {
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
    /** "19 – 25 ottobre 2026", "Ottobre 2026"… */
    label: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onPrevious: () => void;
    onNext: () => void;
    /** The 7 days of the strip; empty in the month view. */
    days: string[];
    items: CalendarItem[];
    today: string;
    selectedDay: string;
    onSelectDay: (date: string) => void;
};

const arrowClassName =
    'flex size-10 items-center justify-center rounded-[10px] border border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-border disabled:pointer-events-none disabled:opacity-35';

/**
 * The black panel on top of "Calendario": arrows, period, legend,
 * the views and, for a day or a week, the strip of the 7 days.
 */
export default function CalendarNav({
    view,
    onViewChange,
    label,
    canGoBack,
    canGoForward,
    onPrevious,
    onNext,
    days,
    items,
    today,
    selectedDay,
    onSelectDay,
}: CalendarNavProps) {
    return (
        <section
            aria-label="Navigazione calendario"
            className="flex flex-col gap-4 rounded-3xl bg-sidebar p-3.5 text-sidebar-foreground sm:p-4.5"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        aria-label={arrowLabels[view][0]}
                        disabled={!canGoBack}
                        onClick={onPrevious}
                        className={arrowClassName}
                    >
                        <ChevronLeft aria-hidden="true" className="size-4.5" />
                    </button>
                    <button
                        type="button"
                        aria-label={arrowLabels[view][1]}
                        disabled={!canGoForward}
                        onClick={onNext}
                        className={arrowClassName}
                    >
                        <ChevronRight aria-hidden="true" className="size-4.5" />
                    </button>
                    <h2
                        aria-live="polite"
                        className="mx-1.5 text-lg leading-7 font-bold tracking-[-0.02em] tabular-nums sm:text-xl"
                    >
                        {label}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <span className="hidden items-center gap-3.5 text-[13px] leading-4.5 text-sidebar-muted-foreground md:flex">
                        <span className="flex items-center gap-1.5">
                            <span
                                aria-hidden="true"
                                className="size-3 rounded-sm bg-sidebar-primary"
                            />
                            Confermata
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                aria-hidden="true"
                                className="size-3 rounded-sm border-[1.5px] border-dashed border-sidebar-primary"
                            />
                            Da confermare
                        </span>
                    </span>
                    <div
                        role="group"
                        aria-label="Vista"
                        className="flex gap-0.5 rounded-xl bg-sidebar-accent p-0.75"
                    >
                        {views.map((option) => {
                            const on = option.value === view;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => onViewChange(option.value)}
                                    className={cn(
                                        'h-9 rounded-[9px] px-3.5 text-sm leading-5',
                                        on
                                            ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                                            : 'font-medium text-sidebar-muted-foreground hover:text-sidebar-foreground',
                                    )}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {days.length > 0 && (
                <div
                    role="group"
                    aria-label="Giorni della settimana"
                    className="grid grid-cols-7 gap-1 sm:gap-2"
                >
                    {days.map((date) => (
                        <StripDay
                            key={date}
                            date={date}
                            count={
                                items.filter((item) => item.date === date)
                                    .length
                            }
                            isToday={date === today}
                            selected={date === selectedDay}
                            onSelect={() => onSelectDay(date)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function StripDay({
    date,
    count,
    isToday,
    selected,
    onSelect,
}: {
    date: string;
    count: number;
    isToday: boolean;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            aria-label={`${formatDayLong(date)}${isToday ? ', oggi' : ''}, ${sessionsLabel(count).toLowerCase()}`}
            onClick={onSelect}
            className={cn(
                'flex min-w-0 flex-col gap-1 rounded-2xl border p-2 text-left sm:p-3',
                selected &&
                    'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground',
                !selected &&
                    'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-border',
                !selected &&
                    (isToday
                        ? 'border-muted-foreground'
                        : 'border-sidebar-accent'),
            )}
        >
            <span className="flex items-center justify-between gap-1 text-xs leading-4 font-semibold uppercase">
                <span>{formatWeekdayShort(date)}</span>
                <span
                    className={cn(
                        'hidden rounded-full px-1.5 text-[10px] leading-3.5 font-bold normal-case lg:inline',
                        !isToday && 'invisible',
                        selected
                            ? 'bg-sidebar text-sidebar-foreground'
                            : 'bg-sidebar-primary text-sidebar-primary-foreground',
                    )}
                >
                    Oggi
                </span>
            </span>
            <span className="text-lg leading-6 font-bold tracking-[-0.02em] tabular-nums sm:text-[26px] sm:leading-7.5">
                {formatDayNumber(date)}
            </span>
            <span className="flex min-h-4 items-center gap-1.5">
                <span aria-hidden="true" className="flex gap-0.75">
                    {Array.from({ length: Math.min(count, 4) }, (_, index) => (
                        <span
                            key={index}
                            className={cn(
                                'size-1.5 rounded-full',
                                selected ? 'bg-sidebar' : 'bg-sidebar-primary',
                            )}
                        />
                    ))}
                </span>
                <span
                    className={cn(
                        'hidden text-xs leading-4 font-medium lg:inline',
                        selected && 'text-muted-foreground',
                        !selected &&
                            (count > 0
                                ? 'text-sidebar-foreground/85'
                                : 'text-muted-foreground'),
                    )}
                >
                    {count > 0 ? sessionsLabel(count) : 'Libero'}
                </span>
            </span>
        </button>
    );
}
