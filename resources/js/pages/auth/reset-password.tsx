import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AuthPhotoShell, {
    AuthStatus,
    authButtonClassName,
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { darkFieldClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { request, update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

/**
 * Step 2 of "Password dimenticata?", opened from the link in the email.
 * Afterwards Fortify goes back to the login page with "Password aggiornata".
 */
export default function ResetPassword({ token, email }: Props) {
    const [password, setPassword] = useState('');

    return (
        <>
            <Head title="Nuova password" />

            <AuthPhotoShell
                titleId="reset-password-title"
                title="Scegli una nuova password."
                desktopTitle={
                    <>
                        Scegli una <strong>nuova password</strong>.
                    </>
                }
                aside={
                    <>
                        Ricordi la password?
                        <Link href={login()} className={authLinkClassName}>
                            Accedi
                        </Link>
                    </>
                }
            >
                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                    aria-labelledby="reset-password-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* An expired or already used link. */}
                            {errors.email && (
                                <AuthStatus tone="alert">
                                    {errors.email}
                                    <Link
                                        href={request()}
                                        className={cn(
                                            authLinkClassName,
                                            'min-h-0 self-start',
                                        )}
                                    >
                                        Richiedi un nuovo link
                                    </Link>
                                </AuthStatus>
                            )}

                            <FormField label="Email">
                                {({ id }) => (
                                    <Input
                                        id={id}
                                        type="email"
                                        value={email}
                                        readOnly
                                        autoComplete="username"
                                        className={cn(
                                            darkFieldClassName,
                                            'text-muted-foreground',
                                        )}
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Nuova password"
                                error={errors.password}
                            >
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.password}
                                        name="password"
                                        required
                                        autoFocus
                                        pattern={PASSWORD_PATTERN}
                                        data-pattern-message={
                                            PASSWORD_PATTERN_MESSAGE
                                        }
                                        autoComplete="new-password"
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        className={darkFieldClassName}
                                    />
                                )}
                            </FormField>
                            <PasswordRequirements
                                value={password}
                                variant="dark"
                            />

                            <FormField
                                label="Ripeti la password"
                                error={errors.password_confirmation}
                            >
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={
                                            !!errors.password_confirmation
                                        }
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        className={darkFieldClassName}
                                    />
                                )}
                            </FormField>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="reset-password-button"
                                className={cn(authButtonClassName, 'mt-1')}
                            >
                                {processing && <Spinner />}
                                Salva la nuova password
                            </button>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
