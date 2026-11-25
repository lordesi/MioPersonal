import { Link } from '@inertiajs/react';
import { CheckCheck, FileText, Image } from 'lucide-react';
import { CountPill } from '@/components/mp/area-bits';
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
 * The chats of the Inbox (design "Inbox · chat · nuovo"), the latest first:
 * the photo, the name in bold while something is unread, the time, the last
 * message with the turquoise number, the discipline under it.
 */
export default function ConversationList({
    conversations,
    selectedId,
    hrefFor,
}: ConversationListProps) {
    return (
        <ul className="-mx-4 flex flex-col py-2 md:mx-0">
            {conversations.map((conversation) => (
                <li key={conversation.recordId}>
                    <Row
                        conversation={conversation}
                        active={conversation.recordId === selectedId}
                        href={hrefFor(conversation.recordId)}
                    />
                </li>
            ))}
        </ul>
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
                'relative flex items-center gap-3.5 px-4 py-3 outline-none after:absolute after:right-0 after:bottom-0 after:left-18.5 after:h-px after:bg-separator focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:rounded-2xl md:after:hidden',
                active ? 'bg-card' : 'active:bg-white/5 md:hover:bg-white/5',
            )}
        >
            <Initials
                name={conversation.name}
                src={conversation.avatar}
                size={52}
                className="text-base"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline gap-2">
                    <span
                        className={cn(
                            'min-w-0 flex-1 truncate text-[17px] leading-5.5',
                            unread ? 'font-bold' : 'font-semibold',
                        )}
                    >
                        {conversation.name}
                    </span>
                    {last?.at && (
                        <span className="flex-none text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                            {shortDate(last.at)}
                        </span>
                    )}
                </span>
                <span className="flex items-center gap-2">
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
                        <CountPill className="flex-none">
                            <span
                                aria-label={
                                    count > 1
                                        ? `${count} messaggi nuovi`
                                        : 'Messaggi nuovi'
                                }
                            >
                                {count > 0 ? count : ''}
                            </span>
                        </CountPill>
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
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** "14:05" today, "Mar 6 ott" before. */
export function shortDate(iso: string): string {
    const day = (date: Date) =>
        date.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });

    return day(new Date(iso)) === day(new Date())
        ? formatTime(iso)
        : formatDayShort(iso);
}
