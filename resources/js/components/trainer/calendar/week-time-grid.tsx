import type { SessionRowContext } from '@/components/trainer/calendar/session-row';
import {
    hourRange,
    sessionSurface,
} from '@/components/trainer/calendar/session-status';
import { hourLabel } from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

/** One hour of the grid, in px (as the design). */
const ROW = 56;

/**
 * "Settimana" on desktop: the hours on the left and the 7 days side by
 * side, each session a block at its time. A click on a block shows its
 * details on the right; a click on a free hour adds a session there.
 */
export default function WeekTimeGrid({
    days,
    items,
    today,
    selectedDay,
    selectedId,
    onSelect,
    onPickDay,
    onAddAt,
    draft,
    context,
}: {
    days: string[];
    items: CalendarItem[];
    today: string;
    selectedDay: string;
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onPickDay: (date: string) => void;
    onAddAt: ((date: string, time: string, cell: HTMLElement) => void) | null;
    /** The session being added from the grid: "Nuova seduta" at its time. */
    draft: { date: string; time: string } | null;
    context: SessionRowContext;
}) {
    const weekItems = items.filter((item) => days.includes(item.date));
    const hours = hourRange(weekItems);
    const first = hours[0];
    const height = hours.length * ROW;

    return (
        <div className="flex min-w-0 flex-1 gap-2">
            <div className="flex w-13 shrink-0 flex-col pt-16">
                {hours.map((hour) => (
                    <span
                        key={hour}
                        className="h-14 text-xs font-semibold text-muted-foreground tabular-nums"
                    >
                        {hourLabel(hour)}
                    </span>
                ))}
            </div>
            <div className="grid flex-1 grid-cols-7 gap-1.5">
                {days.map((date) => {
                    const on = date === selectedDay;
                    const list = weekItems
                        .filter((item) => item.date === date)
                        .sort((a, b) => a.from - b.from);
                    const draftHere = draft?.date === date ? draft : null;
                    const draftFrom = draftHere
                        ? Number(draftHere.time.slice(0, 2)) +
                          Number(draftHere.time.slice(3)) / 60
                        : 0;

                    return (
                        <div key={date} className="flex min-w-0 flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => onPickDay(date)}
                                aria-label={`${formatDayLong(date)}${date === today ? ', oggi' : ''}`}
                                aria-pressed={on}
                                className="cursor-pointer border-0 bg-transparent p-0 text-inherit outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]"
                            >
                                <span
                                    className={cn(
                                        'flex flex-col items-center gap-0.5 rounded-[14px] py-2',
                                        on
                                            ? 'bg-[#42D7D9] text-black'
                                            : date === today &&
                                                  'text-[#42D7D9]',
                                    )}
                                >
                                    <span className="text-xs font-semibold">
                                        {formatWeekdayShort(date)}
                                    </span>
                                    <b className="text-xl font-bold">
                                        {formatDayNumber(date)}
                                    </b>
                                </span>
                            </button>
                            <div
                                className="relative rounded-2xl"
                                style={{
                                    height,
                                    background: `repeating-linear-gradient(180deg, transparent 0 ${ROW - 1}px, #121315 ${ROW - 1}px ${ROW}px)`,
                                }}
                            >
                                {onAddAt &&
                                    date >= today &&
                                    hours.map((hour) => (
                                        <button
                                            key={hour}
                                            type="button"
                                            tabIndex={-1}
                                            aria-label={`Aggiungi una seduta ${formatDayLong(date).toLowerCase()} alle ${hourLabel(hour)}`}
                                            onClick={(event) =>
                                                onAddAt(
                                                    date,
                                                    hourLabel(hour),
                                                    event.currentTarget,
                                                )
                                            }
                                            className="absolute inset-x-0 cursor-pointer border-0 bg-transparent p-0 hover:bg-white/[0.03]"
                                            style={{
                                                top: (hour - first) * ROW,
                                                height: ROW,
                                            }}
                                        />
                                    ))}
                                {list.map((item) => {
                                    const selected = item.id === selectedId;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() =>
                                                onSelect(
                                                    selected ? null : item.id,
                                                )
                                            }
                                            className={cn(
                                                'absolute inset-x-1 flex cursor-pointer flex-col items-stretch justify-start gap-px overflow-hidden rounded-xl border-0 px-2 py-1.75 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]',
                                                sessionSurface(
                                                    context.kindOf(item),
                                                    selected,
                                                ),
                                            )}
                                            style={{
                                                top: (item.from - first) * ROW,
                                                height: Math.max(
                                                    (item.to - item.from) *
                                                        ROW -
                                                        4,
                                                    24,
                                                ),
                                            }}
                                        >
                                            <b className="truncate text-[13px] leading-4 font-bold">
                                                {item.title}
                                            </b>
                                            <span className="text-[11px] leading-3.5 whitespace-nowrap text-muted-foreground tabular-nums">
                                                {hourLabel(item.from)}–
                                                {hourLabel(item.to)}
                                            </span>
                                        </button>
                                    );
                                })}
                                {draftHere && (
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-x-1 flex flex-col gap-px overflow-hidden rounded-xl bg-[rgba(66,215,217,0.14)] px-2 py-1.75 text-[#42D7D9] shadow-[inset_0_0_0_1.5px_#42D7D9]"
                                        style={{
                                            top: (draftFrom - first) * ROW,
                                            height: ROW - 4,
                                        }}
                                    >
                                        <b className="truncate text-[13px] leading-4 font-bold">
                                            Nuova seduta
                                        </b>
                                        <span className="text-[11px] leading-3.5 whitespace-nowrap tabular-nums">
                                            {draftHere.time}–
                                            {hourLabel(draftFrom + 1)}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
