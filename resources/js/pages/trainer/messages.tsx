import { Head } from '@inertiajs/react';
import ChatView from '@/components/chat/chat-view';
import PageHeading from '@/components/trainer/area/page-heading';
import { messages } from '@/routes/trainer';
import type { ChatConversation, ChatThread } from '@/types';

type MessagesProps = {
    conversations: ChatConversation[];
    selected: ChatThread | null;
};

/** "Messaggi" of the trainer: the clients with an account. */
export default function Messages({ conversations, selected }: MessagesProps) {
    return (
        <>
            <Head title="Messaggi" />

            <div className={selected ? 'hidden md:block' : undefined}>
                <PageHeading
                    title="Messaggi"
                    description="Scrivi ai tuoi clienti e mandagli foto e schede in PDF."
                />
            </div>

            <ChatView
                conversations={conversations}
                selected={selected}
                baseHref={messages.url()}
                emptyTitle="Ancora nessun cliente con un account"
                emptyDescription="Puoi scrivere ai clienti che prenotano da te o che si registrano con il loro link personale da «Clienti»."
            />
        </>
    );
}

Messages.layout = { section: 'messages' };
