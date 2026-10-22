import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { romeParts } from '@/lib/calendar';
import { dateBlockParts, formatTimeSpan } from '@/lib/format';
import { cn } from '@/lib/utils';
import { calendar } from '@/routes/trainer';
import type { TrainerHandledRequest } from '@/types';

/** Badge and note of each outcome: a confirmed one needs no note. */
const OUTCOMES: Record<
    TrainerHandledRequest['answer'],
    { label: string; note: string | null }
> = {
    confirmed: { label: 'Confermata', note: null },
    declined: {
        label: 'Rifiutata',
        note: 'Rifiutata da te · slot di nuovo libero',
    },
    expired: { label: 'Annullata', note: 'Nessuna risposta in tempo' },
};

/**
 * A request of "Gestite" (docs/design): confirmed, declined, or expired
 * without an answer. Only a record: the answer cannot be taken back.
 */
export default function HandledRequestRow({
    request,
}: {
    request: TrainerHandledRequest;
}) {
    const date = dateBlockParts(request.start);
    const time = formatTimeSpan(request.start, request.hours);
    const confirmed = request.answer === 'confirmed';
    const outcome = OUTCOMES[request.answer];

    return (
        <article className="flex flex-wrap items-center gap-4 rounded-[20px] border bg-card px-4.5 py-4">
            <span
                className={cn(
                    'flex h-15 w-14 flex-none flex-col items-center justify-center rounded-2xl',
                    confirmed
                        ? 'bg-sidebar text-sidebar-foreground'
                        : 'bg-secondary text-foreground/70',
                )}
            >
                <span
                    className={cn(
                        'text-[10px] leading-3 font-bold tracking-[0.08em] uppercase',
                        confirmed && 'text-sidebar-foreground/70',
                    )}
                >
                    {date.weekday}
                </span>
                <span className="text-[22px] leading-6.5 font-bold tracking-[-0.02em] tabular-nums">
                    {date.day}
                </span>
            </span>

            <span className="flex min-w-60 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-base leading-5.5 font-bold tracking-[-0.01em]">
                        {request.clientName}
                    </span>
                    <span
                        className={cn(
                            'text-sm font-semibold tabular-nums',
                            !confirmed && 'text-foreground/70 line-through',
                        )}
                    >
                        {time}
                    </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] leading-4.5 text-foreground/70">
                    <span>{request.serviceType}</span>
                    {request.package && (
                        <span className="inline-flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="block h-1.5 w-18 overflow-hidden rounded-full bg-secondary"
                            >
                                <span
                                    className="block h-full rounded-full bg-foreground"
                                    style={{
                                        width: `${Math.round((request.package.position / request.package.total) * 100)}%`,
                                    }}
                                />
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">
                                Seduta {request.package.position} di{' '}
                                {request.package.total}
                            </span>
                        </span>
                    )}
                    {outcome.note && <span>{outcome.note}</span>}
                </span>
            </span>

            <span className="ml-auto flex items-center gap-2">
                <span
                    className={cn(
                        'inline-flex h-7.5 items-center rounded-full px-3 text-xs font-semibold',
                        confirmed
                            ? 'bg-sidebar text-sidebar-foreground'
                            : 'border border-input bg-card text-foreground/70',
                    )}
                >
                    {outcome.label}
                </span>
                {confirmed && (
                    <Link
                        href={calendar({
                            query: { giorno: romeParts(request.start).date },
                        })}
                        aria-label={`Apri nel calendario la seduta di ${date.weekday} ${date.day}, ${time}`}
                        title="Apri nel calendario"
                        className="flex size-9 items-center justify-center rounded-[10px] border bg-card hover:bg-secondary"
                    >
                        <Calendar aria-hidden="true" className="size-4" />
                    </Link>
                )}
            </span>
        </article>
    );
}
