import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Mail } from 'lucide-react';
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
    { title: 'Il team lo controlla', note: 'In corso' },
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
        <div className="flex flex-col gap-8 md:max-w-150">
            {!emailVerified && (
                <section
                    aria-labelledby="verify-title"
                    className="flex items-start gap-3 rounded-[20px] border border-brand p-4"
                >
                    <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand text-brand"
                    >
                        <Mail className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h2
                            id="verify-title"
                            className="text-[17px] leading-5.5 font-semibold"
                        >
                            Intanto conferma la tua email
                        </h2>
                        <span className="text-[13px] leading-4.5 [overflow-wrap:anywhere] text-muted-foreground">
                            Ti abbiamo mandato un link
                            {user?.email ? ` a ${user.email}` : ''}.
                        </span>
                        <button
                            type="button"
                            onClick={resend}
                            disabled={resent}
                            className="-mb-2.5 min-h-11 self-start text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:text-muted-foreground disabled:no-underline"
                        >
                            {resent
                                ? 'Email inviata di nuovo'
                                : 'Invia di nuovo'}
                        </button>
                    </span>
                </section>
            )}

            <section
                aria-labelledby="next-title"
                className="flex flex-col gap-3"
            >
                <h2
                    id="next-title"
                    className="text-[22px] leading-7 font-bold md:text-xl md:leading-6.25 md:font-semibold md:tracking-[-0.45px]"
                >
                    Cosa succede adesso
                </h2>
                <ol className="flex flex-col rounded-[26px] bg-card px-4">
                    {nextSteps.map((item, index) => (
                        <li
                            key={item.title}
                            aria-current={index === 1 ? 'step' : undefined}
                            className={cn(
                                'flex min-h-15 items-center gap-3 border-b border-separator last:border-b-0',
                                index === 2 && 'text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                                    index === 0 &&
                                        'border border-brand text-brand',
                                    index === 1 &&
                                        'border-[1.5px] border-brand text-brand',
                                    index === 2 &&
                                        'border border-dashed border-field',
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
                            <span className="flex flex-col">
                                <span className="text-[17px] font-semibold">
                                    {item.title}
                                </span>
                                <span
                                    className={cn(
                                        'text-[13px] leading-4.5',
                                        index === 1
                                            ? 'text-brand'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {item.note}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-6">
                <Link href={today()} className={shellNextClassName}>
                    Vai all’area trainer
                    <ArrowRight aria-hidden="true" className="size-4.5" />
                </Link>
                {previewHref && (
                    <Link
                        href={previewHref}
                        className={cn(
                            shellBackClassName,
                            'justify-center max-md:h-13 max-md:rounded-full max-md:no-underline max-md:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
                        )}
                    >
                        Vedi l’anteprima del profilo
                    </Link>
                )}
            </div>
        </div>
    );
}
