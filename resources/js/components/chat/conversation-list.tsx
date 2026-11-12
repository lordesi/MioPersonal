import { Link } from '@inertiajs/react';
import { FileText, Image, Search, X } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import { formatDayShort, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChatConversation } from '@/types';

type ConversationListProps = {
    conversations: ChatConversation[];
    selectedId: number | null;
    /** The address of a conversation: "?con=12" on the page. */
    hrefFor: (recordId: number) => string;
};

/** The search shows up from this many people. */
const SEARCH_FROM = 6;

/** The people to write to, the latest conversation first. New messages in bold. */
export default function ConversationList({
    conversations,
    selectedId,
    hrefFor,
}: ConversationListProps) {
    const [query, setQuery] = useState('');
    const needle = normalize(query.trim());
    const shown =
        needle === ''
            ? conversations
            : conversations.filter((conversation) =>
                  normalize(conversation.name).includes(needle),
              );

    return (
        <div className="flex flex-col">
            {conversations.length >= SEARCH_FROM && (
                <div className="sticky top-0 z-10 border-b bg-card px-3 py-3">
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cerca per nome"
                            aria-label="Cerca una conversazione per nome"
                            className="h-9 w-full rounded-full border bg-secondary pr-9 pl-9 text-sm outline-none focus:border-foreground/40 focus:bg-card [&::-webkit-search-cancel-button]:hidden"
                        />
                        {query !== '' && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Cancella la ricerca"
                                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full hover:bg-accent"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {shown.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nessuno con questo nome.
                </p>
            )}

            <ul className="flex flex-col p-1.5">
                {shown.map((conversation) => {
                    const last = conversation.lastMessage;
                    const active = conversation.recordId === selectedId;
                    const AttachmentIcon =
                        last?.attachment === 'photo'
                            ? Image
                            : last?.attachment === 'pdf'
                              ? FileText
                              : null;

                    return (
                        <li key={conversation.recordId}>
                            <Link
                                href={hrefFor(conversation.recordId)}
                                preserveScroll
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-3 rounded-[14px] px-2.5 py-2.5 transition-colors hover:bg-accent',
                                    active && 'bg-accent',
                                    conversation.unread &&
                                        !active &&
                                        'bg-primary/5',
                                )}
                            >
                                <UserAvatar
                                    name={conversation.name}
                                    src={conversation.avatar}
                                    size="lg"
                                    className="size-12 flex-none text-sm"
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex items-baseline gap-2">
                                        <span
                                            className={cn(
                                                'min-w-0 flex-1 truncate text-[15px] leading-5.5',
                                                conversation.unread
                                                    ? 'font-bold'
                                                    : 'font-semibold',
                                            )}
                                        >
                                            {conversation.name}
                                        </span>
                                        {last?.at && (
                                            <span
                                                className={cn(
                                                    'flex-none text-xs tabular-nums',
                                                    conversation.unread
                                                        ? 'font-semibold text-primary'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {shortDate(last.at)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'flex min-w-0 flex-1 items-center gap-1 text-[13px] leading-4.5',
                                                conversation.unread
                                                    ? 'font-semibold text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {last === null ? (
                                                <span className="truncate">
                                                    Nessun messaggio: scrivi per
                                                    primo
                                                </span>
                                            ) : (
                                                <>
                                                    {last.mine && (
                                                        <span className="flex-none">
                                                            Tu:
                                                        </span>
                                                    )}
                                                    {AttachmentIcon && (
                                                        <AttachmentIcon
                                                            aria-hidden="true"
                                                            className="size-3.5 flex-none"
                                                        />
                                                    )}
                                                    <span className="truncate">
                                                        {last.text}
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                        {conversation.unread && (
                                            <span
                                                aria-label="Messaggi nuovi"
                                                className="size-2.5 flex-none rounded-full bg-primary"
                                            />
                                        )}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** Lower case, without accents: "Niccolò" is found with "nicco". */
function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/** "14:05" today, "Mar 6 ott" before. */
function shortDate(iso: string): string {
    const day = (date: Date) =>
        date.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });

    return day(new Date(iso)) === day(new Date())
        ? formatTime(iso)
        : formatDayShort(iso);
}
