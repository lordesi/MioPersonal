import { Form, Head, Link } from '@inertiajs/react';
import UsernameField from '@/components/auth/username-field';
import MinimalHeader from '@/components/layout/minimal-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Scegli il tuo username" />

            {/* The other pages open only after the confirmation. */}
            <MinimalHeader logoLinksHome={false}>
                <Link
                    href={logout()}
                    as="button"
                    className="font-medium text-primary-foreground underline"
                >
                    Esci
                </Link>
            </MinimalHeader>

            <main className="mx-auto w-full max-w-xl px-4 pt-5 pb-10 md:px-8 md:pt-12 md:pb-20">
                <Form
                    {...store.form()}
                    disableWhileProcessing
                    aria-labelledby="choose-username-title"
                    className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <h1
                                    id="choose-username-title"
                                    className="text-[28px] leading-8.5 font-semibold tracking-tight md:text-3xl"
                                >
                                    Scegli il tuo username
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {linkPrefix
                                        ? 'È il tuo nome su MioPersonal e il link della tua pagina pubblica. '
                                        : 'È il tuo nome su MioPersonal. '}
                                    Ne abbiamo preparato uno per te: puoi
                                    tenerlo o sceglierne un altro.{' '}
                                    <strong className="text-foreground">
                                        Dopo la conferma non potrai più
                                        cambiarlo.
                                    </strong>
                                </p>
                            </div>

                            <UsernameField
                                error={errors.username}
                                defaultValue={username}
                                linkPrefix={linkPrefix}
                            />

                            <Button
                                type="submit"
                                className="h-11"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Conferma username
                            </Button>
                        </>
                    )}
                </Form>
            </main>
        </div>
    );
}
