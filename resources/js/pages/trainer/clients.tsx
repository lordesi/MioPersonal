import { Head } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '@/components/states/empty-state';
import ClientCard from '@/components/trainer/area/client-card';
import type { ClientFilter } from '@/components/trainer/area/client-filters';
import ClientFilters, {
    clientFilters,
} from '@/components/trainer/area/client-filters';
import ClientList from '@/components/trainer/area/client-list';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { sessionsLabel } from '@/lib/calendar';
import type { TrainerClient } from '@/types';

type ClientsProps = {
    clients: TrainerClient[];
    /** From "?cliente=37" (Panoramica, Calendario): the client to open first. */
    selectedId: number | null;
};

/** "Clienti" (docs/design/trainer-clienti.html): list on the left, card on the right. */
export default function Clients({
    clients,
    selectedId: initialId,
}: ClientsProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<ClientFilter>('all');
    const [selectedId, setSelectedId] = useState(
        initialId ?? clients[0]?.id ?? null,
    );

    const current =
        clientFilters.find((item) => item.value === filter) ?? clientFilters[0];
    const visible = clients
        .filter(current.matches)
        .filter((client) =>
            client.name.toLowerCase().includes(query.trim().toLowerCase()),
        );
    // The card follows the list: the first visible client when the selected one is hidden.
    const selected =
        visible.find((client) => client.id === selectedId) ?? visible[0];

    const active = clients.filter((client) => client.upcomingCount > 0).length;
    const upcoming = clients.reduce(
        (total, client) => total + client.upcomingCount,
        0,
    );

    const reset = () => {
        setQuery('');
        setFilter('all');
    };

    return (
        <>
            <Head title="Clienti" />

            <PageHeading
                title="Clienti"
                description={`${active === 1 ? '1 cliente attivo' : `${active} clienti attivi`} · ${upcoming === 0 ? 'nessuna seduta in programma' : `${sessionsLabel(upcoming)} in programma`}`}
                action={
                    clients.length > 0 && (
                        <label className="flex h-11.5 w-full items-center gap-2.5 rounded-xl border bg-card px-3.5 focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-foreground/10 md:w-80">
                            <Search
                                aria-hidden="true"
                                className="size-4.5 text-muted-foreground"
                            />
                            <span className="sr-only">
                                Cerca un cliente per nome
                            </span>
                            <input
                                type="search"
                                placeholder="Cerca per nome"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                            />
                        </label>
                    )
                }
            />

            {clients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Ancora nessun cliente"
                    description="I nuovi clienti compaiono qui dopo la prima richiesta che confermi."
                    bordered
                    className="rounded-[20px] bg-card"
                />
            ) : (
                <>
                    <ClientFilters
                        clients={clients}
                        value={filter}
                        onChange={setFilter}
                    />
                    <div className="flex flex-wrap items-start gap-5">
                        <ClientList
                            clients={visible}
                            selectedId={selected?.id ?? null}
                            onSelect={setSelectedId}
                            empty={
                                <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                                    <span className="text-[15px] leading-5.5 font-semibold">
                                        Nessun cliente trovato
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Prova con un altro nome o togli il
                                        filtro.
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={reset}
                                        className="mt-1.5 h-10 rounded-[10px]"
                                    >
                                        Mostra tutti
                                    </Button>
                                </div>
                            }
                        />
                        {selected && (
                            <ClientCard key={selected.id} client={selected} />
                        )}
                    </div>
                </>
            )}
        </>
    );
}

Clients.layout = { section: 'clients' };
