import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import {
    BookingDetailsDialog,
    LaterTimeline,
    NextBookingCard,
    PackageCard,
} from '@/components/client/bookings/booking-blocks';
import type { TimelineItem } from '@/components/client/bookings/booking-blocks';
import PendingBookingCard from '@/components/client/pending-booking-card';
import ProposalCard from '@/components/client/proposal-card';
import SessionHistory from '@/components/client/session-history';
import TrainerProposalCard from '@/components/client/trainer-proposal-card';
import UpcomingEvents from '@/components/events/upcoming-events';
import {
    AreaRow,
    areaButtonClassName,
    areaSectionTitleClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import DarkDialog from '@/components/mp/dark-dialog';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import type {
    ClientPackage,
    ClientPastSession,
    ClientPendingBooking,
    ClientTrainer,
    ClientUpcomingBooking,
    GroupSessionSummary,
} from '@/types';

/** An upcoming session with a "Sposta" proposal of the trainer. */
type ProposalBooking = ClientUpcomingBooking & {
    proposal: NonNullable<ClientUpcomingBooking['proposal']>;
};

type BookingsProps = {
    firstName: string;
    /** Confirmed and not over yet, first one first. */
    upcoming: ClientUpcomingBooking[];
    pending: ClientPendingBooking[];
    /** Sessions done, the most recent first. */
    past: ClientPastSession[];
    packages: ClientPackage[];
    trainers: ClientTrainer[];
    /** "I miei eventi": the places taken, still to come. */
    events: GroupSessionSummary[];
};

/**
 * "Prenotazioni" of the client (design "Prenotazioni · V2"): what waits for
 * an answer, the next session, the ones "Più avanti" (with the requests
 * still to confirm), the packages and "Sedute passate". Desktop: the
 * sessions on the left, the packages on the right.
 */
export default function Bookings({
    upcoming,
    pending,
    past,
    packages,
    trainers,
    events,
}: BookingsProps) {
    const [now] = useState(() => new Date());
    const [details, setDetails] = useState<ClientUpcomingBooking | null>(null);
    const [request, setRequest] = useState<ClientPendingBooking | null>(null);
    const [showPast, setShowPast] = useState(false);
    const [next, ...later] = upcoming;

    // "Scrivi": the conversation with the trainer, when there is one.
    const messageHrefOf = (trainerHref: string) =>
        trainers.find((trainer) => trainer.href === trainerHref)?.messageHref ??
        null;

    // "Sposta": the trainer waits for an answer, on top of everything.
    const proposals = upcoming.filter(
        (booking): booking is ProposalBooking => booking.proposal !== null,
    );
    // "Aggiungi seduta" of the trainer: the client answers.
    const trainerProposals = pending.filter((booking) => booking.fromTrainer);
    const waiting = pending.filter(
        (booking) => booking.status === 'pending' && !booking.fromTrainer,
    );
    // Refused, expired or cancelled by the trainer: told once, on top.
    const closed = pending.filter(
        (booking) => booking.status !== 'pending' && !booking.fromTrainer,
    );
    const toAnswer =
        trainerProposals.length + proposals.length + closed.length > 0;

    const timeline: TimelineItem[] = [
        ...later.map((booking) => ({ kind: 'upcoming' as const, booking })),
        ...waiting.map((booking) => ({ kind: 'pending' as const, booking })),
    ].sort((a, b) => a.booking.start.localeCompare(b.booking.start));

    const bookButton = (
        <Link
            href={searchUrl()}
            className={areaButtonClassName('primary', 'md')}
        >
            Prenota una seduta
        </Link>
    );

    return (
        <>
            <Head title="Prenotazioni" />

            <header className="flex items-center justify-between gap-4">
                <h1 className={areaTitleClassName}>Prenotazioni</h1>
                <div className="hidden md:block">{bookButton}</div>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
                <div className="flex min-w-0 flex-col gap-8 lg:gap-9">
                    {toAnswer && (
                        <section
                            aria-labelledby="answer-title"
                            className="flex flex-col gap-3"
                        >
                            <h2
                                id="answer-title"
                                className={areaSectionTitleClassName}
                            >
                                Da rispondere
                            </h2>
                            {trainerProposals.map((booking) => (
                                <TrainerProposalCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                            {proposals.map((booking) => (
                                <ProposalCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                            {closed.map((booking) => (
                                <PendingBookingCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </section>
                    )}

                    {next ? (
                        <NextBookingCard
                            booking={next}
                            now={now}
                            messageHref={messageHrefOf(next.trainerHref)}
                            onDetails={() => setDetails(next)}
                        />
                    ) : (
                        <div
                            className={cn(
                                carbCardClassName,
                                'flex flex-col items-center gap-3 p-6 text-center',
                            )}
                        >
                            <span className="flex size-13 items-center justify-center rounded-full bg-[#1c1e21] text-muted-foreground">
                                <CalendarPlus
                                    aria-hidden="true"
                                    className="size-6"
                                />
                            </span>
                            <p className="text-[17px] font-semibold">
                                Nessuna seduta in programma
                            </p>
                            <p className="max-w-80 text-[15px] leading-5 text-muted-foreground">
                                Trova un trainer vicino a te e prenota la
                                prossima.
                            </p>
                            <div className="mt-1">{bookButton}</div>
                        </div>
                    )}

                    {timeline.length > 0 && (
                        <LaterTimeline
                            items={timeline}
                            onOpen={(item) =>
                                item.kind === 'upcoming'
                                    ? setDetails(item.booking)
                                    : setRequest(item.booking)
                            }
                        />
                    )}

                    {/* Places taken in the events (only while they are switched on). */}
                    <UpcomingEvents
                        events={events}
                        title="Corsi ed eventi prenotati"
                        id="my-events-title"
                        showAll={false}
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-8">
                    {packages.length > 0 && (
                        <section
                            id="pacchetti"
                            aria-labelledby="packages-title"
                            className="flex scroll-mt-6 flex-col gap-3"
                        >
                            <h2
                                id="packages-title"
                                className={areaSectionTitleClassName}
                            >
                                Pacchetti
                            </h2>
                            {packages.map((pack) => (
                                <PackageCard
                                    key={pack.id}
                                    pack={pack}
                                    renewHref={
                                        messageHrefOf(pack.trainerHref) ??
                                        pack.trainerHref
                                    }
                                />
                            ))}
                        </section>
                    )}

                    <div>
                        <AreaRow
                            title="Sedute passate"
                            icon={CalendarDays}
                            value={past.length > 0 ? past.length : undefined}
                            onClick={() => setShowPast(true)}
                        />
                    </div>
                </div>
            </div>

            <BookingDetailsDialog
                booking={details}
                now={now}
                messageHref={
                    details ? messageHrefOf(details.trainerHref) : null
                }
                onOpenChange={(open) => !open && setDetails(null)}
            />

            <DarkDialog
                open={request !== null}
                onOpenChange={(open) => !open && setRequest(null)}
                title="Richiesta inviata"
                className="md:max-w-130"
            >
                {request && <PendingBookingCard booking={request} />}
            </DarkDialog>

            <DarkDialog
                open={showPast}
                onOpenChange={setShowPast}
                title="Sedute passate"
                className="md:max-w-160"
            >
                <div className="-mx-1 max-h-[70dvh] overflow-y-auto px-1">
                    <SessionHistory sessions={past} />
                </div>
            </DarkDialog>
        </>
    );
}

Bookings.layout = { section: 'bookings' };
