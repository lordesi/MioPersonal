import { router } from '@inertiajs/react';
import { useRef } from 'react';
import MessageThread from '@/components/chat/message-thread';
import { clients } from '@/routes/trainer';
import type { ChatThread } from '@/types';

/**
 * The conversation with a client, in place of the card: photos and PDFs,
 * "Visto", the new messages every few seconds (MessageThread). A message
 * sent or arrived refreshes the last message in the list.
 */
export default function ClientChat({
    thread,
    clientId,
}: {
    thread: ChatThread;
    /** The account: "Indietro" opens the card again. */
    clientId: number | null;
}) {
    const reloading = useRef(false);

    const refresh = () => {
        if (reloading.current) {
            return;
        }

        reloading.current = true;
        router.reload({
            only: ['chats', 'trainerArea'],
            onFinish: () => {
                reloading.current = false;
            },
        });
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-border bg-card">
            <MessageThread
                key={thread.recordId}
                thread={thread}
                backHref={clients.url({
                    query:
                        clientId === null
                            ? { con: thread.recordId }
                            : { cliente: clientId },
                })}
                onActivity={refresh}
            />
        </div>
    );
}
