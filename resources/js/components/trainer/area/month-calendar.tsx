import type { CalendarItem } from '@/lib/calendar';
import {
    hourLabel,
    monthCells,
    sessionsLabel,
    shortName,
    toneStyle,
} from '@/lib/calendar';
import { formatDayLong, formatDayNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

type MonthCalendarProps = {
    /** "YYYY-MM" */
    month: string;
    items: CalendarItem[];
    today: string;
    selectedDay: string;
    /** A day of the month opens the "Giorno" view. */
    onOpenDay: (date: string) => void;
    /** Right click on a day from today on: "Aggiungi seduta" that day. */
    onAddOnDay?: (date: string, cell: HTMLElement) => void;
};

/**
 * The month (design "Mese A · Sedute nel giorno"): tall days with a thin
 * line on top, the number in a rounded square (turquoise today), then the
 * sessions as chips tinted by kind: the first name on phones (2 chips),
 * the time and the name from tablets up (3 chips); the others become "+2".
 * A day opens the "Giorno" view; the right click adds a session that day.
 */
export default function MonthCalendar({
    month,
    items,
    today,
    selectedDay,
    onOpenDay,
    onAddOnDay,
}: MonthCalendarProps) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);

    return (
        <div>
            <div
                aria-hidden="true"
                className="grid grid-cols-7 text-center text-xs leading-4 font-semibold text-muted-foreground"
            >
                {weekdays.map((day) => (
                    <span key={day} className="py-1.5">
                        {day}
                    </span>
                ))}
            </div>

            <div className="mt-1.5 grid auto-rows-[88px] grid-cols-7 sm:auto-rows-[112px]">
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const sessions = items
                        .filter((item) => item.date === date)
                        .sort((a, b) => a.from - b.from);
                    const weekday = index % 7;
                    const isToday = date === today;
                    const quiet = date < today || weekday >= 5;
                    const below = cells[index + 7] ?? null;

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-label={`${formatDayLong(date)}${isToday ? ', oggi' : ''}, ${sessionsLabel(sessions.length).toLowerCase()}`}
                            aria-current={isToday ? 'date' : undefined}
                            onClick={() => onOpenDay(date)}
                            onContextMenu={(event) => {
                                // Past days keep the menu of the browser.
                                if (onAddOnDay && date >= today) {
                                    event.preventDefault();
                                    onAddOnDay(date, event.currentTarget);
                                }
                            }}
                            title={
                                onAddOnDay && date >= today
                                    ? 'Clic: apri il giorno · clic destro: aggiungi seduta'
                                    : undefined
                            }
                            className={cn(
                                'flex min-w-0 flex-col items-stretch gap-0.75 overflow-hidden border-t border-border px-0.5 pt-1 text-left transition-colors outline-none hover:bg-white/[0.04] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-1 sm:px-1.5 sm:pt-1.5',
                                // The last week of each column closes with a line.
                                below === null && 'border-b',
                                date === selectedDay &&
                                    !isToday &&
                                    'bg-white/[0.04]',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center self-center rounded-lg text-[15px] font-semibold tabular-nums sm:self-start',
                                    isToday
                                        ? 'bg-brand text-[#0a0a0a]'
                                        : quiet
                                          ? 'text-muted-foreground'
                                          : 'text-foreground',
                                )}
                            >
                                {formatDayNumber(date)}
                            </span>

                            {sessions.map((item, position) => {
                                const tone = toneStyle(item, 30);

                                return (
                                    <span
                                        key={item.key}
                                        aria-hidden="true"
                                        className={cn(
                                            'h-4 shrink-0 items-center gap-1 overflow-hidden rounded-[5px] px-1 text-[11px] leading-4 font-semibold whitespace-nowrap text-foreground sm:h-5 sm:px-1.5',
                                            position < 2
                                                ? 'flex'
                                                : position < 3
                                                  ? 'hidden sm:flex'
                                                  : 'hidden',
                                        )}
                                        style={{
                                            background: tone.background,
                                            border: tone.border,
                                        }}
                                    >
                                        <span className="hidden tabular-nums lg:inline">
                                            {hourLabel(item.from)}
                                        </span>
                                        <span className="truncate">
                                            <span className="sm:hidden">
                                                {item.title.split(' ')[0]}
                                            </span>
                                            <span className="hidden sm:inline">
                                                {shortName(item.title)}
                                            </span>
                                        </span>
                                    </span>
                                );
                            })}

                            {sessions.length > 2 && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'pl-1 text-[11px] leading-3.5 font-semibold text-muted-foreground',
                                        sessions.length === 3 && 'sm:hidden',
                                    )}
                                >
                                    <span className="sm:hidden">
                                        +{sessions.length - 2}
                                    </span>
                                    <span className="hidden sm:inline">
                                        +{sessions.length - 3}
                                    </span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
