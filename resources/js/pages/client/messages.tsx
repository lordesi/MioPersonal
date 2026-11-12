import { Head } from '@inertiajs/react';
import ChatView from '@/components/chat/chat-view';
import { messages } from '@/routes/client';
import type { ChatConversation, ChatThread } from '@/types';

type MessagesProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
};

/** "Messaggi" of the client: the trainers who have them among their clients. */
export default function Messages({ conversations, selected }: MessagesProps) {
    return (
        <>
            <Head title="Messaggi" />

            <h1
                className={
                    selected
                        ? 'hidden text-[28px] leading-8.5 font-bold tracking-[-0.03em] md:block md:text-[34px] md:leading-10'
                        : 'text-[28px] leading-8.5 font-bold tracking-[-0.03em] md:text-[34px] md:leading-10'
                }
            >
                Messaggi
            </h1>

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

Messages.layout = { section: 'messages' };
