import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import FavoriteTrainers from '@/components/client/favorite-trainers';
import NoUpcomingSessions from '@/components/client/no-upcoming-sessions';
import PendingBookingCard from '@/components/client/pending-booking-card';
import UpcomingBookingCard from '@/components/client/upcoming-booking-card';
import SectionLabel from '@/components/shared/section-label';
import TrainerCard from '@/components/trainer/trainer-card';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import {
    bookings,
    completeProfile,
    favorites as favoritesPage,
} from '@/routes/client';
import type {
    ClientPendingBooking,
    ClientUpcomingBooking,
    FavoriteTrainer,
    TrainerSummary,
} from '@/types';

type HomeProps = {
    firstName: string;
    upcomingCount: number;
    nextBooking: ClientUpcomingBooking | null;
    pending: ClientPendingBooking[];
    favorites: FavoriteTrainer[];
    recommended: TrainerSummary[];
    /** False until the client fills in "Completa il tuo profilo". */
    hasPreferences: boolean;
    /** The client's city: "Prenota una seduta" opens its search. */
    citySlug: string | null;
};

export default function Home({
    firstName,
    upcomingCount,
    nextBooking,
    pending,
    favorites,
    recommended,
    hasPreferences,
    citySlug,
}: HomeProps) {
    const bookUrl = searchUrl({}, citySlug);
    const status =
        upcomingCount === 0
            ? 'Nessuna seduta in programma'
            : upcomingCount === 1
              ? 'Hai 1 seduta in programma'
              : `Hai ${upcomingCount} sedute in programma`;

    return (
        <>
            <Head title="Home" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-3xl">
                        Ciao {firstName}
                    </h1>
                    <p className="text-muted-foreground tabular-nums">
                        {status}
                    </p>
                </div>
                <Button asChild className="h-10">
                    <Link href={bookUrl}>Prenota una seduta</Link>
                </Button>
            </div>

            {!hasPreferences && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                    <span className="flex size-10 flex-none items-center justify-center rounded-full bg-muted">
                        <Sparkles aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="text-sm">
                            Completa il tuo profilo
                        </strong>
                        <span className="text-sm text-muted-foreground">
                            Dicci come preferisci allenarti: ti consigliamo i
                            trainer giusti per te.
                        </span>
                    </span>
                    <Button asChild variant="outline" className="h-10">
                        <Link href={completeProfile.url()}>Completa</Link>
                    </Button>
                </div>
            )}

            <Section
                title="La prossima seduta"
                action={
                    upcomingCount > 0 || pending.length > 0
                        ? {
                              label: 'Tutte le prenotazioni',
                              href: bookings.url(),
                          }
                        : undefined
                }
            >
                {nextBooking ? (
                    <UpcomingBookingCard booking={nextBooking} />
                ) : (
                    <NoUpcomingSessions bookUrl={bookUrl} />
                )}
            </Section>

            {pending.length > 0 && (
                <Section title="In attesa di conferma">
                    {pending.map((booking) => (
                        <PendingBookingCard
                            key={booking.id}
                            booking={booking}
                        />
                    ))}
                </Section>
            )}

            <Section
                title="Trainer preferiti"
                action={
                    favorites.length > 0
                        ? { label: 'Vedi tutti', href: favoritesPage.url() }
                        : undefined
                }
            >
                {favorites.length > 0 ? (
                    <FavoriteTrainers trainers={favorites} />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Tocca il cuore su un profilo o nei risultati della
                        ricerca per ritrovarlo qui.
                    </p>
                )}
            </Section>

            {recommended.length > 0 && (
                <Section
                    title="Consigliati per te"
                    action={{ label: 'Vedi tutti', href: bookUrl }}
                >
                    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
                        {recommended.map((trainer) => (
                            <TrainerCard
                                key={trainer.slug}
                                trainer={trainer}
                                layout="vertical"
                                className="w-68 shrink-0 md:w-auto"
                            />
                        ))}
                    </div>
                </Section>
            )}
        </>
    );
}

function Section({
    title,
    action,
    children,
}: {
    title: string;
    /** Link on the right of the title, e.g. "Vedi tutti". */
    action?: { label: string; href: string };
    children: ReactNode;
}) {
    const titleId = useId();

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
                <SectionLabel id={titleId}>{title}</SectionLabel>
                {action && (
                    <Link
                        href={action.href}
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0"
                    >
                        {action.label}
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

Home.layout = { section: 'home' };
