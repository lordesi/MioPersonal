import { Form, Head, Link } from '@inertiajs/react';
import { PhoneFields } from '@/components/auth/account-fields';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import FormField from '@/components/auth/form-field';
import MinimalHeader from '@/components/layout/minimal-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/google/register';
import { privacy, terms } from '@/routes/legal';

type Props = {
    /** From Google: it can't be changed here. */
    email: string;
    firstName: string;
    lastName: string;
};

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();
const inputClass = 'h-11 text-base md:text-base';

/**
 * "Registrati con Google", last step: Google gave name and email, the user
 * accepts the Terms (as in the normal sign-up) and adds the phone (required).
 * See App\Http\Controllers\Auth\GoogleAuthController.
 */
export default function GoogleSignUp({ email, firstName, lastName }: Props) {
    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Completa la registrazione" />

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
                    disableWhileProcessing
                    aria-labelledby="google-sign-up-title"
                    className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <h1
                                    id="google-sign-up-title"
                                    className="text-[28px] leading-8.5 font-semibold tracking-tight md:text-3xl"
                                >
                                    Ci sei quasi
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Controlla i tuoi dati e accetta i Termini
                                    per creare l’account.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Nome"
                                    error={errors.first_name}
                                >
                                    {({ id, describedBy }) => (
                                        <Input
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.first_name}
                                            name="first_name"
                                            defaultValue={firstName}
                                            required
                                            maxLength={100}
                                            autoComplete="given-name"
                                            className={inputClass}
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Cognome"
                                    error={errors.last_name}
                                >
                                    {({ id, describedBy }) => (
                                        <Input
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.last_name}
                                            name="last_name"
                                            defaultValue={lastName}
                                            required
                                            maxLength={100}
                                            autoComplete="family-name"
                                            className={inputClass}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <FormField label="Email">
                                {({ id }) => (
                                    <Input
                                        id={id}
                                        type="email"
                                        value={email}
                                        readOnly
                                        className={inputClass}
                                    />
                                )}
                            </FormField>

                            <PhoneFields errors={errors} />

                            <div className="border-t pt-4">
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
                            </div>

                            <Button
                                type="submit"
                                className="h-11"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Crea account
                            </Button>
                        </>
                    )}
                </Form>
            </main>
        </div>
    );
}
