import { Form, Head, Link } from '@inertiajs/react';
import FormField from '@/components/auth/form-field';
import MinimalHeader from '@/components/layout/minimal-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

/**
 * Step 1 of "Password dimenticata?": the email gets a link to
 * reset-password.tsx. The message is the same whether the email has an
 * account or not (see FailedPasswordResetLinkResponse).
 */
export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Password dimenticata" />

            <MinimalHeader>
                Ricordi la password?
                <Link
                    href={login()}
                    className="font-medium text-foreground underline"
                >
                    Accedi
                </Link>
            </MinimalHeader>

            <main className="mx-auto w-full max-w-md px-4 pt-5 pb-10 md:px-8 md:pt-12 md:pb-20">
                <Form
                    {...email.form()}
                    aria-labelledby="forgot-password-title"
                    className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <h1
                                    id="forgot-password-title"
                                    className="text-[28px] leading-8.5 font-semibold tracking-tight md:text-3xl"
                                >
                                    Password dimenticata?
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Scrivi l’email del tuo account: ti mandiamo
                                    un link per sceglierne una nuova.
                                </p>
                            </div>

                            {status && (
                                <p
                                    role="status"
                                    className="rounded-lg bg-muted px-3 py-2.5 text-sm"
                                >
                                    {status}
                                </p>
                            )}

                            <FormField label="Email" error={errors.email}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.email}
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="nome@esempio.it"
                                        className="h-11 text-base md:text-base"
                                    />
                                )}
                            </FormField>

                            <Button
                                type="submit"
                                className="h-11"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner />}
                                Inviami il link
                            </Button>
                        </>
                    )}
                </Form>
            </main>
        </div>
    );
}
