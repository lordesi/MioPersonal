import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

/** The hours a trainer can open in Disponibilità: from 06:00 to 24:00. */
const FIRST_HOUR = 6;
const LAST_HOUR = 24;
/** Height of one hour, in px. */
const ROW = 64;
/** Hours visible at once: the others scroll inside the grid. */
const VISIBLE_HOURS = 10;
/** Height of the row of the days, in px (h-20). */
const HEADER = 80;

/** A session in the white calendar: black when confirmed, dashed while waiting. */
export const itemStyles: Record<CalendarItem['kind'], string> = {
    confirmed:
        'bg-foreground text-background shadow-[0_4px_12px_rgb(0_0_0/0.12)] hover:bg-foreground/90',
    pending:
        'border-[1.5px] border-dashed border-foreground bg-card text-foreground hover:bg-secondary',
};

export const kindNames: Record<CalendarItem['kind'], string> = {
    confirmed: 'confermata',
    pending: 'da confermare',
};

/** The same at the start of a badge or a line. */
export const kindLabels: Record<CalendarItem['kind'], string> = {
    confirmed: 'Confermata',
    pending: 'Da confermare',
};

/** "Pacchetto 10 sedute · seduta 1 di 10" → "Pacchetto · 1 di 10": short for the blocks. */
export function shortService(service: string): string {
    const session = / · seduta (\d+ di \d+)$/u.exec(service);

    return session ? `Pacchetto · ${session[1]}` : service;
}

type WeekGridProps = {
    days: string[];
    items: CalendarItem[];
    today: string;
    /** The day chosen in the strip: its column is grey. */
    selectedDay: string;
    /** The session whose details are open. */
    selectedId: number | null;
    onSelect: (item: CalendarItem) => void;
};

/**
 * The week hour by hour, from 06:00 to 24:00: 10 hours are visible, the
 * others scroll under the row of the days. Each session is a button that
 * opens its details.
 */
export default function WeekGrid({
    days,
    items,
    today,
    selectedDay,
    selectedId,
    onSelect,
}: WeekGridProps) {
    const weekItems = items.filter((item) => days.includes(item.date));
    const firstHour = Math.min(
        FIRST_HOUR,
        ...weekItems.map((item) => Math.floor(item.from)),
    );
    const lastHour = Math.max(
        LAST_HOUR,
        ...weekItems.map((item) => Math.ceil(item.to)),
    );
    const hours = Array.from(
        { length: lastHour - firstHour },
        (_, index) => firstHour + index,
    );

    // The grid opens one hour before the first session of the week (06:00
    // when the week is empty), always with 10 full hours in view.
    const earliest =
        weekItems.length > 0
            ? Math.floor(Math.min(...weekItems.map((item) => item.from))) - 1
            : firstHour;
    const startHour = Math.min(
        Math.max(firstHour, earliest),
        lastHour - VISIBLE_HOURS,
    );
    const scroller = useRef<HTMLDivElement>(null);
    const monday = days[0];

    // Only when the week changes: choosing a day or a session keeps the scroll.
    useEffect(() => {
        if (scroller.current) {
            scroller.current.scrollTop = (startHour - firstHour) * ROW;
        }
    }, [monday, startHour, firstHour]);

    return (
        <div
            ref={scroller}
            className="overflow-auto"
            style={{
                maxHeight: `min(${HEADER + VISIBLE_HOURS * ROW}px, 75svh)`,
            }}
        >
            <div className="min-w-170">
                <div className="sticky top-0 z-20 grid h-20 grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b bg-card">
                    <span />
                    {days.map((date) => (
                        <div
                            key={date}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 border-l border-border/60 px-1',
                                date === selectedDay && 'bg-secondary/60',
                            )}
                        >
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                                {formatWeekdayShort(date)}
                            </span>
                            <span
                                className={cn(
                                    'flex size-8.5 items-center justify-center rounded-full text-base font-bold tabular-nums',
                                    date === today &&
                                        'bg-foreground text-background',
                                    date !== today &&
                                        date === selectedDay &&
                                        'border-[1.5px] border-foreground',
                                )}
                            >
                                {formatDayNumber(date)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
                    <div aria-hidden="true">
                        {hours.map((hour) => (
                            <span
                                key={hour}
                                className="block h-16 pt-1.5 pr-2.5 text-right text-[11px] leading-3.5 font-medium text-ring tabular-nums"
                            >
                                {hourLabel(hour)}
                            </span>
                        ))}
                    </div>

                    {days.map((date) => (
                        <div
                            key={date}
                            className={cn(
                                'relative border-l border-border/60 bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_64px)]',
                                date === selectedDay && 'bg-secondary/60',
                            )}
                            style={{ height: hours.length * ROW }}
                        >
                            {weekItems
                                .filter((item) => item.date === date)
                                .map((item) => (
                                    <SessionBlock
                                        key={item.key}
                                        item={item}
                                        firstHour={firstHour}
                                        pressed={item.id === selectedId}
                                        onSelect={() => onSelect(item)}
                                    />
                                ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SessionBlock({
    item,
    firstHour,
    pressed,
    onSelect,
}: {
    item: CalendarItem;
    firstHour: number;
    pressed: boolean;
    onSelect: () => void;
}) {
    const time = `${hourLabel(item.from)} – ${hourLabel(item.to)}`;

    return (
        <button
            type="button"
            aria-pressed={pressed}
            aria-label={`${formatDayLong(item.date)}, ${time}, ${item.title}, ${item.detail}, ${kindNames[item.kind]}`}
            onClick={onSelect}
            className={cn(
                'absolute inset-x-1 z-10 flex flex-col items-start justify-center overflow-hidden rounded-xl px-2 py-1.5 text-left',
                itemStyles[item.kind],
                pressed &&
                    'ring-2 ring-foreground ring-offset-2 ring-offset-card',
            )}
            style={blockPosition(item, firstHour)}
        >
            {/* Only the start: the columns are narrow, the end is in the details. */}
            <span className="text-xs font-bold tabular-nums">
                {hourLabel(item.from)}
            </span>
            <span className="max-w-full truncate text-[13px] leading-4.5 font-semibold">
                {item.title}
            </span>
            <span
                className={cn(
                    'max-w-full truncate text-xs',
                    item.kind === 'confirmed'
                        ? 'text-sidebar-muted-foreground'
                        : 'text-muted-foreground',
                )}
            >
                {shortService(item.detail)}
            </span>
        </button>
    );
}

function blockPosition(item: CalendarItem, firstHour: number): CSSProperties {
    return {
        top: (item.from - firstHour) * ROW + 2,
        height: (item.to - item.from) * ROW - 4,
    };
}
