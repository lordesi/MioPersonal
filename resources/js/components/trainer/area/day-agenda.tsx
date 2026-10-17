import { itemStyles } from '@/components/trainer/area/week-grid';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';

type DayAgendaProps = {
    days: string[];
    selected: string;
    onSelect: (date: string) => void;
    items: CalendarItem[];
};

/** Mobile calendar: pick a day of the week, see its list of sessions. */
export default function DayAgenda({
    days,
    selected,
    onSelect,
    items,
}: DayAgendaProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-7 gap-1">
                {days.map((date) => {
                    const count = items.filter(
                        (item) => item.date === date,
                    ).length;
                    const active = date === selected;

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelect(date)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs',
                                active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'border bg-card',
                            )}
                        >
                            <span>{formatWeekdayShort(date)}</span>
                            <span className="text-base font-bold tabular-nums">
                                {formatDayNumber(date)}
                            </span>
                            <span className="tabular-nums opacity-70">
                                {count || '–'}
                            </span>
                        </button>
                    );
                })}
            </div>

            <DaySessions date={selected} items={items} />
        </div>
    );
}

/** The sessions of one day, in order: under the week on phones and next to the month. */
export function DaySessions({
    date,
    items,
}: {
    date: string;
    items: CalendarItem[];
}) {
    const agenda = items
        .filter((item) => item.date === date)
        .sort((a, b) => a.from - b.from);

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{formatDayLong(date)}</span>

            {agenda.length === 0 ? (
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    Giornata libera: nessuna seduta.
                </p>
            ) : (
                agenda.map((item) => (
                    <div
                        key={item.key}
                        className={cn(
                            'flex gap-3 rounded-xl p-3',
                            itemStyles[item.kind],
                        )}
                    >
                        <span className="w-24 flex-none text-sm font-semibold tabular-nums">
                            {hourLabel(item.from)}–{hourLabel(item.to)}
                        </span>
                        <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold">
                                {item.title}
                            </span>
                            <span className="text-xs opacity-80">
                                {item.detail}
                                {item.place && ` · ${item.place}`}
                            </span>
                            {item.kind === 'pending' && (
                                <span className="text-xs font-semibold">
                                    Da confermare
                                </span>
                            )}
                        </span>
                    </div>
                ))
            )}
        </div>
    );
}
