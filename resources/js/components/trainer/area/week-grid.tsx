import type { CSSProperties } from 'react';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import type { CalendarItem } from '@/lib/calendar';
import { blockKey, hourLabel } from '@/lib/calendar';
import { cn } from '@/lib/utils';

const FIRST_HOUR = 7;
const LAST_HOUR = 21;
/** Height of one hour, in px. */
const ROW = 44;

const hours = Array.from(
    { length: LAST_HOUR - FIRST_HOUR },
    (_, index) => FIRST_HOUR + index,
);

export const itemStyles: Record<CalendarItem['kind'], string> = {
    confirmed: 'bg-primary text-primary-foreground',
    pending: 'border-[1.5px] border-dashed border-foreground bg-background',
    busy: 'border bg-muted text-muted-foreground',
    block: 'border text-muted-foreground bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,var(--background)_6px_12px)]',
};

const kindNames: Record<CalendarItem['kind'], string> = {
    confirmed: 'confermata',
    pending: 'da confermare',
    busy: 'impegno dal calendario',
    block: 'orario bloccato',
};

type WeekGridProps = {
    days: string[];
    items: CalendarItem[];
    today: string;
    blocks: Set<string>;
    onToggleBlock: (date: string, hour: number) => void;
};

/** Week view from 07:00 to 21:00; free hours can be blocked with a tap. */
export default function WeekGrid({
    days,
    items,
    today,
    blocks,
    onToggleBlock,
}: WeekGridProps) {
    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-190 grid-cols-[56px_repeat(7,minmax(0,1fr))]">
                <span />
                {days.map((date) => {
                    const confirmed = items.filter(
                        (item) =>
                            item.date === date && item.kind === 'confirmed',
                    ).length;

                    return (
                        <span
                            key={date}
                            className={cn(
                                'flex flex-col items-center py-2 text-xs',
                                date === today
                                    ? 'font-bold text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <span>
                                {formatWeekdayShort(date)}{' '}
                                {formatDayNumber(date)}
                            </span>
                            <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                                {confirmed}{' '}
                                {confirmed === 1 ? 'seduta' : 'sedute'}
                            </span>
                        </span>
                    );
                })}

                <div aria-hidden="true">
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="h-11 -translate-y-1.25 pr-2 text-right text-[11px] leading-[11px] text-muted-foreground tabular-nums"
                        >
                            {hourLabel(hour)}
                        </div>
                    ))}
                </div>

                {days.map((date) => (
                    <DayColumn
                        key={date}
                        date={date}
                        items={items.filter((item) => item.date === date)}
                        blocks={blocks}
                        onToggleBlock={onToggleBlock}
                    />
                ))}
            </div>
        </div>
    );
}

function DayColumn({
    date,
    items,
    blocks,
    onToggleBlock,
}: {
    date: string;
    items: CalendarItem[];
    blocks: Set<string>;
    onToggleBlock: (date: string, hour: number) => void;
}) {
    const dayName = formatDayLong(date).toLowerCase();
    const taken = (hour: number) =>
        items.some(
            (item) =>
                item.kind !== 'block' && item.from < hour + 1 && item.to > hour,
        );

    return (
        <div
            className="relative border-l bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_44px)]"
            style={{ height: hours.length * ROW }}
        >
            {hours
                .filter((hour) => !taken(hour))
                .map((hour) => {
                    const blocked = blocks.has(blockKey(date, hour));

                    return (
                        <button
                            key={hour}
                            type="button"
                            aria-label={`${blocked ? 'Sblocca' : 'Blocca'} ${dayName} alle ${hourLabel(hour)}`}
                            aria-pressed={blocked}
                            onClick={() => onToggleBlock(date, hour)}
                            className="absolute inset-x-0 h-11 hover:bg-accent/60"
                            style={{ top: (hour - FIRST_HOUR) * ROW }}
                        />
                    );
                })}

            {items.map((item) => (
                <div
                    key={item.key}
                    role="note"
                    aria-label={`${item.title}, ${dayName} ${hourLabel(item.from)}–${hourLabel(item.to)}, ${kindNames[item.kind]}`}
                    className={cn(
                        'absolute inset-x-0.75 z-10 overflow-hidden rounded-md px-1.5 py-1 text-[11px] leading-3.5',
                        itemStyles[item.kind],
                        // Clicks go to the button below, which unblocks the hour.
                        item.kind === 'block' && 'pointer-events-none',
                    )}
                    style={eventPosition(item)}
                >
                    <strong className="block font-semibold">
                        {item.title}
                    </strong>
                    <span className="tabular-nums">
                        {hourLabel(item.from)} · {item.detail}
                    </span>
                </div>
            ))}
        </div>
    );
}

function eventPosition(item: CalendarItem): CSSProperties {
    const from = Math.max(item.from, FIRST_HOUR);
    const to = Math.min(item.to, LAST_HOUR);

    return {
        top: (from - FIRST_HOUR) * ROW + 1,
        height: (to - from) * ROW - 3,
    };
}
