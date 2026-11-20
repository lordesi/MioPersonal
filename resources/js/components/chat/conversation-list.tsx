import { Link } from '@inertiajs/react';
import { CheckCheck, FileText, Image, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Initials } from '@/components/trainer/ui/bits';
import { formatDayShort, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChatConversation } from '@/types';

type ConversationListProps = {
    conversations: ChatConversation[];
    selectedId: number | null;
    /** The address of a conversation: "?con=12" on the page. */
    hrefFor: (recordId: number) => string;
};

/**
 * The client's trainers, the latest conversation first, with the search on
 * top. A conversation with new messages has the turquoise ring, the time in
 * turquoise and the number of new messages.
 */
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
        <div className="flex flex-col gap-3">
            <div className="relative md:mx-3 md:mt-3">
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cerca"
                    aria-label="Cerca nei messaggi"
                    className="h-11 w-full rounded-full bg-card pr-10 pl-10 text-[17px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:bg-secondary [&::-webkit-search-cancel-button]:hidden"
                />
                {query !== '' && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Cancella la ricerca"
                        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                )}
            </div>

            {shown.length === 0 && (
                <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">
                    Nessuno con questo nome.
                </p>
            )}

            <ul className="-mx-4 flex flex-col md:mx-0 md:px-1.5 md:pb-1.5">
                {shown.map((conversation, index) => (
                    <li key={conversation.recordId}>
                        {index > 0 && (
                            <div
                                aria-hidden="true"
                                className="mr-4 ml-21 h-px bg-separator"
                            />
                        )}
                        <Row
                            conversation={conversation}
                            active={conversation.recordId === selectedId}
                            href={hrefFor(conversation.recordId)}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Row({
    conversation,
    active,
    href,
}: {
    conversation: ChatConversation;
    active: boolean;
    href: string;
}) {
    const last = conversation.lastMessage;
    const unread = conversation.unread;
    const count = conversation.unreadCount ?? 0;
    const AttachmentIcon =
        last?.attachment === 'photo'
            ? Image
            : last?.attachment === 'pdf'
              ? FileText
              : null;

    return (
        <Link
            href={href}
            preserveScroll
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex items-center gap-3.5 px-4 py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset md:rounded-[20px] md:px-3',
                active
                    ? 'bg-brand-soft'
                    : 'active:bg-white/5 md:hover:bg-white/5',
            )}
        >
            <Initials
                name={conversation.name}
                src={conversation.avatar}
                size={54}
                className={cn(
                    unread && 'shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#42d7d9]',
                )}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[17px] leading-5.5 font-bold tracking-[-0.43px]">
                        {conversation.name}
                    </span>
                    {last?.at && (
                        <span
                            className={cn(
                                'flex-none text-[13px] leading-4.5 tabular-nums',
                                unread
                                    ? 'font-semibold text-brand'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {shortDate(last.at)}
                        </span>
                    )}
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            'flex min-w-0 flex-1 items-center gap-1 text-[15px] leading-5',
                            unread
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        {last === null ? (
                            <span className="truncate">
                                Nessun messaggio: scrivi per primo
                            </span>
                        ) : (
                            <>
                                {last.mine && (
                                    <>
                                        <CheckCheck
                                            aria-hidden="true"
                                            className="size-4 flex-none text-brand"
                                        />
                                        <span className="flex-none">Tu:</span>
                                    </>
                                )}
                                {AttachmentIcon && (
                                    <AttachmentIcon
                                        aria-hidden="true"
                                        className="size-3.5 flex-none"
                                    />
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
                            className="inline-flex h-5.5 min-w-5.5 flex-none items-center justify-center rounded-full bg-brand px-1.5 text-[13px] font-bold text-[#0a0a0a] tabular-nums"
                        >
                            {count > 0 ? count : ''}
                        </span>
                    )}
                </span>
                {conversation.subtitle && (
                    <span className="truncate text-[13px] leading-4.5 text-muted-foreground">
                        {conversation.subtitle}
                    </span>
                )}
            </span>
        </Link>
    );
}

/** Lower case, without accents: "Niccolò" is found with "nicco". */
export function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/** "14:05" today, "Mar 6 ott" before. */
export function shortDate(iso: string): string {
    const day = (date: Date) =>
        date.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });

    return day(new Date(iso)) === day(new Date())
        ? formatTime(iso)
        : formatDayShort(iso);
}
