import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

export type ClientFilter = 'all' | 'upcoming' | 'package' | 'inactive';

/** The filters of "Clienti", in the order of the design. */
export const clientFilters: {
    value: ClientFilter;
    label: string;
    matches: (client: TrainerClient) => boolean;
}[] = [
    { value: 'all', label: 'Tutti', matches: () => true },
    {
        value: 'upcoming',
        label: 'Con sedute in programma',
        matches: (client) => client.upcomingCount > 0,
    },
    {
        value: 'package',
        label: 'Con pacchetto',
        matches: (client) => client.package !== null,
    },
    // Nothing booked: they may need a message to come back.
    {
        value: 'inactive',
        label: 'Inattivi',
        matches: (client) => client.upcomingCount === 0,
    },
];

type ClientFiltersProps = {
    clients: TrainerClient[];
    value: ClientFilter;
    onChange: (value: ClientFilter) => void;
};

/** Toggle buttons with how many clients each filter keeps. */
export default function ClientFilters({
    clients,
    value,
    onChange,
}: ClientFiltersProps) {
    return (
        <div
            role="group"
            aria-label="Filtra clienti"
            className="flex flex-wrap gap-2"
        >
            {clientFilters.map((filter) => {
                const active = filter.value === value;

                return (
                    <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(filter.value)}
                        className={cn(
                            'inline-flex h-10 items-center gap-2 rounded-full border pr-2 pl-3.5 text-sm font-medium',
                            active
                                ? 'border-foreground bg-foreground text-background'
                                : 'bg-card hover:bg-secondary',
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
                            {clients.filter(filter.matches).length}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
