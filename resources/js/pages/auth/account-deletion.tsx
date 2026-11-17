import { Form, Head } from '@inertiajs/react';
import AuthPhotoShell, {
    AuthIntro,
    authButtonClassName,
} from '@/components/auth/auth-photo-shell';
import { darkSecondaryButtonClassName } from '@/components/mp/dark-dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';
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

            <AuthPhotoShell
                titleId="account-deletion-title"
                title="Account in eliminazione."
                desktopTitle={
                    <>
                        Il tuo account è <strong>in eliminazione</strong>.
                    </>
                }
                logoLinksHome={false}
                // No way out but the buttons below: the account is on hold.
                mobileAction={<span />}
            >
                <AuthIntro>
                    Hai chiesto di eliminare il tuo account: i tuoi dati
                    verranno cancellati{' '}
                    <strong className="text-foreground">
                        {formatDayLong(deletionDate).toLowerCase()}
                    </strong>
                    . Se hai cambiato idea puoi tenerlo; le prenotazioni già
                    annullate non tornano.
                </AuthIntro>

                <Form {...cancel.form()} className="flex flex-col">
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing}
                            className={authButtonClassName}
                        >
                            {processing && <Spinner />}
                            Annulla eliminazione
                        </button>
                    )}
                </Form>

                <Form {...logout.form()} className="flex flex-col">
                    <button
                        type="submit"
                        className={cn(
                            darkSecondaryButtonClassName,
                            'md:w-full',
                        )}
                    >
                        Esci
                    </button>
                </Form>
            </AuthPhotoShell>
        </>
    );
}
