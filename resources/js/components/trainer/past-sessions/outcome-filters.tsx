import { router } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { pastSessions } from '@/routes/trainer';
import type { PastSessionCounts, PastSessionFilter } from '@/types';

/** The filters in order, with their `?esito=` (none for "Tutte"). */
const FILTERS: { value: PastSessionFilter; label: string; esito?: string }[] = [
    { value: 'all', label: 'Tutte' },
    { value: 'done', label: 'Fatte', esito: 'effettuate' },
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
 * The filter of "Sedute passate" (design "Trainer · Sedute passate ·
 * nuovo"): "Tutte", "Fatte", "Saltate" with how many sessions each, in a
 * menu. The server filters every page (and the filter stays in the URL).
 */
export default function OutcomeFilters({
    current,
    counts,
}: {
    current: PastSessionFilter;
    counts: PastSessionCounts;
}) {
    const label =
        FILTERS.find((filter) => filter.value === current)?.label ?? 'Tutte';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Filtra sedute: ${label}`}
                className="flex h-12 min-w-33 shrink-0 items-center justify-between gap-3 rounded-[14px] bg-card pr-3.5 pl-4 text-[15px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {label}
                <ChevronDown aria-hidden="true" className="size-4.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-55 rounded-2xl border-0 bg-[#1c1e21] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            >
                <DropdownMenuRadioGroup
                    value={current}
                    onValueChange={(value) =>
                        router.get(
                            filterUrl(value as PastSessionFilter),
                            {},
                            { preserveScroll: true },
                        )
                    }
                >
                    {FILTERS.map((filter) => (
                        <DropdownMenuRadioItem
                            key={filter.value}
                            value={filter.value}
                            className="h-11 justify-between rounded-xl pr-3 text-[15px] font-semibold data-[state=checked]:bg-brand/12 data-[state=checked]:text-brand [&>span:first-child]:hidden"
                        >
                            {filter.label}
                            <span className="tabular-nums opacity-60">
                                {counts[filter.value]}
                            </span>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
