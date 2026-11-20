import { Head } from '@inertiajs/react';
import ChatView from '@/components/chat/chat-view';
import { messages } from '@/routes/client';
import type { ChatConversation, ChatThread } from '@/types';

type MessagesProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
};

/**
 * "Messaggi" of the client: the trainers who have them among their clients.
 * The title, the list and the conversation are drawn by ChatView.
 */
export default function Messages({ conversations, selected }: MessagesProps) {
    return (
        <>
            <Head title="Messaggi" />

            <ChatView
                conversations={conversations}
                selected={selected}
                baseHref={messages.url()}
                emptyTitle="Ancora nessun messaggio"
                emptyDescription="Dopo la tua prima seduta con un trainer, potrai scrivergli qui."
            />
        </>
    );
}

Messages.layout = { section: 'messages', fill: true };
