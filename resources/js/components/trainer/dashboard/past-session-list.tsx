import { Link } from '@inertiajs/react';
import { Clock, Lock } from 'lucide-react';
import UserAvatar from '@/components/shared/user-avatar';
import PackageCells from '@/components/trainer/dashboard/package-cells';
import SessionOutcomeToggle from '@/components/trainer/dashboard/session-outcome-toggle';
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
            <section
                key={date}
                aria-label={label}
                className="flex flex-col gap-2"
            >
                <h2 className="mt-1 flex items-baseline justify-between gap-2 px-1 text-sm font-bold">
                    <span>{label}</span>
                    <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
                        {sessionsLabel(daySessions.length)} ·{' '}
                        {hoursAmountLabel(hours)}
                    </span>
                </h2>
                <ul className="overflow-hidden rounded-[20px] border bg-card">
                    {daySessions.map((session) => (
                        <PastSessionRow key={session.id} session={session} />
                    ))}
                </ul>
            </section>
        );
    });
}

/**
 * Time, client, service and package, then "Effettuata | Saltata" while it can
 * be changed. A missed one has the time greyed out and struck through.
 */
function PastSessionRow({ session }: { session: TrainerPastSession }) {
    const missed = session.noShow;

    return (
        <li className="flex flex-wrap items-center gap-x-4.5 gap-y-3.5 border-t px-4.5 py-4 first:border-t-0 hover:bg-muted/40">
            <span
                className={cn(
                    'flex h-14 w-16 flex-none flex-col items-center justify-center rounded-[14px] tabular-nums',
                    missed
                        ? 'bg-secondary text-muted-foreground line-through'
                        : 'bg-primary text-primary-foreground',
                )}
            >
                <span className="text-[15px] leading-5 font-bold">
                    {formatTime(session.start)}
                </span>
                <span
                    className={cn(
                        'text-xs leading-4',
                        missed
                            ? 'text-muted-foreground'
                            : 'text-primary-foreground/60',
                    )}
                >
                    {formatTime(addHours(session.start, session.hours))}
                </span>
            </span>

            <span className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
                <UserAvatar
                    name={session.clientName}
                    className="size-9.5 text-xs font-bold"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.25">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="text-[15px] leading-5.5 font-semibold">
                            {session.clientId === null ? (
                                session.clientName
                            ) : (
                                <Link
                                    href={clients({
                                        query: { cliente: session.clientId },
                                    })}
                                    className="hover:underline"
                                >
                                    {session.clientName}
                                </Link>
                            )}
                        </span>
                        <span
                            className={cn(
                                'inline-flex h-5.5 items-center rounded-full px-2 text-[11px] leading-3.5 font-bold',
                                missed
                                    ? 'border border-input text-muted-foreground'
                                    : 'bg-secondary text-foreground',
                            )}
                        >
                            {missed ? 'Saltata' : 'Effettuata'}
                        </span>
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {session.serviceName}
                    </span>
                    {/* Above 20 the cells would be too thin (as in PackageProgress). */}
                    {session.package && session.package.total <= 20 && (
                        <PackageCells
                            position={session.package.position}
                            total={session.package.total}
                            missed={missed}
                            className="max-w-50"
                        />
                    )}
                </span>
            </span>

            <span className="ml-auto flex flex-none flex-col items-end gap-1.5">
                {session.canChangeNoShow && (
                    <SessionOutcomeToggle session={session} className="w-59" />
                )}
                <span className="inline-flex items-center gap-1.5 text-xs leading-4 text-muted-foreground tabular-nums">
                    {session.canChangeNoShow ? (
                        <>
                            <Clock aria-hidden="true" className="size-3" />
                            Modificabile fino a{' '}
                            {formatDayShort(session.noShowUntil).toLowerCase()}
                        </>
                    ) : (
                        <>
                            <Lock aria-hidden="true" className="size-3" />
                            Non più modificabile
                        </>
                    )}
                </span>
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
