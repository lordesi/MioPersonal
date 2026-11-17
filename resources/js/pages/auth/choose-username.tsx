import { Form, Head, Link } from '@inertiajs/react';
import AuthPhotoShell, {
    AuthIntro,
    authButtonClassName,
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
import UsernameField from '@/components/auth/username-field';
import { Spinner } from '@/components/ui/spinner';
import { darkFieldClassName } from '@/lib/dark-form';
import { logout } from '@/routes';
import { store } from '@/routes/username';

type Props = {
    /** Given automatically: the user can keep it or pick another, once. */
    username: string;
    /** Trainers and gyms: "miopersonal.it/trainer/", their public link. */
    linkPrefix: string | null;
};

/**
 * "Scegli il tuo username": accounts from before the usernames confirm the
 * one they were given (or pick another) once, then it is locked.
 * See App\Http\Controllers\Auth\UsernameController.
 */
export default function ChooseUsername({ username, linkPrefix }: Props) {
    // The other pages open only after the confirmation: "Esci" is the way out.
    const signOut = (
        <Link href={logout()} as="button" className={authLinkClassName}>
            Esci
        </Link>
    );

    return (
        <>
            <Head title="Scegli il tuo username" />

            <AuthPhotoShell
                titleId="choose-username-title"
                title="Scegli il tuo username."
                desktopTitle={
                    <>
                        Scegli il tuo <strong>username</strong>.
                    </>
                }
                logoLinksHome={false}
                aside={signOut}
                mobileAction={signOut}
            >
                <Form
                    {...store.form()}
                    disableWhileProcessing
                    aria-labelledby="choose-username-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <AuthIntro>
                                {linkPrefix
                                    ? 'È il tuo nome su MioPersonal e il link della tua pagina pubblica. '
                                    : 'È il tuo nome su MioPersonal. '}
                                Ne abbiamo preparato uno per te: puoi tenerlo o
                                sceglierne un altro.{' '}
                                <strong className="text-foreground">
                                    Dopo la conferma non potrai più cambiarlo.
                                </strong>
                            </AuthIntro>

                            <UsernameField
                                dark
                                error={errors.username}
                                defaultValue={username}
                                linkPrefix={linkPrefix}
                                inputClassName={darkFieldClassName}
                            />

                            <button
                                type="submit"
                                disabled={processing}
                                className={authButtonClassName}
                            >
                                {processing && <Spinner />}
                                Conferma username
                            </button>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
