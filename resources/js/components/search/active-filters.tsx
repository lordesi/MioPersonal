import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActiveChip = {
    /** Unique name of the filter, e.g. "prezzo". */
    name: string;
    /** The chosen value as on screen, e.g. "35–45 €". */
    label: string;
    onClear: () => void;
};

type ActiveFiltersProps = {
    chips: ActiveChip[];
    onClearAll: () => void;
    className?: string;
};

/** "Filtri attivi:" with one ✕ per filter and "Cancella tutto". Hidden without filters. */
export default function ActiveFilters({
    chips,
    onClearAll,
    className,
}: ActiveFiltersProps) {
    if (chips.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
            <span className="mr-0.5 text-[13px] text-muted-foreground">
                Filtri attivi:
            </span>
            {chips.map((chip) => (
                <span
                    key={chip.name}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-primary pr-1 pl-3 text-[13px] font-medium text-primary-foreground"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={chip.onClear}
                        aria-label={`Rimuovi filtro ${chip.label}`}
                        className="flex size-6.5 items-center justify-center rounded-full outline-none hover:bg-primary-foreground/15 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <X
                            aria-hidden="true"
                            strokeWidth={2.5}
                            className="size-3.5"
                        />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onClearAll}
                className="h-8 rounded-md px-2 text-[13px] font-semibold underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                Cancella tutto
            </button>
        </div>
    );
}
