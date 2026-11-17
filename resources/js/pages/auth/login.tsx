import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import SocialSignIn from '@/components/auth/social-sign-in';
import { DarkLogo } from '@/components/mp/dark-header';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { darkFieldClassName, darkSwitchClassName } from '@/lib/dark-form';
import { home, register } from '@/routes';
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

/** Turquoise links: "Registrati", "Password dimenticata?". */
const brandLink =
    'flex min-h-11 items-center text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50';

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

            <div className="theme-dark relative isolate flex min-h-dvh flex-col overflow-hidden">
                <picture>
                    <source
                        media="(min-width: 768px)"
                        srcSet="/images/design/login-desktop.webp"
                    />
                    <img
                        src="/images/design/login-mobile.webp"
                        alt=""
                        fetchPriority="high"
                        className="absolute inset-x-0 top-0 -z-10 h-140 w-full object-cover object-[50%_32%] md:inset-0 md:h-full md:object-center"
                    />
                </picture>
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-10 h-140 bg-[linear-gradient(180deg,rgba(10,10,10,0.65)_0%,rgba(10,10,10,0)_16%,rgba(10,10,10,0.1)_42%,rgba(10,10,10,0.88)_70%,#0a0a0a_100%)] md:inset-0 md:h-full md:bg-[linear-gradient(90deg,#0a0a0a_0%,rgba(10,10,10,0.92)_34%,rgba(10,10,10,0.2)_62%,rgba(10,10,10,0)_100%),linear-gradient(180deg,rgba(10,10,10,0.5)_0%,rgba(10,10,10,0)_16%)]"
                />

                <header className="md:absolute md:inset-x-0 md:top-0 md:z-10">
                    <nav
                        aria-label="Principale"
                        className="mx-auto mt-2 flex h-13 max-w-300 items-center justify-between gap-6 pr-2 pl-4 md:mt-0 md:h-auto md:px-8 md:pt-6"
                    >
                        <DarkLogo />
                        <Link
                            href={home()}
                            aria-label="Chiudi e torna alla home"
                            className="group flex size-11 items-center justify-center rounded-full outline-none md:hidden"
                        >
                            <span className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-foreground group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50">
                                <X
                                    aria-hidden="true"
                                    className="size-4"
                                    strokeWidth={2.2}
                                />
                            </span>
                        </Link>
                        <p className="hidden items-center gap-1.5 text-[15px] text-muted-foreground md:flex">
                            Non hai un account?
                            <Link href={register()} className={brandLink}>
                                Registrati
                            </Link>
                        </p>
                    </nav>
                </header>

                <main className="mt-auto px-4 pt-50 pb-4 md:mx-auto md:my-0 md:flex md:min-h-dvh md:w-full md:max-w-300 md:items-center md:px-8 md:py-24">
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        aria-labelledby="login-title"
                        className="flex w-full flex-col gap-3 md:w-105 md:gap-3.5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <h1
                                    id="login-title"
                                    className="mb-1 text-[26px] leading-[1.12] font-bold tracking-[-0.02em] text-balance md:mb-2 md:text-[40px] md:leading-[1.1] md:font-light md:tracking-[-0.03em]"
                                >
                                    <span className="md:hidden">
                                        Accedi e inizia qui il tuo allenamento.
                                    </span>
                                    <span className="hidden md:inline">
                                        Bentornato. Il tuo allenamento ti
                                        aspetta.
                                    </span>
                                </h1>

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

                                <FormField
                                    label="Password"
                                    error={errors.password}
                                >
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
                                            className={brandLink}
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
                                        className={brandLink}
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
                </main>
            </div>
        </>
    );
}
