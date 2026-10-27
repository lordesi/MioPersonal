import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { useId } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import type { ClientTrainer } from '@/types';

type NoUpcomingSessionsProps = {
    bookUrl: string;
    /** The trainer of the last session: "Riprendi con …". Null for a new client. */
    trainer: ClientTrainer | null;
    /** Sessions still to book in the packages with that trainer. */
    packageSessionsLeft: number;
};

/**
 * "Nessuna seduta in programma": the black card at the top of the client
 * dashboard when nothing is booked. With a trainer already met it offers to
 * book with them again; a new client only gets the search.
 */
export default function NoUpcomingSessions({
    bookUrl,
    trainer,
    packageSessionsLeft,
}: NoUpcomingSessionsProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-col gap-5.5 rounded-3xl bg-sidebar p-5 text-sidebar-foreground md:p-7"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex max-w-115 flex-col gap-2">
                    <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                        PROSSIMA SEDUTA
                    </span>
                    <h2
                        id={titleId}
                        className="text-[28px] leading-8.5 font-bold tracking-[-0.02em]"
                    >
                        Nessuna seduta in programma
                    </h2>
                </div>
                <span
                    aria-hidden="true"
                    className="flex size-14 flex-none items-center justify-center rounded-2xl bg-sidebar-accent"
                >
                    <CalendarDays className="size-6" />
                </span>
            </div>

            {trainer ? (
                <>
                    <div className="flex flex-wrap items-center gap-3.5 rounded-[18px] bg-sidebar-accent p-4">
                        <UserAvatar
                            name={trainer.name}
                            size="lg"
                            className="size-11 text-sm [&_[data-slot=avatar-fallback]]:bg-sidebar-primary [&_[data-slot=avatar-fallback]]:text-sidebar-primary-foreground"
                        />
                        <span className="flex min-w-50 flex-1 flex-col gap-0.5">
                            <span className="text-[15px] leading-5.5 font-semibold">
                                Riprendi con {trainer.firstName}
                            </span>
                            {packageSessionsLeft > 0 && (
                                <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground tabular-nums">
                                    {packageDetail(packageSessionsLeft)}
                                </span>
                            )}
                        </span>
                        <Button
                            asChild
                            className="h-10.5 rounded-[10px] bg-sidebar-primary px-4 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        >
                            <Link href={trainer.href}>
                                Prenota ora
                                <ArrowRight
                                    aria-hidden="true"
                                    strokeWidth={2.5}
                                />
                            </Link>
                        </Button>
                    </div>
                    <Link
                        href={bookUrl}
                        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-sidebar-foreground/90 hover:underline"
                    >
                        <Search aria-hidden="true" className="size-3.75" />
                        Oppure cerca un altro trainer
                    </Link>
                </>
            ) : (
                <Button
                    asChild
                    className="h-11 self-start rounded-[10px] bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                >
                    <Link href={bookUrl}>
                        <Search aria-hidden="true" />
                        Cerca un trainer
                    </Link>
                </Button>
            )}
        </section>
    );
}

/** "Hai ancora 8 sedute del pacchetto" */
function packageDetail(sessionsLeft: number): string {
    const sessions = sessionsLeft === 1 ? '1 seduta' : `${sessionsLeft} sedute`;

    return `Hai ancora ${sessions} del pacchetto`;
}
