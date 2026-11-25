import { Head } from '@inertiajs/react';
import ChatView from '@/components/chat/chat-view';
import { messages } from '@/routes/trainer';
import type { ChatConversation, ChatThread } from '@/types';

type MessagesProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
};

/**
 * The Inbox of the trainer (design "Trainer · Inbox · nuovo"): the chats
 * with the clients who have an account, and the notifications. Drawn by
 * ChatView, the same of the client.
 */
export default function Messages({ conversations, selected }: MessagesProps) {
    return (
        <>
            <Head title="Inbox" />

            <ChatView
                conversations={conversations}
                selected={selected}
                baseHref={messages.url()}
                emptyTitle="Ancora nessun messaggio"
                emptyDescription="Quando un tuo cliente con un account ti scrive, trovi qui la chat."
            />
        </>
    );
}

Messages.layout = { section: 'messages', fill: true };
