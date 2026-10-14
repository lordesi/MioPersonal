import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import FavoriteTrainers from '@/components/client/favorite-trainers';
import PackageCard from '@/components/client/package-card';
import PastSessionCard from '@/components/client/past-session-card';
import PendingBookingCard from '@/components/client/pending-booking-card';
import UpcomingBookingCard from '@/components/client/upcoming-booking-card';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import type {
    ClientPackage,
    ClientPastSession,
    ClientPendingBooking,
    ClientUpcomingBooking,
    FavoriteTrainer,
} from '@/types';

type BookingsProps = {
    upcoming: ClientUpcomingBooking[];
    pending: ClientPendingBooking[];
    packages: ClientPackage[];
    favorites: FavoriteTrainer[];
    past: ClientPastSession[];
};

export default function Bookings({
    upcoming,
    pending,
    packages,
    favorites,
    past,
}: BookingsProps) {
    // A new account: nothing booked or saved yet.
    const empty =
        upcoming.length +
            pending.length +
            packages.length +
            favorites.length +
            past.length ===
        0;

    return (
        <>
            <Head title="Le mie prenotazioni" />

            <div className="flex flex-wrap items-end justify-between gap-4 max-md:order-first">
                <h1 className="text-3xl font-bold tracking-tight">
                    Le mie prenotazioni
                </h1>
                <Button asChild className="hidden h-10 md:inline-flex">
                    <Link href={searchUrl()}>Prenota una seduta</Link>
                </Button>
            </div>

            {empty && (
                <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-input px-4 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <CalendarDays aria-hidden="true" className="size-5" />
                    </span>
                    <strong className="text-lg">Nessuna prenotazione</strong>
                    <span className="max-w-90 text-sm text-muted-foreground">
                        Scegli un trainer, un giorno e un orario: le tue sedute
                        compariranno qui.
                    </span>
                    <Button asChild className="h-11 rounded-lg px-4.5">
                        <Link href={searchUrl()}>Cerca un trainer</Link>
                    </Button>
                </div>
            )}

            {upcoming.length > 0 && (
                <Section title="Prossime">
                    {upcoming.map((booking) => (
                        <UpcomingBookingCard
                            key={booking.id}
                            booking={booking}
                        />
                    ))}
                </Section>
            )}

            {/* On mobile the design shows the requests first. */}
            {pending.length > 0 && (
                <Section
                    title="In attesa di conferma"
                    className="max-md:-order-1"
                >
                    {pending.map((booking) => (
                        <PendingBookingCard
                            key={booking.id}
                            booking={booking}
                        />
                    ))}
                </Section>
            )}

            {packages.length > 0 && (
                <Section title="I tuoi pacchetti">
                    {packages.map((pack) => (
                        <PackageCard key={pack.id} pack={pack} />
                    ))}
                </Section>
            )}

            {favorites.length > 0 && (
                <Section title="Trainer preferiti">
                    <FavoriteTrainers trainers={favorites} />
                </Section>
            )}

            {past.length > 0 && (
                <Section title="Passate">
                    {past.map((session) => (
                        <PastSessionCard key={session.id} session={session} />
                    ))}
                </Section>
            )}
        </>
    );
}

function Section({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: ReactNode;
}) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className={cn('flex flex-col gap-1.5', className)}
        >
            <SectionLabel id={titleId}>{title}</SectionLabel>
            {children}
        </section>
    );
}

Bookings.layout = { section: 'bookings' };
