import ResponsiveText from '@/components/shared/responsive-text';
import { DaySessions } from '@/components/trainer/area/day-agenda';
import { Button } from '@/components/ui/button';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel, monthCells, sessionsLabel } from '@/lib/calendar';
import { formatDayNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** Sessions written inside a day on large screens; the others become "+2 altre". */
const VISIBLE_PER_DAY = 3;

type MonthCalendarProps = {
    /** "YYYY-MM" */
    month: string;
    items: CalendarItem[];
    today: string;
    selected: string;
    onSelect: (date: string) => void;
    onOpenWeek: () => void;
};

/**
 * The month: on computers each day lists its sessions (time and client),
 * on phones only how many. The sessions of the chosen day are on the side.
 */
export default function MonthCalendar({
    month,
    items,
    today,
    selected,
    onSelect,
    onOpenWeek,
}: MonthCalendarProps) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);
    const dayItems = (date: string) =>
        items
            .filter((item) => item.date === date)
            .sort((a, b) => a.from - b.from);

    return (
        <section
            aria-label="Mese"
            className="flex flex-wrap gap-6 rounded-xl border bg-card p-4 md:p-5"
        >
            <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-1.5">
                <div
                    aria-hidden="true"
                    className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground"
                >
                    {weekdays.map((day) => (
                        <span key={day}>
                            <ResponsiveText
                                mobile={day.charAt(0)}
                                desktop={day}
                            />
                        </span>
                    ))}
                </div>

                <div
                    role="group"
                    aria-label="Giorni del mese"
                    className="grid grid-cols-7 gap-1"
                >
                    {cells.map((date, index) => {
                        if (date === null) {
                            return (
                                <span
                                    key={`blank-${index}`}
                                    aria-hidden="true"
                                />
                            );
                        }

                        const sessions = dayItems(date);
                        const hidden = sessions.length - VISIBLE_PER_DAY;

                        return (
                            <button
                                key={date}
                                type="button"
                                aria-pressed={date === selected}
                                aria-label={`${formatDayNumber(date)}: ${sessionsLabel(sessions.length).toLowerCase()}`}
                                onClick={() => onSelect(date)}
                                className={cn(
                                    'flex h-14 min-w-0 flex-col gap-0.5 overflow-hidden rounded-lg border bg-background p-1 text-left md:h-24 md:p-1.5',
                                    date === selected &&
                                        'border-2 border-foreground',
                                    date === today &&
                                        'outline-2 outline-offset-2 outline-muted-foreground outline-dashed',
                                )}
                            >
                                <span className="text-[13px] leading-4 font-semibold tabular-nums">
                                    {formatDayNumber(date)}
                                </span>

                                {sessions.length > 0 && (
                                    <span className="mt-auto self-end rounded-full bg-primary px-1.5 text-[11px] leading-4 font-semibold text-primary-foreground tabular-nums md:hidden">
                                        {sessions.length}
                                    </span>
                                )}

                                <span className="hidden min-w-0 flex-col gap-0.5 md:flex">
                                    {sessions
                                        .slice(0, VISIBLE_PER_DAY)
                                        .map((item) => (
                                            <span
                                                key={item.key}
                                                className={cn(
                                                    'truncate rounded px-1 text-[11px] leading-4 tabular-nums',
                                                    item.kind === 'confirmed'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'border border-dashed border-foreground',
                                                )}
                                            >
                                                {hourLabel(item.from)}{' '}
                                                {item.title}
                                            </span>
                                        ))}
                                    {hidden > 0 && (
                                        <span className="px-1 text-[11px] leading-4 text-muted-foreground">
                                            +{hidden}{' '}
                                            {hidden === 1 ? 'altra' : 'altre'}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-[1_1_240px] flex-col gap-2">
                <DaySessions date={selected} items={items} />
                <Button
                    type="button"
                    variant="outline"
                    className="mt-1 hidden self-start md:inline-flex"
                    onClick={onOpenWeek}
                >
                    Apri la settimana
                </Button>
            </div>
        </section>
    );
}
