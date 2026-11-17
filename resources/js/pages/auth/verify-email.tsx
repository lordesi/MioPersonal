import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import AuthPhotoShell, {
    AuthIntro,
    AuthStatus,
    authButtonClassName,
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
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
        { trainer: 'nella tua area trainer', gym: 'nella tua area palestra' }[
            user.role as 'trainer' | 'gym'
        ] ?? 'nel tuo account';

    const signOut = (
        <Link href={logout()} as="button" className={authLinkClassName}>
            Esci
        </Link>
    );

    return (
        <>
            <Head title="Conferma la tua email" />

            <AuthPhotoShell
                titleId="verify-email-title"
                title="Conferma la tua email."
                desktopTitle={
                    <>
                        Ci sei quasi: <strong>conferma la tua email</strong>.
                    </>
                }
                aside={
                    <>
                        Non è la tua email?
                        {signOut}
                    </>
                }
                mobileAction={signOut}
            >
                <span
                    aria-hidden="true"
                    className="order-first flex size-14 items-center justify-center rounded-full border-[1.5px] border-brand bg-[rgba(10,10,10,0.55)] text-brand"
                >
                    <Mail className="size-7" />
                </span>

                <AuthIntro>
                    Abbiamo mandato un link a{' '}
                    <strong className="font-semibold break-all text-foreground">
                        {user.email}
                    </strong>
                    : serve per entrare {area}.
                </AuthIntro>

                <ol className="flex flex-col gap-3 rounded-[20px] bg-card p-4 text-[15px]">
                    <Step number={1}>Apri l’email di MioPersonal</Step>
                    <Step number={2}>
                        Clicca <strong>Conferma la tua email</strong>
                    </Step>
                </ol>

                {status === 'verification-link-sent' && (
                    <AuthStatus>Ti abbiamo mandato un nuovo link.</AuthStatus>
                )}

                <Form {...send.form()} className="flex flex-col">
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing}
                            className={authButtonClassName}
                        >
                            {processing && <Spinner />}
                            Invia di nuovo il link
                        </button>
                    )}
                </Form>

                <p className="text-center text-[13px] leading-4.5 text-muted-foreground">
                    Non trovi l’email? Controlla nello spam.
                </p>
            </AuthPhotoShell>
        </>
    );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
    return (
        <li className="flex items-center gap-3">
            <span
                aria-hidden="true"
                className="flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-semibold text-brand tabular-nums shadow-[inset_0_0_0_1px_var(--brand)]"
            >
                {number}
            </span>
            <span>{children}</span>
        </li>
    );
}
