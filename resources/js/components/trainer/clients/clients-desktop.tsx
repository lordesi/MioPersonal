import {
    BookUser,
    MessageCircle,
    Plus,
    Search,
    UserRound,
    Users,
} from 'lucide-react';
import ClientChat from '@/components/trainer/clients/client-chat';
import ClientDetail from '@/components/trainer/clients/client-detail';
import ClientRubrica from '@/components/trainer/clients/client-rubrica';
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
    filterChipClassName,
    pageTitleClassName,
    panelClassName,
    pressableRowClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';

/** The columns of the table: client, package or state, last message, when. */
const COLUMNS =
    'grid-cols-[minmax(200px,1.3fr)_minmax(140px,0.8fr)_minmax(200px,2fr)_72px]';

/** With the conversation open: no "Pacchetto o stato". */
const COLUMNS_NARROW = 'grid-cols-[minmax(160px,1fr)_minmax(140px,1.6fr)_64px]';

/**
 * "Clienti" on desktop (Clienti B and Messaggi A). On the left two views:
 * "Chat", the list with the last message of each client, and "Rubrica",
 * every client A–Z with "Ancora da contattare" on top. On the right the card
 * of the client or the conversation ("Scheda" · "Chat"), wider for the chat.
 */
export default function ClientsDesktop(props: ClientsViewProps) {
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
        open,
        onBook,
        onAdd,
        toContact,
        hiddenCount,
        onHide,
        onRestore,
        messageMatches,
        view,
        onView,
    } = props;
    const now = new Date();
    // The conversation open: the panel on the right grows, the table loses a column.
    const wide = Boolean(selected?.registered && chat && thread);
    const columns = wide ? COLUMNS_NARROW : COLUMNS;

    return (
        <div className="flex h-full min-h-0 gap-4">
            <section
                aria-label="Rubrica"
                className="flex min-w-0 flex-1 flex-col gap-4"
            >
                <header className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="mr-auto flex flex-col gap-0.5">
                        <h1 className={pageTitleClassName}>Clienti</h1>
                        <span className="text-[15px] text-muted-foreground">
                            {clients.length === 1
                                ? '1 cliente'
                                : `${clients.length} clienti`}
                        </span>
                    </div>
                    <label className="flex h-11 w-85 max-w-full items-center gap-2 rounded-full bg-card px-3.5 text-[#8a8a8a] focus-within:ring-[3px] focus-within:ring-ring/50">
                        <Search aria-hidden="true" className="size-4.5" />
                        <span className="sr-only">
                            Cerca cliente o messaggio
                        </span>
                        <input
                            type="search"
                            autoComplete="off"
                            placeholder="Cerca cliente o messaggio"
                            value={search}
                            onChange={(event) => onSearch(event.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-[#8a8a8a]"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={onAdd}
                        className={brandButtonClassName}
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-4.5"
                            strokeWidth={2.5}
                        />
                        Aggiungi cliente
                    </button>
                </header>

                <div
                    className={cn(
                        panelClassName,
                        'flex min-h-0 flex-1 flex-col overflow-hidden',
                    )}
                >
                    <div className="border-b border-border px-3 pt-3 pb-2">
                        <FilterChips
                            clients={clients}
                            chats={chats}
                            value={filter}
                            onChange={onFilter}
                            exclude={['all', 'inactive']}
                            leading={(
                                [
                                    ['chat', 'Chat', MessageCircle],
                                    ['rubrica', 'Rubrica', BookUser],
                                ] as const
                            ).map(([value, label, Icon]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={view === value}
                                    onClick={() => onView(value)}
                                    className={filterChipClassName}
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    {label}
                                </button>
                            ))}
                        />
                    </div>
                    {view === 'rubrica' ? (
                        <div className="flex min-h-0 flex-1 [scrollbar-width:none] flex-col gap-3 overflow-y-auto px-3 pt-3 pb-3">
                            {clients.length === 0 ? (
                                <Empty onAdd={onAdd} />
                            ) : (
                                <>
                                    {filter === 'all' && search === '' && (
                                        <ToContact
                                            clients={toContact}
                                            hiddenCount={hiddenCount}
                                            onWrite={(client) =>
                                                open(client, true)
                                            }
                                            onOpen={(client) => open(client)}
                                            onHide={onHide}
                                            onRestore={onRestore}
                                            variant="rows"
                                            limit={3}
                                        />
                                    )}
                                    <ClientRubrica
                                        clients={visible}
                                        chats={chats}
                                        onOpen={(client) => open(client)}
                                        selectedId={selected?.recordId}
                                        size="sm"
                                    />
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div
                                aria-hidden="true"
                                className={cn(
                                    'grid gap-4 px-7 pt-2.5 pb-1.5 text-xs font-semibold text-[#8a8a8a]',
                                    columns,
                                )}
                            >
                                <span>CLIENTE</span>
                                {!wide && <span>PACCHETTO O STATO</span>}
                                <span>ULTIMO MESSAGGIO</span>
                                <span className="text-right">QUANDO</span>
                            </div>
                            <div className="flex min-h-0 flex-1 [scrollbar-width:none] flex-col gap-0.5 overflow-y-auto px-3 pb-3">
                                {clients.length === 0 ? (
                                    <Empty onAdd={onAdd} />
                                ) : visible.length === 0 ? (
                                    <p className="my-6 text-center text-[15px] text-muted-foreground">
                                        Nessun cliente in questo filtro.
                                    </p>
                                ) : (
                                    visible.map((client) => {
                                        const conversation =
                                            chats[client.recordId];
                                        const unread =
                                            conversation?.unread === true;
                                        const status = statusOf(client);
                                        const preview = previewOf(
                                            client,
                                            conversation,
                                        );
                                        const matched = messageMatches.includes(
                                            client.recordId,
                                        );
                                        const current =
                                            selected?.recordId ===
                                            client.recordId;

                                        return (
                                            <button
                                                key={client.recordId}
                                                type="button"
                                                onClick={() => open(client)}
                                                aria-current={current}
                                                className={cn(
                                                    'grid items-center gap-4 rounded-[14px] px-4 py-2.5 text-left',
                                                    columns,
                                                    pressableRowClassName,
                                                    current && 'bg-brand-soft',
                                                )}
                                            >
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <Initials
                                                        name={client.name}
                                                        size={36}
                                                        tone={
                                                            !client.registered
                                                                ? 'outline'
                                                                : status.tone ===
                                                                    'muted'
                                                                  ? 'muted'
                                                                  : undefined
                                                        }
                                                    />
                                                    <span
                                                        className={cn(
                                                            'truncate text-[15px]',
                                                            unread
                                                                ? 'font-bold'
                                                                : 'font-semibold',
                                                            status.tone ===
                                                                'muted' &&
                                                                'text-muted-foreground',
                                                        )}
                                                    >
                                                        {client.name}
                                                    </span>
                                                </span>
                                                {!wide && (
                                                    <span
                                                        className={cn(
                                                            'truncate text-[13px]',
                                                            status.tone ===
                                                                'brand'
                                                                ? 'text-brand'
                                                                : status.tone ===
                                                                    'muted'
                                                                  ? 'text-[#8a8a8a]'
                                                                  : 'text-[#d4d4d4]',
                                                        )}
                                                    >
                                                        {status.text}
                                                    </span>
                                                )}
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'truncate text-[13px]',
                                                            preview.empty
                                                                ? 'text-[#707070] italic'
                                                                : unread
                                                                  ? 'text-foreground'
                                                                  : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {matched &&
                                                            !preview.empty && (
                                                                <MessageCircle
                                                                    aria-label="Trovato nei messaggi"
                                                                    className="mr-1 inline size-3.5 text-brand"
                                                                />
                                                            )}
                                                        {preview.text}
                                                    </span>
                                                    {unread && (
                                                        <span
                                                            className="size-2.5 shrink-0 rounded-full bg-brand"
                                                            aria-label="Messaggi da leggere"
                                                        />
                                                    )}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-right text-xs tabular-nums',
                                                        unread
                                                            ? 'font-semibold text-brand'
                                                            : 'text-[#8a8a8a]',
                                                    )}
                                                >
                                                    {whenOf(conversation, now)}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>

            <aside
                aria-label={chat ? 'Conversazione' : 'Scheda cliente'}
                className={cn(
                    panelClassName,
                    'flex shrink-0 flex-col gap-4 overflow-hidden p-5 transition-[width] duration-300 motion-reduce:transition-none',
                    wide ? 'w-[min(760px,58%)]' : 'w-110',
                )}
            >
                {selected ? (
                    <>
                        {selected.registered && (
                            <div
                                role="tablist"
                                aria-label="Scheda o chat"
                                className="grid shrink-0 grid-cols-2 rounded-full bg-card p-1"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={!chat}
                                    onClick={() => open(selected)}
                                    className={cn(
                                        'flex h-9 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                        !chat
                                            ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Scheda
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={chat}
                                    onClick={() => open(selected, true)}
                                    className={cn(
                                        'flex h-9 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                        chat
                                            ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <MessageCircle
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Chat
                                    {chats[selected.recordId]?.unread && (
                                        <span
                                            className="size-2 rounded-full bg-brand"
                                            aria-label="da leggere"
                                        />
                                    )}
                                </button>
                            </div>
                        )}
                        {chat && thread ? (
                            <ClientChat
                                thread={thread}
                                clientId={selected.id}
                            />
                        ) : (
                            <div className="-mx-1 flex min-h-0 flex-1 [scrollbar-width:none] flex-col overflow-y-auto px-1">
                                <ClientDetail
                                    key={selected.recordId}
                                    client={selected}
                                    seriesServices={seriesServices}
                                    onChat={() => open(selected, true)}
                                    onBook={
                                        sessionOptions
                                            ? () => onBook(selected)
                                            : null
                                    }
                                    size="sm"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                            <Users aria-hidden="true" className="size-7" />
                        </span>
                        <p className="text-[15px] font-semibold">
                            Scegli un cliente
                        </p>
                        <p className="max-w-64 text-[13px] text-muted-foreground">
                            Vedi le sue sedute, i dati, le note e scrivigli
                            dalla chat.
                        </p>
                    </div>
                )}
            </aside>
        </div>
    );
}

function Empty({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Users aria-hidden="true" className="size-7" />
            </span>
            <span className="text-lg font-semibold">Ancora nessun cliente</span>
            <button
                type="button"
                onClick={onAdd}
                className={brandButtonClassName}
            >
                <Plus
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={2.5}
                />
                Aggiungi cliente
            </button>
        </div>
    );
}
