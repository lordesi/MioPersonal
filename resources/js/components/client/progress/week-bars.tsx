import { formatDayMonthShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProgressWeek } from '@/types';

type WeekBarsProps = {
    weeks: ProgressWeek[];
    /** The weekly goal: a dashed line across the bars. */
    goal?: number | null;
};

/**
 * Trainings week by week, the current one last (in full colour, the others
 * muted). One series, so plain bars: no chart library. Each bar names its
 * week and count on hover; screen readers get the same as a list.
 */
export default function WeekBars({ weeks, goal }: WeekBarsProps) {
    const max = Math.max(goal ?? 0, ...weeks.map((week) => week.count), 1);
    const percent = (count: number) => (count / max) * 100;
    const label = (week: ProgressWeek) =>
        `Settimana del ${formatDayMonthShort(week.start)}: ${week.count === 1 ? '1 allenamento' : `${week.count} allenamenti`}`;

    return (
        <figure className="flex flex-col gap-1.5">
            <div
                aria-hidden="true"
                className="relative flex h-24 items-end gap-0.5 border-b"
            >
                {weeks.map((week, index) => (
                    <div
                        key={week.start}
                        title={label(week)}
                        className="group flex h-full flex-1 items-end"
                    >
                        <div
                            style={{
                                height:
                                    week.count > 0
                                        ? `${percent(week.count)}%`
                                        : '2px',
                            }}
                            className={cn(
                                'w-full rounded-t-[4px] transition-opacity group-hover:opacity-80',
                                index === weeks.length - 1
                                    ? 'bg-primary'
                                    : week.count > 0
                                      ? 'bg-primary/35'
                                      : 'bg-border',
                            )}
                        />
                    </div>
                ))}
                {goal ? (
                    <div
                        style={{ bottom: `${percent(goal)}%` }}
                        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/70"
                    />
                ) : null}
            </div>
            <figcaption className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                <span>{formatDayMonthShort(weeks[0].start)}</span>
                {goal ? (
                    <span>Tratteggio: obiettivo di {goal} a settimana</span>
                ) : null}
                <span>Questa settimana</span>
            </figcaption>
            <ul className="sr-only">
                {weeks.map((week) => (
                    <li key={week.start}>{label(week)}</li>
                ))}
            </ul>
        </figure>
    );
}
