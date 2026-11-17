import { Form, Head, Link } from '@inertiajs/react';
import AuthPhotoShell, {
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import SocialSignIn from '@/components/auth/social-sign-in';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { darkFieldClassName, darkSwitchClassName } from '@/lib/dark-form';
import { register } from '@/routes';
import { privacy, terms } from '@/routes/legal';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    googleEnabled: boolean;
};

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

/**
 * Login of the dark design: on phones the photo on top and the form at the
 * bottom (design "LoginPalestra"); on desktop the photo fills the screen and
 * the form sits on the left (design "DkAccessoPieno").
 */
export default function Login({
    status,
    canResetPassword,
    googleEnabled,
}: Props) {
    return (
        <>
            <Head title="Accedi" />

            <AuthPhotoShell
                titleId="login-title"
                title="Accedi e inizia qui il tuo allenamento."
                desktopTitle="Bentornato. Il tuo allenamento ti aspetta."
                aside={
                    <>
                        Non hai un account?
                        <Link href={register()} className={authLinkClassName}>
                            Registrati
                        </Link>
                    </>
                }
            >
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    aria-labelledby="login-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            {status && (
                                <p
                                    role="status"
                                    className="rounded-[14px] px-4 py-3 text-[15px] shadow-[inset_0_0_0_1px_var(--brand)]"
                                >
                                    {status}
                                </p>
                            )}

                            <SocialSignIn
                                verb="Continua con"
                                googleEnabled={googleEnabled}
                                className="h-12.5 rounded-full text-[17px]"
                                dividerLabel="oppure con email"
                            />

                            <FormField label="Email" error={errors.email}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.email}
                                        type="email"
                                        name="email"
                                        inputMode="email"
                                        required
                                        autoComplete="email"
                                        placeholder="nome@esempio.it"
                                        className={darkFieldClassName}
                                    />
                                )}
                            </FormField>

                            <FormField label="Password" error={errors.password}>
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.password}
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="La tua password"
                                        className={darkFieldClassName}
                                    />
                                )}
                            </FormField>

                            <div className="-my-1 flex flex-wrap items-center justify-between gap-x-2">
                                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                                    <Switch
                                        name="remember"
                                        defaultChecked
                                        className={darkSwitchClassName}
                                    />
                                    Resta collegato
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={request()}
                                        className={authLinkClassName}
                                    >
                                        Password dimenticata?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="login-button"
                                className="btn-brand h-12.5 text-[17px]"
                            >
                                {processing && <Spinner />}
                                Accedi
                            </button>

                            <p className="flex items-center justify-center gap-1.5 text-[15px] md:hidden">
                                Non hai un account?
                                <Link
                                    href={register()}
                                    className={authLinkClassName}
                                >
                                    Registrati
                                </Link>
                            </p>

                            <p className="text-center text-[13px] leading-4.5 text-muted-foreground md:mt-1">
                                Accedendo accetti i{' '}
                                <a
                                    href={TERMS_HREF}
                                    className="text-foreground underline"
                                >
                                    Termini
                                </a>{' '}
                                e l'
                                <a
                                    href={PRIVACY_HREF}
                                    className="text-foreground underline"
                                >
                                    Informativa privacy
                                </a>
                                .
                            </p>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
