import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthCells, romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** Today in Rome, "YYYY-MM-DD": the days of the trainers are Rome days. */
export const romeToday = () => romeParts(new Date()).date;

/** How many months from the month of `from` to the month of `to` ("YYYY-MM-DD"). */
export function monthsBetween(from: string, to: string): number {
    const [fromYear, fromMonth] = from.split('-').map(Number);
    const [toYear, toMonth] = to.split('-').map(Number);

    return toYear * 12 + toMonth - (fromYear * 12 + fromMonth);
}

/** "Novembre 2026". */
export function monthTitle(year: number, month: number): string {
    const title = new Intl.DateTimeFormat('it-IT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 15)));

    return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * How a day looks. The calendar marks today (grey outline) and the chosen
 * day (turquoise outline) by itself.
 */
export type CalendarDay = {
    /** Not clickable: past, closed, out of reach. */
    disabled: boolean;
    /** A past day: faded grey, nothing else. */
    past?: boolean;
    /** A day the trainer does not work: a grey outline and a diagonal line. */
    unavailable?: boolean;
    /** Clickable but with nothing free (a full day): light grey. */
    dim?: boolean;
    /** The turquoise dot under the number: free times on this day. */
    dot?: boolean;
    /** Added to the name read by screen readers: ", orari liberi". */
    note?: string;
};

type Arrow = { disabled: boolean; onClick: () => void };

type MonthCalendarProps = {
    year: number;
    month: number;
    today: string;
    selected: string | null;
    onSelect: (date: string) => void;
    day: (date: string) => CalendarDay;
    /** The arrows next to the title; left out = an empty space. */
    previous?: Arrow;
    next?: Arrow;
    /** A span of days ("Intervallo personalizzato"): both ends outlined, the days between filled. */
    range?: { from: string; to: string | null };
    /** The chosen day filled turquoise (profile "Giorno e ora"), not outlined. */
    fill?: boolean;
    className?: string;
};

/**
 * One month of the dark design (designs "DataCalendario", "Giorno e ora"):
 * the title between the arrows, the weekdays, a 44px button per day.
 */
export default function MonthCalendar({
    year,
    month,
    today,
    selected,
    onSelect,
    day,
    previous,
    next,
    range,
    fill = false,
    className,
}: MonthCalendarProps) {
    const title = monthTitle(year, month);

    const arrow = (direction: -1 | 1, value?: Arrow) =>
        value ? (
            <button
                type="button"
                aria-label={
                    direction === -1 ? 'Mese precedente' : 'Mese successivo'
                }
                disabled={value.disabled}
                onClick={value.onClick}
                className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-30 disabled:hover:bg-transparent"
            >
                {direction === -1 ? (
                    <ChevronLeft aria-hidden="true" className="size-5" />
                ) : (
                    <ChevronRight aria-hidden="true" className="size-5" />
                )}
            </button>
        ) : (
            <span className="size-11" />
        );

    return (
        <div className={className}>
            <div className="flex h-11 items-center justify-between">
                {arrow(-1, previous)}
                <h3 className="text-[17px] font-semibold">{title}</h3>
                {arrow(1, next)}
            </div>
            <div
                aria-hidden="true"
                className="mt-1 mb-1 grid grid-cols-7 text-center text-xs leading-5 font-semibold text-muted-foreground"
            >
                {WEEKDAYS.map((weekday, index) => (
                    <span key={index}>{weekday}</span>
                ))}
            </div>
            <div
                role="group"
                aria-label={title}
                className="grid grid-cols-7 gap-y-1"
            >
                {monthCells(year, month).map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const info = day(date);
                    const isToday = date === today;
                    const pressed =
                        date === selected ||
                        date === range?.from ||
                        date === range?.to;
                    const between =
                        range?.to != null &&
                        date > range.from &&
                        date < range.to;

                    return (
                        <button
                            key={date}
                            type="button"
                            disabled={info.disabled}
                            aria-pressed={pressed}
                            aria-label={`${formatDayLong(date)}${isToday ? ', oggi' : ''}${info.note ?? ''}`}
                            onClick={() => onSelect(date)}
                            className={cn(
                                'relative flex size-11 items-center justify-center justify-self-center rounded-xl text-base tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 enabled:hover:bg-accent',
                                info.disabled &&
                                    (fill
                                        ? 'text-muted-foreground'
                                        : 'text-[#5c5c5c]'),
                                fill &&
                                    !info.disabled &&
                                    !info.dim &&
                                    'font-medium',
                                info.past && 'text-[#45484d]',
                                info.unavailable &&
                                    'overflow-hidden shadow-[inset_0_0_0_1px_var(--field)]',
                                info.dim && 'text-muted-foreground',
                                isToday &&
                                    !pressed &&
                                    'shadow-[inset_0_0_0_1px_var(--field)]',
                                pressed &&
                                    (fill
                                        ? 'rounded-[10px] bg-brand font-bold text-black enabled:hover:bg-brand'
                                        : 'font-bold shadow-[inset_0_0_0_1.5px_var(--brand)]'),
                                between && 'bg-brand-soft text-brand',
                            )}
                        >
                            {info.unavailable && (
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.6px),var(--field)_calc(50%-0.6px),var(--field)_calc(50%+0.6px),transparent_calc(50%+0.6px))]"
                                />
                            )}
                            {Number(date.slice(8))}
                            {info.dot && (
                                <span
                                    aria-hidden="true"
                                    className="absolute bottom-1.25 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
