import { Head, router, usePoll } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AddSessionDialog from '@/components/trainer/area/add-session-dialog';
import AddClientDialog from '@/components/trainer/clients/add-client-dialog';
import ClientsDesktop from '@/components/trainer/clients/clients-desktop';
import ClientsMobile from '@/components/trainer/clients/clients-mobile';
import {
    clientFilters,
    neverWritten,
} from '@/components/trainer/clients/filters';
import type {
    ClientFilter,
    ClientsProps,
} from '@/components/trainer/clients/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { romeParts } from '@/lib/calendar';
import { LIST_POLL_MS } from '@/lib/chat';
import { clients as clientsPage } from '@/routes/trainer';
import {
    hide as hideToContact,
    restore as restoreToContact,
} from '@/routes/trainer/clients/to-contact';
import type { TrainerClient } from '@/types';

/** The props a change of client reloads. */
const OPEN_PROPS = [
    'selectedId',
    'selectedRecordId',
    'chat',
    'thread',
    'chats',
    'trainerArea',
];

/** "Ancora da contattare": saved on the account, the list reloads. */
const HIDE_OPTIONS = {
    only: ['clients'],
    preserveScroll: true,
    preserveState: true,
};

/**
 * "Clienti": the clients and their messages in one page (what "Clienti" and
 * "Messaggi" were). The card of a client and its conversation open in place.
 * Desktop and phones have two different drawings on the same data.
 */
export default function Clients(props: ClientsProps) {
    const {
        clients,
        chats,
        selectedRecordId,
        query,
        messageMatches,
        invite,
        sessionOptions,
    } = props;
    const isMobile = useIsMobile();
    const [search, setSearch] = useState(query);
    const [filter, setFilter] = useState<ClientFilter>('all');
    const [adding, setAdding] = useState(false);
    const [booking, setBooking] = useState<TrainerClient | null>(null);
    const today = romeParts(new Date()).date;

    // New messages and the unread dots, every 20 seconds.
    usePoll(LIST_POLL_MS, { only: ['chats', 'trainerArea'] });

    // The words are searched in the messages too, on the server, after a pause.
    useEffect(() => {
        const words = search.trim();

        if (words === query || (words.length < 2 && query === '')) {
            return;
        }

        const timer = window.setTimeout(() => {
            router.reload({
                data: { q: words.length < 2 ? undefined : words },
                only: ['query', 'messageMatches'],
            });
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search, query]);

    const visible = useMemo(() => {
        const current =
            clientFilters.find((item) => item.value === filter) ??
            clientFilters[0];
        const words = search.trim().toLowerCase();

        return clients
            .filter((client) => current.matches(client, chats))
            .filter(
                (client) =>
                    words === '' ||
                    client.name.toLowerCase().includes(words) ||
                    (query.toLowerCase() === words &&
                        messageMatches.includes(client.recordId)),
            );
    }, [clients, chats, filter, search, query, messageMatches]);

    // The client of the address; on desktop the first of the list otherwise.
    const chosen =
        clients.find((client) => client.recordId === selectedRecordId) ?? null;
    const selected = chosen ?? (isMobile ? null : (visible[0] ?? null));

    const open = (client: TrainerClient | null, chat = false) => {
        router.get(
            clientsPage.url({
                query:
                    client === null
                        ? {}
                        : {
                              con: client.recordId,
                              ...(chat ? { chat: 1 } : {}),
                          },
            }),
            {},
            {
                only: OPEN_PROPS,
                preserveState: true,
                preserveScroll: !isMobile,
            },
        );
    };

    const toContact = clients.filter(
        (client) => neverWritten(client, chats) && !client.contactHidden,
    );
    const hiddenCount = clients.filter(
        (client) => neverWritten(client, chats) && client.contactHidden,
    ).length;

    const view = {
        ...props,
        visible,
        filter,
        onFilter: setFilter,
        search,
        onSearch: setSearch,
        selected,
        open,
        onBook: setBooking,
        onAdd: () => setAdding(true),
        toContact,
        hiddenCount,
        onHide: (client: TrainerClient) =>
            router.post(hideToContact.url(client.recordId), {}, HIDE_OPTIONS),
        onRestore: () => router.delete(restoreToContact.url(), HIDE_OPTIONS),
    };

    return (
        <>
            <Head title="Clienti" />

            <AddClientDialog
                open={adding}
                onOpenChange={setAdding}
                invite={invite}
            />

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

            {isMobile ? (
                <ClientsMobile {...view} />
            ) : (
                <ClientsDesktop {...view} />
            )}
        </>
    );
}

Clients.layout = { section: 'clients', fill: true };
