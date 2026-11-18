import type { ClientFilter } from '@/components/trainer/clients/types';
import { filterChipClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import type { ChatConversation, TrainerClient } from '@/types';

type Chats = Record<number, ChatConversation>;

/** The filters of "Clienti", from the messages to the sessions. */
export const clientFilters: {
    value: ClientFilter;
    label: string;
    matches: (client: TrainerClient, chats: Chats) => boolean;
}[] = [
    { value: 'all', label: 'Tutti', matches: () => true },
    {
        value: 'unread',
        label: 'Non letti',
        matches: (client, chats) => chats[client.recordId]?.unread === true,
    },
    {
        value: 'never',
        label: 'Mai scritto',
        matches: (client, chats) => neverWritten(client, chats),
    },
    {
        value: 'requests',
        label: 'Richieste',
        matches: (client) => client.hasRequest,
    },
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
    {
        value: 'inactive',
        label: 'Inattivi',
        matches: (client) => client.upcomingCount === 0 && client.sessions > 0,
    },
];

/** With an account and no message yet, from either side. */
export function neverWritten(client: TrainerClient, chats: Chats): boolean {
    return client.registered && chats[client.recordId]?.lastMessage == null;
}

/** The chips of the filters, with how many clients each one has. */
export default function FilterChips({
    clients,
    chats,
    value,
    onChange,
    className,
}: {
    clients: TrainerClient[];
    chats: Chats;
    value: ClientFilter;
    onChange: (value: ClientFilter) => void;
    className?: string;
}) {
    return (
        <div
            role="group"
            aria-label="Filtra i clienti"
            className={cn(
                'flex [scrollbar-width:none] gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden',
                className,
            )}
        >
            {clientFilters.map((filter) => {
                const count = clients.filter((client) =>
                    filter.matches(client, chats),
                ).length;
                const on = filter.value === value;

                if (count === 0 && filter.value !== 'all' && !on) {
                    return null;
                }

                return (
                    <button
                        key={filter.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(filter.value)}
                        className={filterChipClassName}
                    >
                        {filter.label}
                        <span
                            className={cn(
                                'tabular-nums',
                                on
                                    ? 'text-background'
                                    : filter.value === 'unread' ||
                                        filter.value === 'never'
                                      ? 'text-brand'
                                      : 'text-[#8a8a8a]',
                            )}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
