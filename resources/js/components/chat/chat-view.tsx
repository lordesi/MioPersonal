import { Link, router, usePage, usePoll } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { useRef } from 'react';
import ConversationList from '@/components/chat/conversation-list';
import MessageThread from '@/components/chat/message-thread';
import NotificationsList from '@/components/chat/notifications-list';
import { CountPill, areaTitleClassName } from '@/components/mp/area-bits';
import { useIsMobile } from '@/hooks/use-mobile';
import { LIST_POLL_MS } from '@/lib/chat';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatThread } from '@/types';

type ChatViewProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
    /** The page itself, without "?con=". */
    baseHref: string;
    /** Shown when there is nobody to write to yet. */
    emptyTitle: string;
    emptyDescription: string;
};

/** "?sezione=notifiche": the second tab of the Inbox. */
function notificationsOpen(url: string): boolean {
    const query = url.split('?')[1]?.split('#')[0] ?? '';

    return new URLSearchParams(query).get('sezione') === 'notifiche';
}

/**
 * The Inbox (design "Inbox · chat / notifiche · nuovo"): the title, the tabs
 * "Chat" and "Notifiche" with their numbers, then the list. Phones: one
 * thing at a time, the conversation over the whole screen. Desktop: the
 * list on the left, the open conversation on the right.
 */
export default function ChatView({
    conversations,
    selected,
    baseHref,
    emptyTitle,
    emptyDescription,
}: ChatViewProps) {
    usePoll(LIST_POLL_MS, { only: ['conversations'] });
    const page = usePage();
    const isMobile = useIsMobile();
    const reloading = useRef(false);
    const showNotifications = notificationsOpen(page.url) && !selected;
    const unreadChats = conversations.reduce(
        (sum, item) => sum + (item.unread ? item.unreadCount || 1 : 0),
        0,
    );
    const unreadNotifications = page.props.auth?.unreadNotifications ?? 0;

    // A message sent or arrived: the preview and the order of the list change.
    const refreshList = () => {
        if (reloading.current) {
            return;
        }

        reloading.current = true;
        router.reload({
            only: ['conversations'],
            onFinish: () => {
                reloading.current = false;
            },
        });
    };

    const hrefFor = (recordId: number) => `${baseHref}?con=${recordId}`;

    const tabs = (
        <div
            role="tablist"
            aria-label="Inbox"
            className="-mx-4 flex border-b border-separator md:mx-0"
        >
            <Tab
                href={baseHref}
                selected={!showNotifications}
                label="Chat"
                count={unreadChats}
            />
            <Tab
                href={`${baseHref}?sezione=notifiche`}
                selected={showNotifications}
                label="Notifiche"
                count={unreadNotifications}
            />
        </div>
    );

    const list = showNotifications ? (
        <NotificationsList />
    ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                <MessageCircle aria-hidden="true" className="size-6" />
            </span>
            <p className="text-[17px] font-semibold">{emptyTitle}</p>
            <p className="max-w-80 text-[15px] leading-5 text-muted-foreground">
                {emptyDescription}
            </p>
        </div>
    ) : (
        <ConversationList
            conversations={conversations}
            selectedId={selected?.recordId ?? null}
            hrefFor={hrefFor}
        />
    );

    const thread = selected && (
        <MessageThread
            key={selected.recordId}
            thread={selected}
            backHref={baseHref}
            onActivity={refreshList}
        />
    );

    if (isMobile) {
        if (thread) {
            // The whole screen above the tab bar.
            return (
                <div className="-mx-4 -mt-6 flex h-[calc(100dvh-6.5rem)] min-w-0 flex-col overflow-hidden">
                    {thread}
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <h1 className={areaTitleClassName}>Inbox</h1>
                <div className="flex flex-col">
                    {tabs}
                    {list}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 gap-8 pt-6">
            <section
                aria-label="Inbox"
                className={cn(
                    'flex min-h-0 flex-col gap-4',
                    showNotifications ? 'w-full max-w-180' : 'w-100 shrink-0',
                )}
            >
                <h1 className={areaTitleClassName}>Inbox</h1>
                <div className="flex min-h-0 flex-1 flex-col">
                    {tabs}
                    <div className="min-h-0 flex-1 [scrollbar-width:none] overflow-y-auto">
                        {list}
                    </div>
                </div>
            </section>

            {!showNotifications && (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {thread ?? (
                        <div className="m-auto flex max-w-80 flex-col items-center gap-3 text-center">
                            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                                <MessageCircle
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </span>
                            <p className="text-[15px] leading-5 text-muted-foreground">
                                {conversations.length > 0
                                    ? 'Scegli una chat per leggerla e rispondere.'
                                    : emptyDescription}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Tab({
    href,
    selected,
    label,
    count,
}: {
    href: string;
    selected: boolean;
    label: string;
    count: number;
}) {
    return (
        <Link
            href={href}
            role="tab"
            aria-selected={selected}
            preserveScroll
            replace
            className={cn(
                'relative flex h-12 flex-1 items-center justify-center gap-2 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                selected
                    ? 'text-foreground after:absolute after:inset-x-[24%] after:-bottom-px after:h-0.75 after:rounded-t-[3px] after:bg-brand'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {label}
            {count > 0 && <CountPill>{count}</CountPill>}
        </Link>
    );
}
