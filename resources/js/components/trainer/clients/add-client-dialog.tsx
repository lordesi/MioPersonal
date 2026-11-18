import { usePage } from '@inertiajs/react';
import DarkDialog from '@/components/mp/dark-dialog';
import AddClients from '@/components/trainer/area/add-clients';
import type { ClientInvite } from '@/components/trainer/area/invite-clients';
import InviteClients from '@/components/trainer/area/invite-clients';

/**
 * "Aggiungi cliente": the personal link to send (WhatsApp, copy) and the
 * clients you already have, pasted one per line. Only once the profile is
 * in the search: before that there is no link to send.
 */
export default function AddClientDialog({
    open,
    onOpenChange,
    invite,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invite: ClientInvite | null;
}) {
    const firstName = usePage().props.auth.user?.name.split(' ')[0] ?? '';

    return (
        <DarkDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Aggiungi clienti"
            description={
                invite
                    ? 'Mandagli il tuo link oppure scrivi i clienti che hai già: ritrovi tutto in un posto.'
                    : 'Potrai aggiungere i tuoi clienti appena il profilo è online.'
            }
            className="md:max-w-160"
        >
            {invite && (
                <div className="flex flex-col gap-4">
                    <InviteClients invite={invite} firstName={firstName} />
                    <AddClients defaultOpen />
                </div>
            )}
        </DarkDialog>
    );
}
