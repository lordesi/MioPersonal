import { Head } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import EmptyState from '@/components/states/empty-state';

/**
 * "Impostazioni e registro": in lavorazione, like "Messaggi". The activity
 * log needs its table (step 7 of docs/database/analisi.md).
 */
export default function Settings() {
    return (
        <>
            <Head title="Admin · Impostazioni e registro" />

            <EmptyState
                icon={Construction}
                title="In lavorazione"
                description="Qui arriveranno il team, le impostazioni predefinite e il registro delle azioni dell’admin. Nel frattempo le modifiche si fanno dalle altre sezioni."
                bordered
            />
        </>
    );
}

Settings.layout = { section: 'settings' };
