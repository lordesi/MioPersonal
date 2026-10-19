import { Link } from '@inertiajs/react';
import NoShowButton from '@/components/trainer/no-show-button';
import { Badge } from '@/components/ui/badge';
import { romeParts } from '@/lib/calendar';
import { formatDayLong, formatTimeRange } from '@/lib/format';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerPastSession } from '@/types';

/**
 * Finished sessions grouped by day, the most recent first: "Ultimi 7 giorni"
 * in "Le tue prenotazioni" and the page "Sedute passate". Each one is
 * "Effettuata" by itself; within 7 days the trainer can mark it "Saltata".
 */
export default function PastSessionList({
    sessions,
}: {
    sessions: TrainerPastSession[];
}) {
    return groupByDay(sessions).map(([date, daySessions]) => (
        <div key={date} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-muted-foreground">
                {formatDayLong(date)}
            </h3>
            <ul className="overflow-hidden rounded-[14px] border bg-card">
                {daySessions.map((session) => (
                    <li
                        key={session.id}
                        className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-4 py-3 last:border-b-0"
                    >
                        <span className="w-24 flex-none text-sm font-semibold tabular-nums">
                            {formatTimeRange(session.start, session.hours)}
                        </span>
                        {/* min-w-40: on phones the status goes on its own line. */}
                        <span className="flex min-w-40 flex-1 flex-col">
                            <span className="text-sm font-semibold">
                                {session.clientId === null ? (
                                    session.clientName
                                ) : (
                                    <Link
                                        href={showClient(session.clientId)}
                                        className="hover:underline"
                                    >
                                        {session.clientName}
                                    </Link>
                                )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {session.serviceName} · {session.placeLabel}
                            </span>
                        </span>
                        <span className="flex items-center gap-2">
                            {!(session.noShow && session.canChangeNoShow) && (
                                <SessionBadge noShow={session.noShow} />
                            )}
                            {session.canChangeNoShow && (
                                <NoShowButton session={session} />
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    ));
}

/** "Effettuata" or "Saltata". */
function SessionBadge({ noShow }: { noShow: boolean }) {
    return noShow ? (
        <Badge className="h-5.5 rounded-full border-transparent bg-muted px-2 text-xs font-semibold text-muted-foreground">
            Saltata
        </Badge>
    ) : (
        <Badge className="h-5.5 rounded-full border-border bg-transparent px-2 text-xs font-semibold text-foreground">
            Effettuata
        </Badge>
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
