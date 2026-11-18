import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    monthCells,
    monthName,
    sessionsLabel,
    shiftMonth,
} from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

type MiniMonthProps = {
    /** "YYYY-MM". */
    month: string;
    selectedDay: string;
    today: string;
    /** Sessions per day of the month: the dots. */
    counts: Record<string, number>;
    minDate: string;
    maxDate: string;
    onPick: (date: string) => void;
};

/**
 * The small month on the left of the desktop calendar: a dot on the days
 * with sessions; a day opens it. The arrows move to the month before or after.
 */
export default function MiniMonth({
    month,
    selectedDay,
    today,
    counts,
    minDate,
    maxDate,
    onPick,
}: MiniMonthProps) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);
    const label = monthName(month).replace(/^./u, (letter) =>
        letter.toUpperCase(),
    );
    const previous = shiftMonth(month, -1);
    const next = shiftMonth(month, 1);

    return (
        <div className="flex flex-col gap-1 rounded-[18px] bg-card p-2">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    disabled={`${month}-01` <= minDate}
                    onClick={() => onPick(`${previous}-01`)}
                    aria-label="Mese precedente"
                    title="Mese precedente"
                    className="flex size-9 items-center justify-center rounded-full outline-none hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40"
                >
                    <ChevronLeft aria-hidden="true" className="size-4.5" />
                </button>
                <h2 className="text-[15px] font-semibold">{label}</h2>
                <button
                    type="button"
                    disabled={`${next}-01` > maxDate}
                    onClick={() => onPick(`${next}-01`)}
                    aria-label="Mese successivo"
                    title="Mese successivo"
                    className="flex size-9 items-center justify-center rounded-full outline-none hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40"
                >
                    <ChevronRight aria-hidden="true" className="size-4.5" />
                </button>
            </div>
            <div
                aria-hidden="true"
                className="grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground"
            >
                {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                ))}
            </div>
            <div role="group" aria-label={label} className="grid grid-cols-7">
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const selected = date === selectedDay;
                    const isToday = date === today;
                    const past = date < today;
                    const count = counts[date] ?? 0;

                    return (
                        <button
                            key={date}
                            type="button"
                            onClick={() => onPick(date)}
                            aria-pressed={selected}
                            aria-label={`${formatDayLong(date)}${isToday ? ', oggi' : ''}, ${sessionsLabel(count).toLowerCase()}`}
                            className="flex h-11 flex-col items-center justify-center gap-0.5 justify-self-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <span
                                className={cn(
                                    'flex size-8.5 items-center justify-center rounded-[10px] text-[15px] tabular-nums',
                                    selected
                                        ? 'bg-brand font-bold text-[#0a0a0a]'
                                        : isToday
                                          ? 'font-bold text-brand shadow-[inset_0_0_0_1px_#42d7d9]'
                                          : past
                                            ? 'text-[#8a8a8a]'
                                            : 'text-foreground',
                                )}
                            >
                                {Number(date.slice(8))}
                            </span>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-1 rounded-full',
                                    count === 0
                                        ? 'bg-transparent'
                                        : past
                                          ? 'bg-[#5c5c5c]'
                                          : 'bg-brand',
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
