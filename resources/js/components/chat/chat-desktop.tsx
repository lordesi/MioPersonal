import { Link } from '@inertiajs/react';
import { CheckCheck, ChevronLeft, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { normalize, shortDate } from '@/components/chat/conversation-list';
import MessageThread from '@/components/chat/message-thread';
import { Initials } from '@/components/trainer/ui/bits';
import {
    filterChipClassName,
    pageTitleClassName,
    panelClassName,
    pressableRowClassName,
} from '@/components/trainer/ui/styles';
import { ATTACHMENT_DAYS } from '@/lib/chat';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatThread } from '@/types';

type ChatDesktopProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
    hrefFor: (recordId: number) => string;
    baseHref: string;
    onActivity: () => void;
};

/** The columns of the list: trainer, last message, when. */
const COLUMNS = 'grid-cols-[minmax(200px,1.3fr)_minmax(200px,2fr)_72px]';

/** With the conversation open the panel on the right is wider. */
const COLUMNS_NARROW = 'grid-cols-[minmax(160px,1fr)_minmax(140px,1.4fr)_64px]';

/**
 * "Messaggi" on desktop, like "Clienti" of the trainer: the title and the
 * search on top, the list of the trainers in a panel (Tutti · Non letti) and
 * the conversation in the panel on the right, wider when it is open.
 * Tablets (below lg): one panel at a time, the list or the conversation.
 */
export default function ChatDesktop({
    conversations,
    selected,
    hrefFor,
    baseHref,
    onActivity,
}: ChatDesktopProps) {
    const [query, setQuery] = useState('');
    const [onlyUnread, setOnlyUnread] = useState(false);
    const needle = normalize(query.trim());
    const unreadCount = conversations.filter((item) => item.unread).length;
    const shown = conversations.filter(
        (item) =>
            (!onlyUnread || item.unread) &&
            (needle === '' ||
                normalize(item.name).includes(needle) ||
                normalize(item.lastMessage?.text ?? '').includes(needle)),
    );
    const wide = selected !== null;
    const columns = wide ? COLUMNS_NARROW : COLUMNS;

    return (
        <div className="flex h-full min-h-0 gap-4">
            <section
                aria-label="Conversazioni"
                className={cn(
                    'flex min-w-0 flex-1 flex-col gap-4',
                    // Tablets: the conversation alone once open.
                    wide && 'max-lg:hidden',
                )}
            >
                <header className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="mr-auto flex flex-col gap-0.5">
                        <h1 className={pageTitleClassName}>Messaggi</h1>
                        <span className="text-[15px] text-muted-foreground">
                            {conversations.length === 1
                                ? '1 conversazione'
                                : `${conversations.length} conversazioni`}
                        </span>
                    </div>
                    <label className="flex h-11 w-85 max-w-full items-center gap-2 rounded-full bg-card px-3.5 text-[#8a8a8a] focus-within:ring-[3px] focus-within:ring-ring/50">
                        <Search aria-hidden="true" className="size-4.5" />
                        <span className="sr-only">
                            Cerca trainer o messaggio
                        </span>
                        <input
                            type="search"
                            autoComplete="off"
                            placeholder="Cerca trainer o messaggio"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-[#8a8a8a] [&::-webkit-search-cancel-button]:hidden"
                        />
                    </label>
                </header>

                <div
                    className={cn(
                        panelClassName,
                        'flex min-h-0 flex-1 flex-col overflow-hidden',
                    )}
                >
                    <div className="flex gap-2 border-b border-border px-3 pt-3 pb-2">
                        <button
                            type="button"
                            aria-pressed={!onlyUnread}
                            onClick={() => setOnlyUnread(false)}
                            className={filterChipClassName}
                        >
                            Tutti
                        </button>
                        <button
                            type="button"
                            aria-pressed={onlyUnread}
                            onClick={() => setOnlyUnread(true)}
                            className={filterChipClassName}
                        >
                            Non letti
                            {unreadCount > 0 && (
                                <span className="text-brand tabular-nums">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div
                        aria-hidden="true"
                        className={cn(
                            'grid gap-4 px-7 pt-2.5 pb-1.5 text-xs font-semibold text-[#8a8a8a]',
                            columns,
                        )}
                    >
                        <span>TRAINER</span>
                        <span>ULTIMO MESSAGGIO</span>
                        <span className="text-right">QUANDO</span>
                    </div>

                    <div className="flex min-h-0 flex-1 [scrollbar-width:none] flex-col gap-0.5 overflow-y-auto px-3 pb-3">
                        {shown.length === 0 ? (
                            <p className="my-6 text-center text-[15px] text-muted-foreground">
                                {onlyUnread && needle === ''
                                    ? 'Hai letto tutto.'
                                    : 'Nessuna conversazione trovata.'}
                            </p>
                        ) : (
                            shown.map((conversation) => (
                                <Row
                                    key={conversation.recordId}
                                    conversation={conversation}
                                    columns={columns}
                                    href={hrefFor(conversation.recordId)}
                                    current={
                                        selected?.recordId ===
                                        conversation.recordId
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>

            <aside
                aria-label="Conversazione"
                className={cn(
                    panelClassName,
                    'flex shrink-0 flex-col gap-3 overflow-hidden p-5 transition-[width] duration-300 motion-reduce:transition-none',
                    wide
                        ? 'w-[min(760px,58%)] max-lg:w-auto max-lg:flex-1'
                        : 'w-110 max-lg:hidden',
                )}
            >
                {selected && (
                    <Link
                        href={baseHref}
                        className="-mt-1 inline-flex min-h-9 items-center gap-1 self-start text-[15px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:hidden"
                    >
                        <ChevronLeft aria-hidden="true" className="size-5" />
                        Tutti i messaggi
                    </Link>
                )}
                {selected ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-border bg-card">
                        <MessageThread
                            key={selected.recordId}
                            thread={selected}
                            backHref={baseHref}
                            onActivity={onActivity}
                        />
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                        <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                            <MessageCircle
                                aria-hidden="true"
                                className="size-7"
                            />
                        </span>
                        <p className="text-[15px] font-semibold">
                            Scegli una conversazione
                        </p>
                        <p className="max-w-64 text-[13px] text-muted-foreground">
                            Puoi mandare messaggi, foto e schede PDF. Foto e PDF
                            restano disponibili per {ATTACHMENT_DAYS} giorni.
                        </p>
                    </div>
                )}
            </aside>
        </div>
    );
}

function Row({
    conversation,
    columns,
    href,
    current,
}: {
    conversation: ChatConversation;
    columns: string;
    href: string;
    current: boolean;
}) {
    const last = conversation.lastMessage;
    const unread = conversation.unread;
    const count = conversation.unreadCount ?? 0;

    return (
        <Link
            href={href}
            preserveScroll
            aria-current={current ? 'page' : undefined}
            className={cn(
                'grid items-center gap-4 rounded-[14px] px-4 py-2.5 text-left',
                columns,
                pressableRowClassName,
                current && 'bg-brand-soft',
            )}
        >
            <span className="flex min-w-0 items-center gap-3">
                <Initials
                    name={conversation.name}
                    src={conversation.avatar}
                    size={40}
                    className={cn(
                        unread &&
                            'shadow-[0_0_0_2px_#141414,0_0_0_4px_#42d7d9]',
                    )}
                />
                <span className="flex min-w-0 flex-col">
                    <span
                        className={cn(
                            'truncate text-[15px] leading-5',
                            unread ? 'font-bold' : 'font-semibold',
                        )}
                    >
                        {conversation.name}
                    </span>
                    {conversation.subtitle && (
                        <span className="truncate text-xs text-muted-foreground">
                            {conversation.subtitle}
                        </span>
                    )}
                </span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
                <span
                    className={cn(
                        'flex min-w-0 items-center gap-1 text-[13px]',
                        last === null
                            ? 'text-[#707070] italic'
                            : unread
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                    )}
                >
                    {last === null ? (
                        <span className="truncate">
                            Non vi siete ancora scritti
                        </span>
                    ) : (
                        <>
                            {last.mine && (
                                <>
                                    <CheckCheck
                                        aria-hidden="true"
                                        className="size-3.5 shrink-0 text-brand"
                                    />
                                    <span className="shrink-0">Tu:</span>
                                </>
                            )}
                            <span className="truncate">{last.text}</span>
                        </>
                    )}
                </span>
                {unread && (
                    <span
                        aria-label={
                            count > 1
                                ? `${count} messaggi nuovi`
                                : 'Messaggi nuovi'
                        }
                        className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-[#0a0a0a] tabular-nums"
                    >
                        {count > 0 ? count : ''}
                    </span>
                )}
            </span>
            <span
                className={cn(
                    'text-right text-xs tabular-nums',
                    unread ? 'font-semibold text-brand' : 'text-[#8a8a8a]',
                )}
            >
                {last?.at ? shortDate(last.at) : ''}
            </span>
        </Link>
    );
}
