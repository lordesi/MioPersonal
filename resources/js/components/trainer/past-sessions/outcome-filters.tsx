import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { pastSessions } from '@/routes/trainer';
import type { PastSessionCounts, PastSessionFilter } from '@/types';

/** The filters in order, with their `?esito=` (none for "Tutte"). */
const FILTERS: { value: PastSessionFilter; label: string; esito?: string }[] = [
    { value: 'all', label: 'Tutte' },
    { value: 'done', label: 'Effettuate', esito: 'effettuate' },
    { value: 'missed', label: 'Saltate', esito: 'saltate' },
];

/** "/trainer/sedute-passate?esito=saltate&pagina=2": a page of a filter (the first without `pagina`). */
export function filterUrl(filter: PastSessionFilter, pagina?: number): string {
    const esito = FILTERS.find((item) => item.value === filter)?.esito;

    return pastSessions.url({
        query: { ...(esito && { esito }), ...(pagina && { pagina }) },
    });
}

/**
 * "Tutte", "Effettuate", "Saltate" with how many sessions each: links, so the
 * server filters every page (and the filter stays in the URL).
 */
export default function OutcomeFilters({
    current,
    counts,
}: {
    current: PastSessionFilter;
    counts: PastSessionCounts;
}) {
    return (
        <nav aria-label="Filtra per esito" className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
                const active = filter.value === current;

                return (
                    <Link
                        key={filter.value}
                        href={filterUrl(filter.value)}
                        preserveScroll
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'inline-flex h-9.5 items-center gap-2 rounded-full border py-0 pr-1.5 pl-3.5 text-sm font-medium',
                            active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'bg-card text-foreground hover:bg-secondary',
                        )}
                    >
                        {filter.label}
                        <span
                            className={cn(
                                'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.75 text-xs font-bold tabular-nums',
                                active
                                    ? 'bg-primary-foreground text-primary'
                                    : 'bg-secondary text-muted-foreground',
                            )}
                        >
                            {counts[filter.value]}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
