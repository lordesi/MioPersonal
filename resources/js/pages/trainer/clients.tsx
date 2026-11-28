import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AddClientDialog from '@/components/trainer/area/add-client-dialog';
import AddSessionDialog from '@/components/trainer/area/add-session-dialog';
import ClientsView from '@/components/trainer/clients/clients-view';
import type { ClientGroup } from '@/components/trainer/clients/clients-view';
import type { ClientsProps } from '@/components/trainer/clients/types';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';
import { useIsMobile } from '@/hooks/use-mobile';
import { romeParts } from '@/lib/calendar';
import { clients as clientsPage, messages } from '@/routes/trainer';
import type { TrainerClient } from '@/types';

/** The props a change of client reloads. */
const OPEN_PROPS = ['selectedId', 'selectedRecordId', 'trainerArea'];

/**
 * "Clienti" of the trainer: the grid of the clients and, in place, the card
 * of the one chosen (`?con=` or `?cliente=`). The chats are in the Inbox:
 * the old addresses with `?chat=1` go there.
 */
export default function Clients(props: ClientsProps) {
    const { clients, selectedRecordId, chat, sessionOptions, seriesServices } =
        props;
    const isMobile = useIsMobile();
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState<ClientGroup>('all');
    // "Nuova seduta" from the card of a client ("Prenota").
    const [booking, setBooking] = useState<TrainerClient | null>(null);
    // "Nuovo cliente" (the "+"): where its popover opens on desktop.
    const [adding, setAdding] = useState<PopoverAnchor | null>(null);
    const today = romeParts(new Date()).date;

    // The conversation of a client lives in the Inbox now.
    useEffect(() => {
        if (chat && selectedRecordId !== null) {
            router.visit(messages.url({ query: { con: selectedRecordId } }), {
                replace: true,
            });
        }
    }, [chat, selectedRecordId]);

    const selected =
        clients.find((client) => client.recordId === selectedRecordId) ?? null;

    const open = (client: TrainerClient | null) => {
        router.get(
            clientsPage.url({
                query: client === null ? {} : { con: client.recordId },
            }),
            {},
            {
                only: OPEN_PROPS,
                preserveState: true,
                preserveScroll: !isMobile,
            },
        );
    };

    return (
        <>
            <Head title={selected ? selected.name : 'Clienti'} />

            {sessionOptions && (
                <AddSessionDialog
                    open={booking !== null}
                    onOpenChange={(next) => !next && setBooking(null)}
                    options={sessionOptions}
                    date={today}
                    today={today}
                    clientId={booking?.recordId}
                />
            )}

            <AddClientDialog
                open={adding !== null}
                onOpenChange={(next) => !next && setAdding(null)}
                anchor={adding}
            />

            <ClientsView
                clients={clients}
                selected={selected}
                seriesServices={seriesServices}
                sessionOptions={sessionOptions}
                open={open}
                group={group}
                onGroup={setGroup}
                search={search}
                onSearch={setSearch}
                onAddClient={setAdding}
                onBook={setBooking}
                onChat={(client) =>
                    router.visit(
                        messages.url({ query: { con: client.recordId } }),
                    )
                }
            />
        </>
    );
}

Clients.layout = { section: 'clients' };
