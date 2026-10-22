import { cn } from '@/lib/utils';
import type { TrainerHandledRequest } from '@/types';

export type HandledFilter = 'all' | TrainerHandledRequest['answer'];

/** The filters of "Gestite", in the order of the design. */
export const handledFilters: { value: HandledFilter; label: string }[] = [
    { value: 'all', label: 'Tutte' },
    { value: 'confirmed', label: 'Confermate' },
    { value: 'expired', label: 'Annullate' },
    { value: 'declined', label: 'Rifiutate' },
];

type HandledFiltersProps = {
    /** How many requests each filter keeps. */
    counts: Record<HandledFilter, number>;
    value: HandledFilter;
    onChange: (value: HandledFilter) => void;
};

/** Toggle buttons with their count; off when a filter would show nothing. */
export default function HandledFilters({
    counts,
    value,
    onChange,
}: HandledFiltersProps) {
    return (
        <div
            role="group"
            aria-label="Filtra per stato"
            className="flex flex-wrap gap-2"
        >
            {handledFilters.map((filter) => {
                const active = filter.value === value;

                return (
                    <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        disabled={!active && counts[filter.value] === 0}
                        onClick={() => onChange(filter.value)}
                        className={cn(
                            'inline-flex h-10 items-center gap-2 rounded-full border pr-2 pl-3.5 text-sm font-medium disabled:opacity-40',
                            active
                                ? 'border-foreground bg-foreground text-background'
                                : 'bg-card enabled:hover:bg-secondary',
                        )}
                    >
                        {filter.label}
                        <span
                            className={cn(
                                'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                                active
                                    ? 'bg-sidebar-border text-background'
                                    : 'bg-secondary',
                            )}
                        >
                            {counts[filter.value]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
