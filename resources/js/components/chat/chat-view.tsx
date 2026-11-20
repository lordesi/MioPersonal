import { router, usePoll } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { useRef } from 'react';
import ChatDesktop from '@/components/chat/chat-desktop';
import ConversationList from '@/components/chat/conversation-list';
import MessageThread from '@/components/chat/message-thread';
import EmptyState from '@/components/states/empty-state';
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

/**
 * "Messaggi" of the client. Phones: one at a time, the list or the
 * conversation with "Indietro" over the whole screen. Tablets and desktop:
 * the list and the conversation in two panels (chat-desktop.tsx), like
 * "Clienti" of the trainer.
 */
export default function ChatView({
    conversations,
    selected,
    baseHref,
    emptyTitle,
    emptyDescription,
}: ChatViewProps) {
    usePoll(LIST_POLL_MS, { only: ['conversations'] });
    const isMobile = useIsMobile();
    const reloading = useRef(false);

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

    const title = (
        <h1
            className={cn(
                'text-[34px] leading-10.25 font-bold tracking-[0.4px]',
                selected && isMobile && 'hidden',
            )}
        >
            Messaggi
        </h1>
    );

    if (conversations.length === 0) {
        return (
            <>
                {title}
                <EmptyState
                    icon={MessageCircle}
                    title={emptyTitle}
                    description={emptyDescription}
                    bordered
                    className="rounded-[26px] bg-card"
                />
            </>
        );
    }

    if (!isMobile) {
        return (
            <ChatDesktop
                conversations={conversations}
                selected={selected}
                hrefFor={hrefFor}
                baseHref={baseHref}
                onActivity={refreshList}
            />
        );
    }

    return (
        <>
            {title}
            {selected === null ? (
                <ConversationList
                    conversations={conversations}
                    selectedId={null}
                    hrefFor={hrefFor}
                />
            ) : (
                // The whole screen above the tab bar.
                <div className="-mx-4 -mt-6 flex h-[calc(100dvh-8.5rem)] min-w-0 flex-col overflow-hidden bg-card">
                    <MessageThread
                        key={selected.recordId}
                        thread={selected}
                        backHref={baseHref}
                        onActivity={refreshList}
                    />
                </div>
            )}
        </>
    );
}
