import { router, usePoll } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { useRef } from 'react';
import ConversationList from '@/components/chat/conversation-list';
import MessageThread from '@/components/chat/message-thread';
import EmptyState from '@/components/states/empty-state';
import { ATTACHMENT_DAYS, LIST_POLL_MS } from '@/lib/chat';
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
 * "Messaggi": the list on the left and the open conversation on the right.
 * On mobile one at a time: the list, or the conversation with "Indietro".
 */
export default function ChatView({
    conversations,
    selected,
    baseHref,
    emptyTitle,
    emptyDescription,
}: ChatViewProps) {
    usePoll(LIST_POLL_MS, { only: ['conversations'] });
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

    if (conversations.length === 0) {
        return (
            <EmptyState
                icon={MessageCircle}
                title={emptyTitle}
                description={emptyDescription}
                bordered
                className="rounded-[20px] bg-card"
            />
        );
    }

    return (
        <div className="flex h-[calc(100dvh-12rem)] min-h-105 overflow-hidden rounded-[20px] border bg-card shadow-xs md:h-[calc(100dvh-11rem)]">
            <div
                className={cn(
                    'min-h-0 w-full flex-none overflow-y-auto md:block md:w-80 md:border-r lg:w-88',
                    selected !== null && 'hidden',
                )}
            >
                <ConversationList
                    conversations={conversations}
                    selectedId={selected?.recordId ?? null}
                    hrefFor={hrefFor}
                />
            </div>
            {selected !== null ? (
                <MessageThread
                    key={selected.recordId}
                    thread={selected}
                    backHref={baseHref}
                    onActivity={refreshList}
                />
            ) : (
                <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-secondary/50 p-6 text-center md:flex">
                    <span className="flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-xs">
                        <MessageCircle aria-hidden="true" className="size-7" />
                    </span>
                    <p className="text-[15px] font-semibold">
                        Scegli una conversazione
                    </p>
                    <p className="max-w-64 text-sm text-muted-foreground">
                        Puoi mandare messaggi, foto e schede PDF. Foto e PDF
                        restano disponibili per {ATTACHMENT_DAYS} giorni.
                    </p>
                </div>
            )}
        </div>
    );
}
