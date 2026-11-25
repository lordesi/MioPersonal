import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import SessionOutcomeToggle from '@/components/trainer/dashboard/session-outcome-toggle';
import { Initials } from '@/components/trainer/ui/bits';
import { hoursAmountLabel, romeParts, sessionsLabel } from '@/lib/calendar';
import {
    addHours,
    formatDayLong,
    formatDayShort,
    formatTime,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { clients } from '@/routes/trainer';
import type { TrainerPastSession } from '@/types';

/**
 * Finished sessions grouped by day, the most recent first: the page "Sedute
 * passate" ("Ultimi 7 giorni" of Panoramica has its cards, PastWeekSessions).
 * Each one is "Effettuata" by itself; within 7 days the trainer can mark it "Saltata".
 */
export default function PastSessionList({
    sessions,
}: {
    sessions: TrainerPastSession[];
}) {
    return groupByDay(sessions).map(([date, daySessions]) => {
        const label = formatDayLong(date);
        const hours = daySessions.reduce((sum, s) => sum + s.hours, 0);

        return (
            <section key={date} aria-label={label} className="flex flex-col">
                <h2 className="flex items-baseline justify-between gap-2 pt-3 text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase">
                    <span>{label}</span>
                    <span className="normal-case tabular-nums">
                        {sessionsLabel(daySessions.length)} ·{' '}
                        {hoursAmountLabel(hours)}
                    </span>
                </h2>
                <ul>
                    {daySessions.map((session) => (
                        <PastSessionRow key={session.id} session={session} />
                    ))}
                </ul>
            </section>
        );
    });
}

/**
 * The time, the client, the service and the package, then "Fatta | Saltata"
 * while it can be changed. A missed one has the time struck through.
 */
function PastSessionRow({ session }: { session: TrainerPastSession }) {
    const missed = session.noShow;
    const position = session.package
        ? ` · seduta ${session.package.position} di ${session.package.total}`
        : '';

    return (
        <li className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-separator py-3.5">
            <span
                className={cn(
                    'flex w-12 flex-none flex-col tabular-nums',
                    missed && 'text-muted-foreground line-through',
                )}
            >
                <b className="text-base leading-5 font-bold">
                    {formatTime(session.start)}
                </b>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {formatTime(addHours(session.start, session.hours))}
                </span>
            </span>

            <span className="flex min-w-0 flex-[1_1_180px] items-center gap-3">
                <Initials name={session.clientName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="truncate text-base leading-5.5 font-semibold">
                        {session.clientId === null ? (
                            session.clientName
                        ) : (
                            <Link
                                href={clients({
                                    query: { cliente: session.clientId },
                                })}
                                className="outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {session.clientName}
                            </Link>
                        )}
                    </b>
                    <span className="truncate text-sm leading-5 text-muted-foreground">
                        {session.serviceName}
                        {position}
                    </span>
                </span>
            </span>

            <span className="ml-auto flex flex-none flex-col items-end gap-1">
                {session.canChangeNoShow ? (
                    <>
                        <SessionOutcomeToggle session={session} />
                        <span className="text-[11px] leading-3.5 text-muted-foreground tabular-nums">
                            Fino a{' '}
                            {formatDayShort(session.noShowUntil).toLowerCase()}
                        </span>
                    </>
                ) : (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-semibold text-muted-foreground">
                        <Lock aria-hidden="true" className="size-3" />
                        {missed ? 'Saltata' : 'Fatta'}
                    </span>
                )}
            </span>
        </li>
    );
}

/** The sessions (already in order) grouped by Rome day: [["2026-10-16", […]], …] */
function groupByDay(
    sessions: TrainerPastSession[],
): [string, TrainerPastSession[]][] {
    const days = new Map<string, TrainerPastSession[]>();

    for (const session of sessions) {
        const date = romeParts(session.start).date;
        days.set(date, [...(days.get(date) ?? []), session]);
    }

    return [...days];
}
