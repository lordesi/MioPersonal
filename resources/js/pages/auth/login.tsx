import { Form, Head, Link } from '@inertiajs/react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import SocialSignIn, { TextDivider } from '@/components/auth/social-sign-in';
import BrandLogo from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { privacy, terms } from '@/routes/legal';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { register as trainerRegister } from '@/routes/trainer';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

export default function Login({ status, canResetPassword }: Props) {
    const forgotPassword = canResetPassword && (
        <Link
            href={request()}
            className="text-sm text-muted-foreground hover:underline"
        >
            Password dimenticata?
        </Link>
    );

    return (
        <>
            <Head title="Accedi" />

            <div className="flex min-h-screen flex-wrap bg-background">
                <section
                    aria-label="MioPersonal"
                    className="hidden flex-[1_1_480px] flex-col justify-between gap-12 bg-primary p-12 text-primary-foreground md:flex"
                >
                    <BrandLogo className="text-primary-foreground" />
                    <div className="flex max-w-120 flex-col gap-4">
                        <p className="text-5xl leading-13 font-bold tracking-tight">
                            Il tuo allenamento, a un messaggio di distanza.
                        </p>
                        <p className="text-lg opacity-75">
                            Accedi per seguire le tue richieste, vedere i
                            contatti dei trainer e lasciare recensioni.
                        </p>
                    </div>
                    <p className="text-xs opacity-60">
                        © 2026 MioPersonal · Versione beta
                    </p>
                </section>

                <main className="flex flex-[1_1_480px] flex-col items-center justify-center px-4 py-8 md:px-6 md:py-12">
                    <div className="mb-8 self-start md:hidden">
                        <BrandLogo />
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        aria-labelledby="login-title"
                        className="flex w-full max-w-100 flex-col gap-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <h1
                                        id="login-title"
                                        className="text-3xl font-semibold tracking-tight"
                                    >
                                        Accedi
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Un solo accesso per clienti e trainer.
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

                                <SocialSignIn verb="Continua con" />

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

                                <FormField
                                    label="Password"
                                    error={errors.password}
                                    labelAside={
                                        <span className="hidden md:inline">
                                            {forgotPassword}
                                        </span>
                                    }
                                >
                                    {({ id, describedBy }) => (
                                        <PasswordField
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.password}
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                        />
                                    )}
                                </FormField>
                                <span className="-mt-3 md:hidden">
                                    {forgotPassword}
                                </span>

                                <div className="flex items-center gap-2.5">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        defaultChecked
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="font-normal"
                                    >
                                        Resta collegato su questo dispositivo
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="h-11"
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Accedi
                                </Button>

                                <TextDivider>Non hai un account?</TextDivider>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-11"
                                    >
                                        <Link href={register()}>
                                            Sono un cliente
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-11"
                                    >
                                        <Link href={trainerRegister()}>
                                            Sono un trainer
                                        </Link>
                                    </Button>
                                </div>

                                <p className="text-center text-xs text-muted-foreground">
                                    Accedendo accetti i{' '}
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
