import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import MinimalHeader from '@/components/layout/minimal-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Nuova password" />

            <MinimalHeader>
                Ricordi la password?
                <Link
                    href={login()}
                    className="font-medium text-primary-foreground underline"
                >
                    Accedi
                </Link>
            </MinimalHeader>

            <main className="mx-auto w-full max-w-md px-4 pt-5 pb-10 md:px-8 md:pt-12 md:pb-20">
                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                    aria-labelledby="reset-password-title"
                    className="flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <h1
                                id="reset-password-title"
                                className="text-[28px] leading-8.5 font-semibold tracking-tight md:text-3xl"
                            >
                                Scegli una nuova password
                            </h1>

                            {/* An expired or already used link. */}
                            {errors.email && (
                                <div
                                    role="alert"
                                    className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5 text-sm"
                                >
                                    {errors.email}
                                    <Link
                                        href={request()}
                                        className="font-medium underline"
                                    >
                                        Richiedi un nuovo link
                                    </Link>
                                </div>
                            )}

                            <FormField label="Email">
                                {({ id }) => (
                                    <Input
                                        id={id}
                                        type="email"
                                        value={email}
                                        readOnly
                                        autoComplete="username"
                                        className="h-11 text-base md:text-base"
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Nuova password"
                                hint={<PasswordRequirements value={password} />}
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
                                    />
                                )}
                            </FormField>

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
                                    />
                                )}
                            </FormField>

                            <Button
                                type="submit"
                                className="h-11"
                                disabled={processing}
                                data-test="reset-password-button"
                            >
                                {processing && <Spinner />}
                                Salva la nuova password
                            </Button>
                        </>
                    )}
                </Form>
            </main>
        </div>
    );
}
