import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import type { SessionRowContext } from '@/components/trainer/calendar/session-row';
import { SessionRow } from '@/components/trainer/calendar/session-row';
import { hourRange } from '@/components/trainer/calendar/session-status';
import { VIEWS } from '@/components/trainer/calendar/types';
import {
    addDays,
    hourLabel,
    mondayOf,
    monthCells,
    monthName,
    sessionsLabel,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatDayRange,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

const focusRing =
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]';

/** Giorno, Settimana, Mese: the pill on #121315 with the chosen one in turquoise. */
export function ViewTabs({
    view,
    onChange,
    className,
}: {
    view: CalendarView;
    onChange: (view: CalendarView) => void;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label="Vista del calendario"
            className={cn('flex rounded-full bg-[#121315] p-1', className)}
        >
            {VIEWS.map((item) => {
                const on = item.value === view;

                return (
                    <button
                        key={item.value}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(item.value)}
                        className={cn(
                            'h-10 flex-1 cursor-pointer rounded-full border-0 px-3.5 text-[15px] font-semibold',
                            focusRing,
                            on
                                ? 'bg-[#42D7D9] text-black'
                                : 'bg-transparent text-foreground',
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

function Arrow({
    direction,
    label,
    disabled,
    onClick,
}: {
    direction: 'prev' | 'next';
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-foreground hover:bg-white/5 disabled:cursor-default disabled:opacity-40',
                focusRing,
            )}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path
                    d={
                        direction === 'prev'
                            ? 'm15 18-6-6 6-6'
                            : 'm9 18 6-6-6-6'
                    }
                />
            </svg>
        </button>
    );
}

/** The period shown with the two arrows on the right. */
export function PeriodBar({
    view,
    title,
    canGoBack,
    canGoForward,
    onBack,
    onForward,
}: {
    view: CalendarView;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onBack: () => void;
    onForward: () => void;
}) {
    const [before, after] = {
        day: ['Giorno precedente', 'Giorno successivo'],
        week: ['Settimana precedente', 'Settimana successiva'],
        month: ['Mese precedente', 'Mese successivo'],
    }[view];

    return (
        <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-xl font-bold tracking-[-0.01em]">
                {title}
            </h2>
            <div className="flex gap-1">
                <Arrow
                    direction="prev"
                    label={before}
                    disabled={!canGoBack}
                    onClick={onBack}
                />
                <Arrow
                    direction="next"
                    label={after}
                    disabled={!canGoForward}
                    onClick={onForward}
                />
            </div>
        </div>
    );
}

/** The 7 days of the week of the phone ("Giorno"): a dot on days with sessions. */
export function DayStrip({
    week,
    items,
    selectedDay,
    today,
    onPick,
}: {
    week: string[];
    items: CalendarItem[];
    selectedDay: string;
    today: string;
    onPick: (date: string) => void;
}) {
    return (
        <div className="grid grid-cols-7 gap-1">
            {week.map((date) => {
                const on = date === selectedDay;
                const count = items.filter((item) => item.date === date).length;

                return (
                    <button
                        key={date}
                        type="button"
                        onClick={() => onPick(date)}
                        aria-label={`${formatDayLong(date)}${date === today ? ', oggi' : ''}`}
                        aria-pressed={on}
                        className={cn(
                            'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-0 bg-transparent p-0',
                            focusRing,
                        )}
                    >
                        <span
                            className={cn(
                                'text-[13px] font-semibold',
                                on
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {formatWeekdayShort(date)}
                        </span>
                        <span
                            className={cn(
                                'flex h-12 w-11 items-center justify-center rounded-xl text-xl font-semibold tabular-nums',
                                on
                                    ? 'bg-[#42D7D9] text-black'
                                    : date === today
                                      ? 'text-[#42D7D9]'
                                      : date < today
                                        ? 'text-muted-foreground'
                                        : 'text-foreground',
                            )}
                        >
                            {formatDayNumber(date)}
                        </span>
                        <span
                            aria-hidden="true"
                            className={cn(
                                'size-1.25 rounded-full',
                                count > 0 ? 'bg-[#42D7D9]' : 'bg-transparent',
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

/** The month as small cells with a dot: "Mese" on phones, "Giorno" on desktop. */
export function SmallMonth({
    month,
    counts,
    selectedDay,
    today,
    minDate,
    maxDate,
    onPick,
}: {
    /** "YYYY-MM". */
    month: string;
    counts: Record<string, number>;
    selectedDay: string;
    today: string;
    minDate: string;
    maxDate: string;
    onPick: (date: string) => void;
}) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);

    return (
        <div className="flex flex-col gap-2.5">
            <div
                aria-hidden="true"
                className="grid grid-cols-7 text-center text-xs font-semibold tracking-[0.02em] text-muted-foreground"
            >
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((letter, index) => (
                    <span key={index}>{letter}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const on = date === selectedDay;
                    const count = counts[date] ?? 0;

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-label={`${formatDayLong(date)}${count > 0 ? `, ${sessionsLabel(count).toLowerCase()}` : ''}`}
                            aria-pressed={on}
                            disabled={date < minDate || date > maxDate}
                            onClick={() => onPick(date)}
                            className={cn(
                                'flex h-11 w-full cursor-pointer flex-col items-center justify-center gap-0.75 rounded-xl border-0 p-0 text-base font-semibold tabular-nums disabled:cursor-default disabled:opacity-40',
                                focusRing,
                                on
                                    ? 'bg-[#42D7D9] text-black'
                                    : cn(
                                          'bg-transparent',
                                          date < today
                                              ? 'text-muted-foreground'
                                              : date === today
                                                ? 'text-[#42D7D9]'
                                                : 'text-foreground',
                                      ),
                            )}
                        >
                            <span>{formatDayNumber(date)}</span>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-1.25 rounded-full',
                                    count === 0
                                        ? 'bg-transparent'
                                        : on
                                          ? 'bg-black'
                                          : 'bg-[#42D7D9]',
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** The month of desktop: big cells with the first two sessions of each day. */
export function BigMonth({
    month,
    items,
    selectedDay,
    today,
    onPick,
    kindOf,
}: {
    month: string;
    items: CalendarItem[];
    selectedDay: string;
    today: string;
    onPick: (date: string) => void;
    kindOf: SessionRowContext['kindOf'];
}) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);

    return (
        <div className="flex flex-col gap-2">
            <div
                aria-hidden="true"
                className="grid grid-cols-7 gap-1.5 px-1 text-xs font-semibold tracking-[0.02em] text-muted-foreground"
            >
                {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(
                    (day) => (
                        <span key={day}>{day}</span>
                    ),
                )}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const on = date === selectedDay;
                    const list = items
                        .filter((item) => item.date === date)
                        .sort((a, b) => a.from - b.from);

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-label={`${formatDayLong(date)}${list.length > 0 ? `, ${sessionsLabel(list.length).toLowerCase()}` : ''}`}
                            aria-pressed={on}
                            onClick={() => onPick(date)}
                            className={cn(
                                'flex min-h-28 min-w-0 cursor-pointer flex-col gap-1 rounded-2xl border-0 p-2 text-left text-foreground',
                                focusRing,
                                on
                                    ? 'bg-[rgba(66,215,217,0.08)] shadow-[inset_0_0_0_1.5px_#42D7D9]'
                                    : 'bg-[#0B0C0D]',
                            )}
                        >
                            <span
                                className={cn(
                                    'text-sm font-bold',
                                    date === today
                                        ? 'text-[#42D7D9]'
                                        : date < today &&
                                              'text-muted-foreground',
                                )}
                            >
                                {formatDayNumber(date)}
                            </span>
                            {list.slice(0, 2).map((item) => {
                                const kind = kindOf(item);

                                return (
                                    <span
                                        key={item.key}
                                        className={cn(
                                            'truncate rounded-lg px-2 py-0.75 text-xs font-semibold whitespace-nowrap',
                                            kind === 'done' || kind === 'gone'
                                                ? 'bg-[#121315] text-muted-foreground'
                                                : kind === 'wait'
                                                  ? 'bg-[rgba(185,166,255,0.14)] text-[#B9A6FF]'
                                                  : 'bg-[#1C1E21] text-foreground',
                                        )}
                                    >
                                        {hourLabel(item.from)}{' '}
                                        {item.title.split(' ')[0]}
                                    </span>
                                );
                            })}
                            {list.length > 2 && (
                                <span className="pl-1 text-xs font-semibold text-muted-foreground">
                                    +{list.length - 2}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * The day as rows of one hour: a free hour is a dashed line that adds a
 * session at that time; a taken one shows its sessions.
 */
export function HourRows({
    date,
    today,
    items,
    selectedId,
    onToggle,
    onAddAt,
    context,
}: {
    date: string;
    /** "YYYY-MM-DD": no new sessions on the days before. */
    today: string;
    /** The sessions of the day, in order. */
    items: CalendarItem[];
    selectedId: number | null;
    onToggle: (id: number) => void;
    /** Null without "Aggiungi seduta" (no profile yet). */
    onAddAt: ((date: string, time: string, cell: HTMLElement) => void) | null;
    context: SessionRowContext;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {hourRange(items).map((hour) => {
                const sessions = items.filter(
                    (item) => Math.floor(item.from) === hour,
                );
                const label = hourLabel(hour);

                return (
                    <div
                        key={hour}
                        className="flex min-h-13 items-stretch gap-3"
                    >
                        <span className="w-12 shrink-0 pt-3.5 text-[13px] font-semibold text-muted-foreground tabular-nums">
                            {label}
                        </span>
                        {sessions.length === 0 ? (
                            <button
                                type="button"
                                aria-label={`Aggiungi una seduta alle ${label}`}
                                disabled={onAddAt === null || date < today}
                                onClick={(event) =>
                                    onAddAt?.(date, label, event.currentTarget)
                                }
                                className={cn(
                                    'flex-1 cursor-pointer border-0 border-t border-dashed border-t-[#26282C] bg-transparent disabled:cursor-default',
                                    focusRing,
                                )}
                            />
                        ) : (
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                {sessions.map((item) => (
                                    <SessionRow
                                        key={item.key}
                                        item={item}
                                        open={item.id === selectedId}
                                        onToggle={() => onToggle(item.id)}
                                        context={context}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** A list of sessions that open in place (the week of phones, the month). */
export function SessionList({
    items,
    selectedId,
    onToggle,
    context,
}: {
    items: CalendarItem[];
    selectedId: number | null;
    onToggle: (id: number) => void;
    context: SessionRowContext;
}) {
    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => (
                <SessionRow
                    key={item.key}
                    item={item}
                    open={item.id === selectedId}
                    onToggle={() => onToggle(item.id)}
                    context={context}
                />
            ))}
        </div>
    );
}

/** The title and the arrows of the period shown: a day, its week or its month. */
export function periodOf(
    view: CalendarView,
    selectedDay: string,
    focus: string,
    minDate: string,
    maxDate: string,
): {
    title: string;
    previous: string;
    next: string;
    canGoBack: boolean;
    canGoForward: boolean;
} {
    if (view === 'month') {
        const month = focus.slice(0, 7);

        return {
            title: monthName(month).replace(/^./u, (letter) =>
                letter.toUpperCase(),
            ),
            previous: `${shiftMonth(month, -1)}-01`,
            next: `${shiftMonth(month, 1)}-01`,
            canGoBack: `${month}-01` > minDate,
            canGoForward: month < maxDate.slice(0, 7),
        };
    }

    if (view === 'week') {
        const week = weekDates(mondayOf(selectedDay));

        return {
            title: formatDayRange(week[0], week[6]),
            previous: addDays(week[0], -7),
            next: addDays(week[0], 7),
            canGoBack: week[0] > minDate,
            canGoForward: week[6] < maxDate,
        };
    }

    return {
        title: formatDayLong(selectedDay),
        previous: addDays(selectedDay, -1),
        next: addDays(selectedDay, 1),
        canGoBack: selectedDay > minDate,
        canGoForward: selectedDay < maxDate,
    };
}
