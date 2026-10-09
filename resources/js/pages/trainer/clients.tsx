import { Head } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import PageHeading from '@/components/trainer/area/page-heading';
import ClientCard from '@/components/trainer/area/client-card';
import ClientList from '@/components/trainer/area/client-list';
import type { TrainerClient } from '@/types';

type ClientsProps = {
    clients: TrainerClient[];
};

export default function Clients({ clients }: ClientsProps) {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState(clients[0]?.id ?? null);
    // Notes edited in this page, by client id.
    const [notes, setNotes] = useState<Record<number, string>>({});

    const visible = clients.filter((client) =>
        client.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const selected = clients.find((client) => client.id === selectedId);

    return (
        <>
            <Head title="Clienti" />

            <PageHeading
                title="Clienti"
                description={
                    <span className="hidden md:inline">
                        {clients.length} clienti attivi
                    </span>
                }
                action={
                    <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-[3px] focus-within:ring-ring/50 md:w-auto md:min-w-65">
                        <Search
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                        />
                        <span className="sr-only">Cerca un cliente</span>
                        <input
                            type="search"
                            placeholder="Cerca per nome"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                        />
                    </label>
                }
            />

            <div className="flex flex-wrap items-start gap-5">
                <ClientList
                    clients={visible}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
                {selected && (
                    <ClientCard
                        key={selected.id}
                        client={selected}
                        note={notes[selected.id] ?? selected.note}
                        onNoteChange={(note) =>
                            setNotes({ ...notes, [selected.id]: note })
                        }
                    />
                )}
            </div>
        </>
    );
}

Clients.layout = { section: 'clients' };
