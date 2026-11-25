import { Link, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import {
    shellBackClassName,
    shellNextClassName,
} from '@/components/onboarding/dark-shell';
import { cn } from '@/lib/utils';
import { today } from '@/routes/trainer';
import { send } from '@/routes/verification';

/** What happens after sending: the first step is already done. */
const nextSteps = [
    { title: 'Profilo inviato', note: 'Fatto' },
    { title: 'Il team lo controlla', note: 'Di solito entro 48 ore' },
    { title: 'Vai online', note: 'Ti avvisiamo via email' },
];

type SubmittedProps = {
    /** The trainer's own profile, visible only to them until it is approved. */
    previewHref: string | null;
};

/** The words under "Profilo inviato": "Grazie Davide. Il nostro team…". */
export function submittedIntro(name: string | undefined): string {
    const firstName = name?.split(' ')[0] ?? '';

    return `Grazie${firstName && ` ${firstName}`}. Il nostro team lo controlla e ti scrive appena è pubblicato.`;
}

/**
 * Under "Profilo inviato": confirm the email (a new account), what happens
 * now, and the links to the trainer area and to the preview.
 */
export default function Submitted({ previewHref }: SubmittedProps) {
    const user = usePage().props.auth?.user;
    // A client who became a trainer already verified the email: no new link.
    const emailVerified = !!user?.email_verified_at;
    const [resent, setResent] = useState(false);

    const resend = () =>
        router.post(
            send.url(),
            {},
            { preserveScroll: true, onSuccess: () => setResent(true) },
        );

    return (
        <div className="flex flex-col gap-8">
            <ol aria-label="Cosa succede adesso" className="flex flex-col">
                {nextSteps.map((item, index) => (
                    <li
                        key={item.title}
                        aria-current={index === 1 ? 'step' : undefined}
                        className="flex min-h-14 items-center gap-3.5"
                    >
                        <span
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold',
                                index === 0
                                    ? 'bg-brand text-black'
                                    : 'text-muted-foreground shadow-[inset_0_0_0_1.5px_var(--input)]',
                            )}
                        >
                            {index === 0 ? (
                                <Check
                                    role="img"
                                    aria-label="Fatto"
                                    className="size-3.5"
                                    strokeWidth={3}
                                />
                            ) : (
                                index + 1
                            )}
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className="text-[17px] font-semibold">
                                {item.title}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {item.note}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>

            {!emailVerified && (
                <section
                    aria-labelledby="verify-title"
                    className="flex items-center gap-3.5 border-y border-separator py-4"
                >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h2
                            id="verify-title"
                            className="text-[17px] font-semibold"
                        >
                            Conferma la tua email
                        </h2>
                        <span className="text-[13px] leading-4.5 [overflow-wrap:anywhere] text-muted-foreground">
                            Ti abbiamo mandato un link
                            {user?.email ? ` a ${user.email}` : ''}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={resend}
                        disabled={resent}
                        className="min-h-11 shrink-0 text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:text-muted-foreground disabled:no-underline"
                    >
                        {resent ? 'Inviata' : 'Invia di nuovo'}
                    </button>
                </section>
            )}

            <div className="flex flex-col gap-2">
                <Link href={today()} className={shellNextClassName}>
                    Vai all’area trainer
                </Link>
                {previewHref && (
                    <Link href={previewHref} className={shellBackClassName}>
                        Vedi l’anteprima del profilo
                    </Link>
                )}
            </div>
        </div>
    );
}
