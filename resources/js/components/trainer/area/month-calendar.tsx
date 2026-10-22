import type { CalendarItem } from '@/lib/calendar';
import {
    hourLabel,
    monthCells,
    sessionsLabel,
    shortName,
} from '@/lib/calendar';
import { formatDayLong, formatDayNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** Sessions written inside a day; the others become "+2 altre". */
const VISIBLE_PER_DAY = 3;

type MonthCalendarProps = {
    /** "YYYY-MM" */
    month: string;
    items: CalendarItem[];
    today: string;
    selectedDay: string;
    /** A day of the month opens the "Giorno" view. */
    onOpenDay: (date: string) => void;
};

/**
 * The month: each day lists its sessions (time and client; on phones only
 * a dot for each). A day opens the "Giorno" view.
 */
export default function MonthCalendar({
    month,
    items,
    today,
    selectedDay,
    onOpenDay,
}: MonthCalendarProps) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);

    return (
        <div>
            <div
                aria-hidden="true"
                className="grid grid-cols-7 bg-sidebar text-xs font-semibold text-sidebar-muted-foreground"
            >
                {weekdays.map((day) => (
                    <span key={day} className="px-2 py-3 sm:px-3.5">
                        <span className="sm:hidden">{day.charAt(0)}</span>
                        <span className="hidden sm:inline">{day}</span>
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {cells.map((date, index) => {
                    const sideClasses = cn(
                        'min-h-18 border-t border-border/60 p-1.5 sm:min-h-27 sm:p-2',
                        index % 7 !== 0 && 'border-l',
                    );

                    if (date === null) {
                        return (
                            <span
                                key={`blank-${index}`}
                                className={cn(sideClasses, 'bg-secondary/50')}
                            />
                        );
                    }

                    const sessions = items
                        .filter((item) => item.date === date)
                        .sort((a, b) => a.from - b.from);
                    const hidden = sessions.length - VISIBLE_PER_DAY;

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-label={`${formatDayLong(date)}, ${sessionsLabel(sessions.length).toLowerCase()}`}
                            aria-current={date === today ? 'date' : undefined}
                            onClick={() => onOpenDay(date)}
                            className={cn(
                                sideClasses,
                                'flex flex-col items-start gap-1 bg-card text-left hover:bg-secondary/50',
                                date === selectedDay &&
                                    'shadow-[inset_0_0_0_2px_var(--foreground)]',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums',
                                    date === today &&
                                        'bg-foreground text-background',
                                )}
                            >
                                {formatDayNumber(date)}
                            </span>

                            {/* Phones: one dot for each session. */}
                            {sessions.length > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="flex flex-wrap gap-0.75 px-1 sm:hidden"
                                >
                                    {sessions.map((item) => (
                                        <span
                                            key={item.key}
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                item.kind === 'confirmed'
                                                    ? 'bg-foreground'
                                                    : 'border border-foreground',
                                            )}
                                        />
                                    ))}
                                </span>
                            )}

                            {sessions.slice(0, VISIBLE_PER_DAY).map((item) => (
                                <span
                                    key={item.key}
                                    aria-hidden="true"
                                    className={cn(
                                        'hidden h-5.5 w-full items-center gap-1 overflow-hidden rounded-md px-1.5 text-[11px] leading-3.5 font-semibold whitespace-nowrap sm:flex',
                                        item.kind === 'confirmed'
                                            ? 'bg-foreground text-background'
                                            : 'border border-dashed border-foreground',
                                    )}
                                >
                                    <span className="tabular-nums">
                                        {hourLabel(item.from)}
                                    </span>
                                    <span
                                        className={cn(
                                            'truncate font-normal',
                                            item.kind === 'confirmed'
                                                ? 'text-sidebar-muted-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {shortName(item.title)}
                                    </span>
                                </span>
                            ))}
                            {hidden > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="hidden px-1.5 text-[11px] font-semibold text-muted-foreground sm:block"
                                >
                                    +{hidden} {hidden === 1 ? 'altra' : 'altre'}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
