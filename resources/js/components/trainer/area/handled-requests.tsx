import { useState } from 'react';
import HandledFilters from '@/components/trainer/area/handled-filters';
import type { HandledFilter } from '@/components/trainer/area/handled-filters';
import HandledRequestRow from '@/components/trainer/area/handled-request-row';
import HandledSummary from '@/components/trainer/area/handled-summary';
import { addDays, mondayOf, romeParts } from '@/lib/calendar';
import { formatDayRange } from '@/lib/format';
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

type HandledRequestsProps = {
    /** Answered or expired in the last 30 days. */
    handled: TrainerHandledRequest[];
    autoConfirm: boolean;
};

/** "Gestite" in "Richieste": the summary, the filters and the requests by week. */
export default function HandledRequests({
    handled,
    autoConfirm,
}: HandledRequestsProps) {
    const [filter, setFilter] = useState<HandledFilter>('all');

    if (handled.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-foreground/70">
                Qui trovi le richieste che hai confermato, rifiutato o che sono
                scadute senza risposta.
            </div>
        );
    }

    const count = (answer: TrainerHandledRequest['answer']) =>
        handled.filter((request) => request.answer === answer).length;
    const counts: Record<HandledFilter, number> = {
        all: handled.length,
        confirmed: count('confirmed'),
        expired: count('expired'),
        declined: count('declined'),
    };
    const groups = groupByWeek(
        filter === 'all'
            ? handled
            : handled.filter((request) => request.answer === filter),
    );

    return (
        <>
            <HandledSummary
                total={counts.all}
                confirmed={counts.confirmed}
                expired={counts.expired}
                declined={counts.declined}
                autoConfirm={autoConfirm}
            />

            <HandledFilters
                counts={counts}
                value={filter}
                onChange={setFilter}
            />

            {groups.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-foreground/70">
                    Nessuna richiesta con questo stato.
                </div>
            ) : (
                groups.map((group) => (
                    <section
                        key={group.monday}
                        aria-label={group.label}
                        className="flex flex-col gap-2.5"
                    >
                        <h2 className="mt-1.5 flex items-baseline justify-between gap-2 px-1 text-[13px] leading-4.5 font-semibold tracking-[0.04em] text-foreground/70 tabular-nums">
                            <span>{group.label}</span>
                            <span className="font-medium">{group.range}</span>
                        </h2>
                        {group.requests.map((request) => (
                            <HandledRequestRow
                                key={request.id}
                                request={request}
                            />
                        ))}
                    </section>
                ))
            )}
        </>
    );
}
