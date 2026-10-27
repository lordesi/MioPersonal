import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { useId } from 'react';
import { hoursAmountLabel, sessionsLabel } from '@/lib/calendar';
import { formatDayLong, formatDayRange } from '@/lib/format';
import { calendar } from '@/routes/trainer';
import type { PastWeekSummary as Summary } from '@/types';

/**
 * "Ultimi 7 giorni" next to the list of "Sedute passate": the sessions over
 * that can still be changed, how many the clients came to ("Presenze") and
 * the link to the calendar. Counted on the server, not only on this page.
 */
export default function PastWeekSummary({ summary }: { summary: Summary }) {
    const titleId = useId();
    const done = summary.sessions - summary.missed;
    const presence =
        summary.sessions > 0 ? Math.round((done / summary.sessions) * 100) : 0;

    return (
        <aside
            aria-labelledby={titleId}
            className="flex min-w-0 flex-[2_1_300px] flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground lg:sticky lg:top-6"
        >
            <div className="flex flex-col gap-1.5">
                <h2
                    id={titleId}
                    className="text-xs leading-4 font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    ULTIMI 7 GIORNI
                </h2>
                <span className="text-[34px] leading-10 font-bold tracking-[-0.03em] tabular-nums">
                    {sessionsLabel(summary.sessions)}
                </span>
                {summary.sessions > 0 && (
                    <span className="text-sm leading-5 text-sidebar-foreground/80 tabular-nums">
                        {subtitle(summary)}
                    </span>
                )}
            </div>

            {summary.sessions > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[13px] leading-4.5 text-sidebar-foreground/80">
                        <span>Presenze</span>
                        <span className="font-bold text-sidebar-foreground tabular-nums">
                            {presence}%
                        </span>
                    </div>
                    <div
                        aria-hidden="true"
                        className="h-2 overflow-hidden rounded-full bg-sidebar-border"
                    >
                        <div
                            className="h-full rounded-full bg-sidebar-foreground"
                            style={{ width: `${presence}%` }}
                        />
                    </div>
                </div>
            )}

            <dl className="grid grid-cols-2 gap-2">
                <Stat label="Effettuate" value={done} />
                <Stat label="Saltate" value={summary.missed} />
            </dl>

            <Link
                href={calendar()}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-sidebar-border text-sm font-semibold hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
                <Calendar aria-hidden="true" className="size-4" />
                Apri il calendario
            </Link>
        </aside>
    );
}

/** A box of the grid: the number on top, the label below. */
function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col-reverse gap-0.5 rounded-xl bg-sidebar-accent p-3">
            <dt className="text-xs leading-4 text-sidebar-muted-foreground">
                {label}
            </dt>
            <dd className="text-[22px] leading-7 font-bold tabular-nums">
                {value}
            </dd>
        </div>
    );
}

/** "4 ore con 1 cliente · 19 – 22 ottobre" */
function subtitle(summary: Summary): string {
    const { first, last } = summary;
    const parts = [hoursAmountLabel(summary.hours)];

    // 0 = only deleted accounts: nobody to count.
    if (summary.clients > 0) {
        parts.push(
            `con ${summary.clients} ${summary.clients === 1 ? 'cliente' : 'clienti'}`,
        );
    }

    if (first === null || last === null) {
        return parts.join(' ');
    }

    const days =
        first === last
            ? formatDayLong(first).toLowerCase()
            : formatDayRange(first, last);

    return `${parts.join(' ')} · ${days}`;
}
