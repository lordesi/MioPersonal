import { ChevronLeft, ChevronRight, Plus, Search, Users } from 'lucide-react';
import ClientChat from '@/components/trainer/clients/client-chat';
import ClientDetail from '@/components/trainer/clients/client-detail';
import FilterChips from '@/components/trainer/clients/filters';
import {
    previewOf,
    statusOf,
    whenOf,
} from '@/components/trainer/clients/labels';
import ToContact from '@/components/trainer/clients/to-contact';
import type { ClientsViewProps } from '@/components/trainer/clients/types';
import { Initials } from '@/components/trainer/ui/bits';
import {
    brandButtonClassName,
    pageTitleClassName,
    pressableRowClassName,
    roundOutlineClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';

/**
 * "Clienti" on phones, one screen at a time: the list with the last
 * messages (Clienti Filtri 1), the card of a client (Scheda 1) and the
 * conversation (Chat 2). The address keeps the screen: "Indietro" works.
 */
export default function ClientsMobile(props: ClientsViewProps) {
    const {
        clients,
        chats,
        thread,
        chat,
        seriesServices,
        sessionOptions,
        visible,
        filter,
        onFilter,
        search,
        onSearch,
        selected,
        selectedRecordId,
        open,
        onBook,
        onAdd,
        toContact,
        hiddenCount,
        onHide,
        onRestore,
    } = props;
    const now = new Date();

    // The conversation, full screen, with its own "Indietro".
    if (selected && chat && thread) {
        return (
            <div className="-mx-4 -mt-3 -mb-28 flex h-[calc(100dvh-6.5rem)] flex-col">
                <ClientChat thread={thread} clientId={selected.id} />
            </div>
        );
    }

    // The card of the client chosen in the address.
    if (selected && selectedRecordId !== null) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => open(null)}
                    aria-label="Torna ai clienti"
                    className={cn(roundOutlineClassName, 'border-white/35')}
                >
                    <ChevronLeft aria-hidden="true" className="size-5.5" />
                </button>
                <ClientDetail
                    key={selected.recordId}
                    client={selected}
                    seriesServices={seriesServices}
                    onChat={() => open(selected, true)}
                    onBook={sessionOptions ? () => onBook(selected) : null}
                    size="lg"
                />
            </>
        );
    }

    return (
        <>
            <header className="flex min-h-13 items-center gap-3">
                <div className="mr-auto flex flex-col">
                    <h1 className={pageTitleClassName}>Clienti</h1>
                    <span className="text-[13px] text-muted-foreground">
                        {clients.length === 1
                            ? '1 cliente'
                            : `${clients.length} clienti`}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    aria-label="Aggiungi cliente"
                    className={cn(brandButtonClassName, 'size-11 px-0')}
                >
                    <Plus
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={2.5}
                    />
                </button>
            </header>

            <label className="-mt-2 flex h-12.5 items-center gap-2.5 rounded-2xl bg-card px-4 text-[#8a8a8a] focus-within:ring-[3px] focus-within:ring-ring/50">
                <Search aria-hidden="true" className="size-5" />
                <span className="sr-only">Cerca cliente o messaggio</span>
                <input
                    type="search"
                    inputMode="search"
                    autoComplete="off"
                    placeholder="Cerca cliente o messaggio"
                    value={search}
                    onChange={(event) => onSearch(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-[#8a8a8a]"
                />
            </label>

            <FilterChips
                clients={clients}
                chats={chats}
                value={filter}
                onChange={onFilter}
                className="-mx-4 -mt-2 px-4"
            />

            {filter === 'all' && search === '' && (
                <ToContact
                    clients={toContact}
                    hiddenCount={hiddenCount}
                    onWrite={(client) => open(client, true)}
                    onOpen={(client) => open(client)}
                    onHide={onHide}
                    onRestore={onRestore}
                    variant="cards"
                />
            )}

            {clients.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[26px] bg-[#121212] px-6 py-12 text-center shadow-[inset_0_0_0_1px_#2c2c2c]">
                    <span className="flex size-13 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Users aria-hidden="true" className="size-6" />
                    </span>
                    <span className="text-lg font-semibold">
                        Ancora nessun cliente
                    </span>
                    <span className="text-[15px] text-muted-foreground">
                        Chi prenota da te compare qui da solo. Aggiungi i
                        clienti che hai già con il tuo link personale.
                    </span>
                </div>
            ) : visible.length === 0 ? (
                <p className="py-6 text-center text-[15px] text-muted-foreground">
                    Nessun cliente in questo filtro.
                </p>
            ) : (
                <div className="overflow-hidden rounded-[20px] bg-[#121212] shadow-[inset_0_0_0_1px_#2c2c2c]">
                    {visible.map((client, index) => {
                        const conversation = chats[client.recordId];
                        const unread = conversation?.unread === true;
                        const status = statusOf(client);
                        const preview = previewOf(client, conversation);
                        const subtitle = preview.empty
                            ? status.text
                            : preview.text;

                        return (
                            <button
                                key={client.recordId}
                                type="button"
                                onClick={() => open(client)}
                                className={cn(
                                    'flex min-h-16 w-full items-center gap-3 px-3.5 py-2.5 text-left',
                                    pressableRowClassName,
                                    index < visible.length - 1 &&
                                        'shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.08)]',
                                )}
                            >
                                <Initials
                                    name={client.name}
                                    size={44}
                                    tone={
                                        !client.registered
                                            ? 'outline'
                                            : status.tone === 'muted'
                                              ? 'muted'
                                              : undefined
                                    }
                                    className={
                                        unread
                                            ? 'shadow-[0_0_0_2px_#121212,0_0_0_4px_#42d7d9]'
                                            : undefined
                                    }
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'min-w-0 flex-1 truncate text-base',
                                                unread
                                                    ? 'font-bold'
                                                    : 'font-semibold',
                                                status.tone === 'muted' &&
                                                    'text-muted-foreground',
                                            )}
                                        >
                                            {client.name}
                                        </span>
                                        <span
                                            className={cn(
                                                'shrink-0 text-xs tabular-nums',
                                                unread
                                                    ? 'font-semibold text-brand'
                                                    : 'text-[#8a8a8a]',
                                            )}
                                        >
                                            {whenOf(conversation, now)}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'min-w-0 flex-1 truncate text-[13px]',
                                                unread
                                                    ? 'text-foreground'
                                                    : status.tone === 'brand' &&
                                                        preview.empty
                                                      ? 'text-brand'
                                                      : 'text-[#8a8a8a]',
                                            )}
                                        >
                                            {subtitle}
                                        </span>
                                        {unread && (
                                            <span
                                                className="size-2.5 shrink-0 rounded-full bg-brand"
                                                aria-label="Messaggi da leggere"
                                            />
                                        )}
                                    </span>
                                </span>
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4.5 shrink-0 text-[#707070]"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}
