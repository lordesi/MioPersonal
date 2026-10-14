import { Head } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import EmptyState from '@/components/states/empty-state';

type MessagesProps = {
    /** Where the messages of the Contatti page arrive in the meantime. */
    contactEmail: string;
};

/** "Messaggi": in lavorazione, back after the v1. */
export default function Messages({ contactEmail }: MessagesProps) {
    return (
        <>
            <Head title="Admin · Messaggi" />

            <EmptyState
                icon={Construction}
                title="In lavorazione"
                description={`Questa sezione arriva dopo la v1. Nel frattempo i messaggi della pagina Contatti arrivano via email a ${contactEmail}.`}
                bordered
            />
        </>
    );
}

Messages.layout = { section: 'messages' };
