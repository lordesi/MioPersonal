import type { ReactNode } from 'react';
import WeekBars from '@/components/client/progress/week-bars';
import Panel from '@/components/trainer/area/panel';
import { formatDayMonthShort, formatWeekdayShort } from '@/lib/format';
import type { ClientProgressSummary, ProgressSource } from '@/types';

type ActivityPanelProps = {
    progress: ClientProgressSummary;
    /** e.g. "Segna un allenamento", on the right of the title. */
    action?: ReactNode;
    /** Shown when nothing was done yet, under the numbers. */
    empty?: ReactNode;
    title?: string;
};

const SOURCE: Record<ProgressSource, string> = {
    session: 'Seduta',
    event: 'Corso o evento',
    log: 'Segnato da te',
};

/**
 * "La tua attività": this week, this month and in total, the last 12 weeks
 * and the latest trainings. The trainer sees the same panel in the client's
 * record when the client shares it.
 */
export default function ActivityPanel({
    progress,
    action,
    empty,
    title = 'La tua attività',
}: ActivityPanelProps) {
    const numbers = [
        { label: 'Questa settimana', value: progress.thisWeek },
        { label: 'Questo mese', value: progress.thisMonth },
        { label: 'In totale', value: progress.total },
    ];

    return (
        <Panel title={title} action={action}>
            <dl className="grid grid-cols-3 gap-3">
                {numbers.map((number) => (
                    <div
                        key={number.label}
                        className="flex flex-col gap-1 rounded-2xl bg-secondary/70 p-3"
                    >
                        <dt className="text-xs leading-4 font-medium text-muted-foreground">
                            {number.label}
                        </dt>
                        <dd className="text-[26px] leading-8 font-bold tracking-[-0.03em] tabular-nums">
                            {number.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {progress.total === 0 ? (
                empty
            ) : (
                <>
                    <WeekBars weeks={progress.weeks} goal={progress.goal} />

                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold">
                            Ultimi allenamenti
                        </h3>
                        <ul className="flex flex-col divide-y">
                            {progress.recent.map((entry, index) => (
                                <li
                                    key={`${entry.date}-${index}`}
                                    className="flex items-center gap-3 py-2 text-sm"
                                >
                                    <span className="w-17 flex-none text-muted-foreground tabular-nums">
                                        {formatWeekdayShort(entry.date)}{' '}
                                        {formatDayMonthShort(entry.date)}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate font-medium">
                                        {entry.label}
                                    </span>
                                    <span className="flex-none text-xs text-muted-foreground">
                                        {SOURCE[entry.source]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </Panel>
    );
}
