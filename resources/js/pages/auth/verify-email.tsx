import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import BrandPanel from '@/components/auth/brand-panel';
import BrandLogo from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

/**
 * "Conferma la tua email": where Laravel sends whoever opens a page behind the
 * `verified` middleware before clicking the link in the email. The link
 * confirms the address by itself: nobody in the team has to approve it.
 */
export default function VerifyEmail({ status }: { status?: string }) {
    const { user } = usePage().props.auth;
    const area =
        user.role === 'trainer' ? 'nella tua area trainer' : 'nel tuo account';

    return (
        <>
            <Head title="Conferma la tua email" />

            <div className="flex min-h-screen flex-wrap bg-background">
                <BrandPanel
                    title="Ci sei quasi."
                    text="Un clic sul link che ti abbiamo mandato e il tuo account è pronto."
                />

                <main className="flex flex-[1_1_480px] flex-col items-center justify-center px-4 py-8 md:px-6 md:py-12">
                    <div className="mb-8 self-start md:hidden">
                        <BrandLogo />
                    </div>

                    <div className="flex w-full max-w-100 flex-col gap-5">
                        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Mail aria-hidden="true" className="size-7" />
                        </span>

                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Conferma la tua email
                            </h1>
                            <p className="text-muted-foreground">
                                Abbiamo mandato un link a{' '}
                                <strong className="font-semibold break-all text-foreground">
                                    {user.email}
                                </strong>
                                : serve per entrare {area}.
                            </p>
                        </div>

                        <ol className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm">
                            <Step number={1}>Apri l’email di MioPersonal</Step>
                            <Step number={2}>
                                Clicca <strong>Conferma la tua email</strong>
                            </Step>
                        </ol>

                        {status === 'verification-link-sent' && (
                            <p
                                role="status"
                                className="rounded-lg bg-muted px-3 py-2.5 text-sm"
                            >
                                Ti abbiamo mandato un nuovo link.
                            </p>
                        )}

                        <Form {...send.form()} className="flex flex-col">
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="h-11"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Invia di nuovo il link
                                </Button>
                            )}
                        </Form>

                        <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
                            <p>Non trovi l’email? Controlla nello spam.</p>
                            <p>
                                Non è la tua email?{' '}
                                <Link
                                    href={logout()}
                                    as="button"
                                    className="font-medium text-foreground underline"
                                >
                                    Esci
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

function Step({
    number,
    children,
}: {
    number: number;
    children: React.ReactNode;
}) {
    return (
        <li className="flex items-center gap-3">
            <span
                aria-hidden="true"
                className="flex size-6 flex-none items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums"
            >
                {number}
            </span>
            <span>{children}</span>
        </li>
    );
}
