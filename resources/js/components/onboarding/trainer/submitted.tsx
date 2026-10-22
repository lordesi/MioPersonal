import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check } from 'lucide-react';
import { nextSteps } from '@/components/onboarding/trainer/step-review';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { today } from '@/routes/trainer';

type SubmittedProps = {
    /** The trainer's own profile, visible only to them until it is approved. */
    previewHref: string | null;
};

/** Shown after sending the registration: the profile waits for approval. */
export default function Submitted({ previewHref }: SubmittedProps) {
    const user = usePage().props.auth?.user;
    const firstName = user?.name.split(' ')[0] ?? '';
    // A client who became a trainer already verified the email: no new link.
    const emailVerified = !!user?.email_verified_at;

    return (
        <section
            aria-labelledby="submitted-title"
            className="flex flex-wrap items-center gap-8 rounded-[28px] bg-sidebar p-6 text-sidebar-foreground md:p-10"
        >
            <div className="flex min-w-0 flex-[3_1_420px] flex-col gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                    <Check
                        aria-hidden="true"
                        strokeWidth={3}
                        className="size-6.5"
                    />
                </span>
                <h1
                    id="submitted-title"
                    className="text-[34px] leading-10 font-bold tracking-[-0.03em] md:text-[40px] md:leading-[46px]"
                >
                    Profilo inviato
                </h1>
                <p className="max-w-130 text-base text-sidebar-foreground/85">
                    Grazie{firstName && ` ${firstName}`}. Il nostro team lo
                    controlla e ti scrive
                    {user?.email ? ` a ${user.email}` : ''} appena è pubblicato.{' '}
                    {emailVerified
                        ? 'Intanto puoi già esplorare la tua area trainer.'
                        : 'Intanto conferma la tua email: ti abbiamo mandato un link.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                    <Button
                        asChild
                        className="h-11.5 rounded-xl bg-sidebar-primary px-5 text-[15px] font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    >
                        <Link href={today()}>
                            Vai all’area trainer
                            <ArrowRight aria-hidden="true" strokeWidth={2.5} />
                        </Link>
                    </Button>
                    {previewHref && (
                        <Button
                            asChild
                            variant="outline"
                            className="h-11.5 rounded-xl border-sidebar-border bg-transparent px-4.5 text-[15px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            <Link href={previewHref}>
                                Vedi l’anteprima del profilo
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <ol className="flex min-w-0 flex-[2_1_300px] flex-col gap-3.5 rounded-[20px] bg-sidebar-accent p-5">
                {nextSteps.map((item, index) => (
                    <li key={item.title} className="flex gap-3">
                        <span
                            className={cn(
                                'flex size-6 flex-none items-center justify-center rounded-full text-xs font-bold tabular-nums',
                                index === 0
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                    : 'bg-sidebar-border',
                            )}
                        >
                            {index === 0 ? (
                                <Check
                                    aria-label="fatto"
                                    strokeWidth={3}
                                    className="size-3.5"
                                />
                            ) : (
                                index + 1
                            )}
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold">
                                {index === 0 ? 'Profilo inviato' : item.title}
                            </span>
                            <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                                {index === 0
                                    ? 'Fatto. Non devi fare altro.'
                                    : item.text}
                            </span>
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
