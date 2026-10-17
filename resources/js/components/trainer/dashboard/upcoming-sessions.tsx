import { Link } from '@inertiajs/react';
import { useId } from 'react';
import { romeParts } from '@/lib/calendar';
import { formatDayLong, formatTimeRange } from '@/lib/format';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerTodaySession } from '@/types';

/**
 * "Prossime prenotazioni" in "Oggi": every confirmed session from tomorrow
 * on, grouped by day.
 */
export default function UpcomingSessions({
    sessions,
}: {
    sessions: TrainerTodaySession[];
}) {
    const titleId = useId();
    const days = groupByDay(sessions);

    return (
        <section
            id="prossime"
            aria-labelledby={titleId}
            className="flex scroll-mt-4 flex-col gap-2 md:gap-2.5"
        >
            <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight tabular-nums md:text-xl"
            >
                Prossime prenotazioni
                {sessions.length > 0 && (
                    <span className="font-medium text-muted-foreground">
                        {' '}
                        · {sessions.length}
                    </span>
                )}
            </h2>

            {days.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    Nessuna prenotazione in arrivo.
                </p>
            )}

            {days.map(([date, daySessions]) => (
                <div key={date} className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                        {formatDayLong(date)}
                    </h3>
                    <ul className="overflow-hidden rounded-xl border bg-card">
                        {daySessions.map((session) => (
                            <li
                                key={session.id}
                                className="flex gap-3.5 border-b px-4 py-3 last:border-b-0"
                            >
                                <span className="w-24 flex-none text-sm font-semibold tabular-nums">
                                    {formatTimeRange(
                                        session.start,
                                        session.hours,
                                    )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold">
                                        {session.clientId === null ? (
                                            session.clientName
                                        ) : (
                                            <Link
                                                href={showClient(
                                                    session.clientId,
                                                )}
                                                className="hover:underline"
                                            >
                                                {session.clientName}
                                            </Link>
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {session.serviceName} ·{' '}
                                        {session.placeLabel}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}

/** The sessions (already in order) grouped by Rome day: [["2026-10-16", […]], …] */
function groupByDay(
    sessions: TrainerTodaySession[],
): [string, TrainerTodaySession[]][] {
    const days = new Map<string, TrainerTodaySession[]>();

    for (const session of sessions) {
        const date = romeParts(session.start).date;
        days.set(date, [...(days.get(date) ?? []), session]);
    }

    return [...days];
}
