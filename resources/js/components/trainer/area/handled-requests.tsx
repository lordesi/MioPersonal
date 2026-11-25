import { AreaBadge } from '@/components/mp/area-bits';
import type { BadgeTone } from '@/components/mp/area-bits';
import { addDays, mondayOf, romeParts } from '@/lib/calendar';
import { dateBlockParts, formatDayRange, formatTimeSpan } from '@/lib/format';
import type { TrainerHandledRequest } from '@/types';

type WeekGroup = {
    monday: string;
    label: string;
    /** "19 – 25 ottobre" */
    range: string;
    requests: TrainerHandledRequest[];
};

/** Weeks from this one: 0 → "Questa settimana", -1 → "Settimana scorsa"… */
function weekLabel(offset: number): string {
    if (offset === 0) {
        return 'Questa settimana';
    }

    if (offset === -1) {
        return 'Settimana scorsa';
    }

    if (offset === 1) {
        return 'Prossima settimana';
    }

    return offset < 0 ? `${-offset} settimane fa` : `Tra ${offset} settimane`;
}

/**
 * The requests by week of the session (Monday to Sunday, in Rome), the
 * latest week on top and the latest session on top of each week.
 */
function groupByWeek(requests: TrainerHandledRequest[]): WeekGroup[] {
    const thisMonday = mondayOf(romeParts(new Date()).date);
    const groups = new Map<string, TrainerHandledRequest[]>();

    for (const request of requests) {
        const monday = mondayOf(romeParts(request.start).date);
        groups.set(monday, [...(groups.get(monday) ?? []), request]);
    }

    return [...groups.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monday, items]) => ({
            monday,
            label: weekLabel(
                Math.round(
                    (Date.parse(monday) - Date.parse(thisMonday)) /
                        (7 * 24 * 60 * 60 * 1000),
                ),
            ),
            range: formatDayRange(monday, addDays(monday, 6)),
            // ISO UTC strings: sorted as text, they are sorted by time.
            requests: items.sort((a, b) => b.start.localeCompare(a.start)),
        }));
}

const OUTCOMES: Record<
    TrainerHandledRequest['answer'],
    { label: string; tone: BadgeTone }
> = {
    confirmed: { label: 'Confermata', tone: 'neutral' },
    declined: { label: 'Rifiutata', tone: 'destructive' },
    expired: { label: 'Scaduta', tone: 'warning' },
};

/**
 * "Gestite" in "Richieste" (design "Trainer · Richieste · nuovo"): the
 * requests answered or expired, by week, each with the day, the client,
 * the service and the outcome.
 */
export default function HandledRequests({
    handled,
}: {
    /** Answered or expired in the last 30 days. */
    handled: TrainerHandledRequest[];
}) {
    if (handled.length === 0) {
        return (
            <p className="rounded-[24px] bg-card px-4 py-6 text-[15px] text-muted-foreground">
                Nessuna richiesta gestita negli ultimi 30 giorni.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {groupByWeek(handled).map((group) => (
                <section
                    key={group.monday}
                    aria-label={`${group.label}, ${group.range}`}
                    className="flex flex-col"
                >
                    <h2 className="flex items-baseline justify-between gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase tabular-nums">
                        <span>{group.label}</span>
                        <span className="normal-case">{group.range}</span>
                    </h2>
                    <ul>
                        {group.requests.map((request) => {
                            const date = dateBlockParts(request.start);
                            const outcome = OUTCOMES[request.answer];

                            return (
                                <li
                                    key={request.id}
                                    className="flex min-h-16 items-center gap-3.5 border-b border-separator py-3.5"
                                >
                                    <span className="flex w-11 shrink-0 flex-col items-center">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            {date.weekday}
                                        </span>
                                        <b className="text-[22px] leading-6.5 font-bold tabular-nums">
                                            {date.day}
                                        </b>
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <b className="truncate text-[17px] leading-5.5 font-semibold">
                                            {request.clientName}
                                        </b>
                                        <span className="truncate text-[15px] leading-5 text-muted-foreground tabular-nums">
                                            {request.serviceType} ·{' '}
                                            {formatTimeSpan(
                                                request.start,
                                                request.hours,
                                            )}
                                        </span>
                                    </span>
                                    <AreaBadge tone={outcome.tone}>
                                        {outcome.label}
                                    </AreaBadge>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}
