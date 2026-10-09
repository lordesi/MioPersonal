import { Form, Head, Link } from '@inertiajs/react';
import AccountFields from '@/components/auth/account-fields';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import SocialSignIn from '@/components/auth/social-sign-in';
import MinimalHeader from '@/components/layout/minimal-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { privacy, terms } from '@/routes/legal';
import { store } from '@/routes/register';
import { register as trainerRegister } from '@/routes/trainer';

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

export default function Register() {
    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Crea il tuo account" />

            <MinimalHeader>
                Hai già un account?
                <Link
                    href={login()}
                    className="font-medium text-foreground underline"
                >
                    Accedi
                </Link>
            </MinimalHeader>

            <main className="mx-auto w-full max-w-xl px-4 pt-5 pb-10 md:px-8 md:pt-12 md:pb-20">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    disableWhileProcessing
                    aria-labelledby="register-title"
                    className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <h1
                                    id="register-title"
                                    className="text-[28px] leading-8.5 font-semibold tracking-tight md:text-3xl"
                                >
                                    Crea il tuo account
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Per inviare richieste ai trainer e seguire
                                    le tue sedute.
                                </p>
                            </div>

                            <SocialSignIn verb="Registrati con" />

                            <AccountFields
                                errors={errors}
                                emailHint="Ti mandiamo un link per verificarla."
                            />

                            <fieldset className="flex flex-col gap-3 border-t pt-4">
                                <legend className="sr-only">Consensi</legend>
                                <ConsentCheckbox
                                    name="terms"
                                    required
                                    error={errors.terms}
                                >
                                    Ho almeno 18 anni e accetto i{' '}
                                    <a href={TERMS_HREF} className="underline">
                                        Termini
                                    </a>{' '}
                                    e l'
                                    <a
                                        href={PRIVACY_HREF}
                                        className="underline"
                                    >
                                        Informativa privacy
                                    </a>
                                    .{' '}
                                    <span className="text-muted-foreground">
                                        (obbligatorio)
                                    </span>
                                </ConsentCheckbox>
                                {/* TODO: "Voglio ricevere novità…" (facoltativo) needs a
                                    marketing consent column: add it with that migration. */}
                            </fieldset>

                            <Button
                                type="submit"
                                className="h-11"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Crea account
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Sei un personal trainer?{' '}
                                <Link
                                    href={trainerRegister()}
                                    className="font-medium text-foreground underline"
                                >
                                    Crea il tuo profilo
                                </Link>
                            </p>
                        </>
                    )}
                </Form>
            </main>
        </div>
    );
}
