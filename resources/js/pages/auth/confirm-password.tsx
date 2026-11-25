import { Form, Head } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import AuthPhotoShell, {
    AuthFieldIcon,
    authIconFieldClassName,
    authToggleClassName,
    AuthIntro,
    authButtonClassName,
} from '@/components/auth/auth-photo-shell';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

/** Fortify's "conferma la password" before a protected page (route password.confirm). */
export default function ConfirmPassword() {
    return (
        <>
            <Head title="Conferma la password" />

            <AuthPhotoShell
                titleId="confirm-password-title"
                title="Conferma la password."
                desktopTitle={
                    <>
                        Conferma la <strong>password</strong>.
                    </>
                }
            >
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    aria-labelledby="confirm-password-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <AuthIntro>
                                Per sicurezza, scrivi di nuovo la password prima
                                di continuare.
                            </AuthIntro>

                            <FormField label="Password" error={errors.password}>
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.password}
                                        name="password"
                                        required
                                        autoFocus
                                        autoComplete="current-password"
                                        placeholder="La tua password"
                                        icon={<AuthFieldIcon icon={Lock} />}
                                        className={authIconFieldClassName}
                                        toggleClassName={authToggleClassName}
                                    />
                                )}
                            </FormField>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="confirm-password-button"
                                className={authButtonClassName}
                            >
                                {processing && <Spinner />}
                                Conferma
                            </button>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
