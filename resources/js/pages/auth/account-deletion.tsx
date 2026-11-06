import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDayLong } from '@/lib/format';
import { logout } from '@/routes';
import { cancel } from '@/routes/account/deletion';

type AccountDeletionProps = {
    /** Rome date, Y-m-d: when the data goes. */
    deletionDate: string;
};

/**
 * "Account in eliminazione": the only page for who asked to delete their
 * account and logs in again before the deletion (EnsureAccountActive).
 */
export default function AccountDeletion({
    deletionDate,
}: AccountDeletionProps) {
    return (
        <>
            <Head title="Account in eliminazione" />

            <div className="flex flex-col gap-6">
                <p className="text-sm text-muted-foreground">
                    Hai chiesto di eliminare il tuo account: i tuoi dati
                    verranno cancellati{' '}
                    <strong className="text-foreground">
                        {formatDayLong(deletionDate).toLowerCase()}
                    </strong>
                    . Se hai cambiato idea puoi tenerlo; le prenotazioni già
                    annullate non tornano.
                </p>

                <Form {...cancel.form()}>
                    {({ processing }) => (
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 w-full font-semibold"
                        >
                            {processing && <Spinner />}
                            Annulla eliminazione
                        </Button>
                    )}
                </Form>

                <Form {...logout.form()}>
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-11 w-full"
                    >
                        Esci
                    </Button>
                </Form>
            </div>
        </>
    );
}

AccountDeletion.layout = {
    title: 'Account in eliminazione',
    description: 'Puoi ancora cambiare idea.',
};
