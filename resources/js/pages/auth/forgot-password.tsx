import { Form, Head, Link } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import AuthPhotoShell, {
    AuthFieldIcon,
    authIconFieldClassName,
    AuthIntro,
    AuthStatus,
    authButtonClassName,
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
import FormField from '@/components/auth/form-field';
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
    const backToLogin = (
        <>
            Ricordi la password?
            <Link href={login()} className={authLinkClassName}>
                Accedi
            </Link>
        </>
    );

    return (
        <>
            <Head title="Password dimenticata" />

            <AuthPhotoShell
                titleId="forgot-password-title"
                title="Password dimenticata?"
                desktopTitle={
                    <>
                        Recupera la tua <strong>password</strong>.
                    </>
                }
                aside={backToLogin}
            >
                <Form
                    {...email.form()}
                    aria-labelledby="forgot-password-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <AuthIntro>
                                Scrivi l’email del tuo account: ti mandiamo un
                                link per sceglierne una nuova.
                            </AuthIntro>

                            {status && <AuthStatus>{status}</AuthStatus>}

                            <FormField label="Email" error={errors.email}>
                                {({ id, describedBy }) => (
                                    <div className="relative">
                                        <AuthFieldIcon icon={Mail} />
                                        <Input
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.email}
                                            type="email"
                                            name="email"
                                            inputMode="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="nome@esempio.it"
                                            className={authIconFieldClassName}
                                        />
                                    </div>
                                )}
                            </FormField>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                                className={authButtonClassName}
                            >
                                {processing && <Spinner />}
                                Inviami il link
                            </button>

                            <p className="flex items-center justify-center gap-1.5 text-[15px] md:hidden">
                                {backToLogin}
                            </p>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
