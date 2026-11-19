import { useEffect, useRef } from 'react';
import { kindNames, shortService } from '@/components/trainer/area/week-grid';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel, romeParts, toneStyle } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

/** The hours a trainer can open in Disponibilità: from 06:00 to 24:00. */
const FIRST_HOUR = 6;
const LAST_HOUR = 24;
/** Hours visible at once: the others scroll inside the grid. */
const VISIBLE_HOURS = 10;
/** Width of the column of the hours, in px. */
const HOURS_COLUMN = 56;

type TimeGridProps = {
    /** The days shown side by side: 2 on phones, 7 on desktop. */
    days: string[];
    items: CalendarItem[];
    today: string;
    now: Date;
    /** The day chosen: its column is a little lighter (only with 7 days). */
    selectedDay: string;
    /** The session whose details are open. */
    selectedId: number | null;
    onSelect: (item: CalendarItem) => void;
    /** Height of one hour, in px. */
    row?: number;
    /** The ground under the sticky row of the days: the page or a panel. */
    surface?: 'page' | 'panel';
};

/**
 * The days hour by hour (design "Calendario · Settimana"): the hours on the
 * left, a column for each day, the sessions as blocks tinted by kind and the
 * dashed turquoise line of the time now. Ten hours are in view; the grid
 * opens one hour before the first session.
 */
export default function TimeGrid({
    days,
    items,
    today,
    now,
    selectedDay,
    selectedId,
    onSelect,
    row = 52,
    surface = 'page',
}: TimeGridProps) {
    const shown = items.filter((item) => days.includes(item.date));
    const firstHour = Math.min(
        FIRST_HOUR,
        ...shown.map((item) => Math.floor(item.from)),
    );
    const lastHour = Math.min(
        24,
        Math.max(LAST_HOUR, ...shown.map((item) => Math.ceil(item.to))),
    );
    const hours = Array.from(
        { length: lastHour - firstHour },
        (_, index) => firstHour + index,
    );
    const compact = days.length > 3;
    const nowParts = romeParts(now);
    const showNow =
        days.includes(today) &&
        nowParts.hour >= firstHour &&
        nowParts.hour < lastHour;

    // One hour before the first session (or the time now, today), always
    // with 10 full hours in view.
    const earliest =
        shown.length > 0
            ? Math.floor(Math.min(...shown.map((item) => item.from))) - 1
            : showNow
              ? Math.floor(nowParts.hour) - 1
              : 8;
    const startHour = Math.max(
        firstHour,
        Math.min(earliest, lastHour - VISIBLE_HOURS),
    );
    const scroller = useRef<HTMLDivElement>(null);
    const firstDay = days[0];

    // Only when the days change: choosing a session keeps the scroll.
    useEffect(() => {
        if (scroller.current) {
            scroller.current.scrollTop = (startHour - firstHour) * row;
        }
    }, [firstDay, startHour, firstHour, row]);

    const columns = {
        gridTemplateColumns: `${HOURS_COLUMN}px repeat(${days.length}, minmax(0, 1fr))`,
    };

    return (
        <div
            ref={scroller}
            className="[scrollbar-width:none] overflow-auto"
            style={{
                maxHeight: `min(${56 + VISIBLE_HOURS * row}px, 72svh)`,
            }}
        >
            <div className={cn(compact && 'min-w-160')}>
                <div
                    className={cn(
                        'sticky top-0 z-30 grid border-b',
                        surface === 'page' ? 'bg-background' : 'bg-[#141414]',
                    )}
                    style={columns}
                >
                    <span />
                    {days.map((date) => (
                        <DayHeading
                            key={date}
                            date={date}
                            today={today}
                            compact={compact}
                            selected={compact && date === selectedDay}
                        />
                    ))}
                </div>

                <div className="relative grid pt-2" style={columns}>
                    <div aria-hidden="true">
                        {hours.map((hour) => (
                            <span
                                key={hour}
                                className="block -translate-y-2 pr-2.5 text-right text-xs leading-4 text-muted-foreground tabular-nums"
                                style={{ height: row }}
                            >
                                {hourLabel(hour)}
                            </span>
                        ))}
                    </div>

                    {days.map((date, index) => (
                        <div
                            key={date}
                            className={cn(
                                'relative',
                                index > 0 && 'border-l border-border/70',
                                compact &&
                                    date === selectedDay &&
                                    'bg-white/[0.025]',
                            )}
                            style={{
                                height: hours.length * row,
                                backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${row}px)`,
                            }}
                        >
                            {shown
                                .filter((item) => item.date === date)
                                .map((item) => (
                                    <SessionBlock
                                        key={item.key}
                                        item={item}
                                        top={(item.from - firstHour) * row}
                                        height={(item.to - item.from) * row}
                                        pressed={item.id === selectedId}
                                        onSelect={() => onSelect(item)}
                                    />
                                ))}
                        </div>
                    ))}

                    {showNow && (
                        <div
                            role="img"
                            aria-label={`Adesso, ${hourLabel(nowParts.hour)}`}
                            className="pointer-events-none absolute right-0 left-0 z-20 flex h-5 -translate-y-1/2 items-center"
                            style={{
                                top: 8 + (nowParts.hour - firstHour) * row,
                            }}
                        >
                            <span
                                className={cn(
                                    'shrink-0 pr-1.5 text-right text-xs leading-4 font-bold text-brand tabular-nums',
                                    surface === 'page'
                                        ? 'bg-background'
                                        : 'bg-[#141414]',
                                )}
                                style={{ width: HOURS_COLUMN - 6 }}
                            >
                                {hourLabel(nowParts.hour)}
                            </span>
                            <span className="-ml-0.5 size-2 shrink-0 rounded-full bg-brand" />
                            <span className="h-0 flex-1 border-t-2 border-dashed border-brand" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DayHeading({
    date,
    today,
    compact,
    selected,
}: {
    date: string;
    today: string;
    compact: boolean;
    selected: boolean;
}) {
    const isToday = date === today;

    if (compact) {
        return (
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2 pt-1 pb-2.5',
                    selected && 'bg-white/[0.025]',
                )}
            >
                <span
                    className={cn(
                        'text-[13px]',
                        isToday ? 'text-brand' : 'text-muted-foreground',
                    )}
                >
                    {formatWeekdayShort(date)}
                </span>
                <span
                    className={cn(
                        'inline-flex h-8.5 min-w-8.5 items-center justify-center rounded-full text-[20px] leading-none font-bold tabular-nums',
                        isToday && 'bg-brand px-1.5 text-[#0a0a0a]',
                    )}
                >
                    {formatDayNumber(date)}
                </span>
            </div>
        );
    }

    return (
        <div className="px-1.5 pb-2.5">
            <span
                className={cn(
                    'block truncate text-[15px] leading-5 font-semibold',
                    isToday && 'text-brand',
                )}
            >
                {formatDayLong(date).split(' ').slice(0, 2).join(' ')}
            </span>
        </div>
    );
}

function SessionBlock({
    item,
    top,
    height,
    pressed,
    onSelect,
}: {
    item: CalendarItem;
    top: number;
    height: number;
    pressed: boolean;
    onSelect: () => void;
}) {
    const time = `${hourLabel(item.from)}–${hourLabel(item.to)}`;
    const tone = toneStyle(item);

    return (
        <button
            type="button"
            aria-pressed={pressed}
            aria-label={`${formatDayLong(item.date)}, ${time}, ${item.title}, ${item.detail}, ${kindNames[item.kind]}`}
            onClick={onSelect}
            className={cn(
                'absolute inset-x-0.75 z-10 flex flex-col gap-0.5 overflow-hidden rounded-xl px-2 py-1.5 text-left text-foreground transition-[filter] outline-none hover:brightness-125 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                pressed && 'ring-2 ring-foreground',
            )}
            style={{
                top: top + 2,
                height: Math.max(height - 4, 22),
                background: tone.background,
                border: tone.border,
            }}
        >
            <span className="flex max-w-full items-center gap-1.5 text-[13px] leading-4.5 font-semibold whitespace-nowrap">
                <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: tone.dot }}
                />
                <span className="truncate">{item.title}</span>
            </span>
            <span className="max-w-full truncate text-xs leading-4 text-muted-foreground">
                {time} · {shortService(item.detail)}
            </span>
        </button>
    );
}
