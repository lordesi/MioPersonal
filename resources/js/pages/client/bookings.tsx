import { Head, Link } from '@inertiajs/react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import FavoriteTrainers from '@/components/client/favorite-trainers';
import PackageCard from '@/components/client/package-card';
import PastSessionCard from '@/components/client/past-session-card';
import PendingBookingCard from '@/components/client/pending-booking-card';
import UpcomingBookingCard from '@/components/client/upcoming-booking-card';
import ResponsiveText from '@/components/shared/responsive-text';
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
    return (
        <>
            <Head title="Le mie prenotazioni" />

            <div className="flex flex-wrap items-end justify-between gap-4 max-md:order-first">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Le mie prenotazioni
                    </h1>
                    <p className="text-muted-foreground">
                        <ResponsiveText
                            mobile="Sposti o annulli gratis fino a 24 ore prima."
                            desktop="Puoi spostare o annullare gratis fino a 24 ore prima."
                        />
                    </p>
                </div>
                <Button asChild className="hidden h-10 md:inline-flex">
                    <Link href={searchUrl()}>Prenota una seduta</Link>
                </Button>
            </div>

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
