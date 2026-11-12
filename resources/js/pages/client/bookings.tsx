import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import LaterSessionRow from '@/components/client/later-session-row';
import NextSessionHero from '@/components/client/next-session-hero';
import ProposalCard from '@/components/client/proposal-card';
import ReviewPrompt, {
    sessionToReview,
} from '@/components/client/review-prompt';
import NoUpcomingSessions from '@/components/client/no-upcoming-sessions';
import PackageCarousel from '@/components/client/package-carousel';
import PendingBookingCard from '@/components/client/pending-booking-card';
import TrainerProposalCard from '@/components/client/trainer-proposal-card';
import UpcomingEvents from '@/components/events/upcoming-events';
import SessionHistory from '@/components/client/session-history';
import YourTrainersPanel from '@/components/client/your-trainers-panel';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { search as eventsSearch } from '@/routes/events';
import type {
    GroupSessionSummary,
    ClientPackage,
    ClientPastSession,
    ClientPendingBooking,
    ClientTrainer,
    ClientUpcomingBooking,
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
 * "Le mie prenotazioni" (docs/design/cliente-dashboard.html): what is booked,
 * what waits for an answer and what was done. The client's "Panoramica" is
 * pages/client/home.tsx.
 */
export default function Bookings({
    firstName,
    upcoming,
    pending,
    past,
    packages,
    trainers,
    events,
}: BookingsProps) {
    const [now] = useState(() => new Date());
    // All of Italy: the client's preferences only change the order.
    const bookUrl = searchUrl();
    const [next, ...later] = upcoming;
    // "Com'è andata?": read once, localStorage is only in the browser.
    const [toReview] = useState(() =>
        typeof window === 'undefined' ? null : sessionToReview(past, now),
    );
    // "Sposta": the trainer waits for an answer, on top of everything.
    const proposals = upcoming.filter(
        (booking): booking is ProposalBooking => booking.proposal !== null,
    );
    // "Aggiungi seduta" of the trainer: the client answers.
    const trainerProposals = pending.filter((booking) => booking.fromTrainer);
    const waiting = pending.filter(
        (booking) => booking.status !== 'cancelled' && !booking.fromTrainer,
    );
    const cancelledByTrainer = pending.filter(
        (booking) => booking.status === 'cancelled',
    );
    // "Riprendi con …": the trainer of the last session, when nothing is booked.
    const resumeTrainer = trainers.find((trainer) => trainer.booked) ?? null;
    const resumeSessionsLeft = packages
        .filter((pack) => pack.trainerHref === resumeTrainer?.href)
        .reduce((sum, pack) => sum + pack.total - pack.booked, 0);

    return (
        <>
            <Head title="Le mie prenotazioni" />

            <PageHeading
                eyebrow={formatDayLong(romeParts(now).date)}
                title={`Ciao ${firstName}`}
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            asChild
                            className="h-11.5 rounded-xl px-5 text-[15px] font-semibold"
                        >
                            <Link href={bookUrl}>
                                <Plus aria-hidden="true" strokeWidth={2.5} />
                                Prenota una seduta
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* The other searches, one tap away. */}
            <nav
                aria-label="Esplora"
                className="-mt-2 flex [scrollbar-width:none] gap-2 overflow-x-auto"
            >
                {[
                    { label: 'Palestre', href: gymSearchUrl() },
                    { label: 'Corsi', href: courseSearchUrl() },
                    { label: 'Eventi', href: eventsSearch.url() },
                ].map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border bg-card px-3.5 text-sm font-medium hover:bg-accent"
                    >
                        {link.label}
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                ))}
            </nav>

            <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[3_1_540px] flex-col gap-5">
                    {toReview && (
                        <ReviewPrompt key={toReview.id} session={toReview} />
                    )}

                    {trainerProposals.length > 0 && (
                        <Panel title="Sedute proposte" className="gap-3">
                            {trainerProposals.map((booking) => (
                                <TrainerProposalCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </Panel>
                    )}

                    {proposals.length > 0 && (
                        <Panel title="Nuovo orario proposto" className="gap-3">
                            {proposals.map((booking) => (
                                <ProposalCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </Panel>
                    )}

                    {cancelledByTrainer.length > 0 && (
                        <Panel title="Annullate dal trainer" className="gap-3">
                            {cancelledByTrainer.map((booking) => (
                                <PendingBookingCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </Panel>
                    )}

                    {next ? (
                        <NextSessionHero booking={next} now={now} />
                    ) : (
                        <NoUpcomingSessions
                            bookUrl={bookUrl}
                            trainer={resumeTrainer}
                            packageSessionsLeft={resumeSessionsLeft}
                        />
                    )}

                    {waiting.length > 0 && (
                        <Panel title="In attesa di conferma" className="gap-3">
                            {waiting.map((booking) => (
                                <PendingBookingCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </Panel>
                    )}

                    {later.length > 0 && (
                        <Panel title="Più avanti" className="gap-3.5">
                            <ul className="flex flex-col gap-2.5">
                                {later.map((booking) => (
                                    <LaterSessionRow
                                        key={booking.id}
                                        booking={booking}
                                        now={now}
                                    />
                                ))}
                            </ul>
                        </Panel>
                    )}

                    {/* Places taken in the events and in the gyms' courses. */}
                    <UpcomingEvents
                        events={events}
                        title="Corsi ed eventi prenotati"
                        id="my-events-title"
                        showAll={false}
                    />

                    <SessionHistory sessions={past} />
                </div>

                <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-5">
                    {packages.length > 0 && (
                        <PackageCarousel packages={packages} />
                    )}

                    {trainers.length > 0 && (
                        <YourTrainersPanel
                            trainers={trainers}
                            searchHref={bookUrl}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

Bookings.layout = { section: 'bookings' };
