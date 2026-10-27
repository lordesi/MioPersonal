import { Head, Link } from '@inertiajs/react';
import { Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import LaterSessionRow from '@/components/client/later-session-row';
import NextSessionHero from '@/components/client/next-session-hero';
import NoUpcomingSessions from '@/components/client/no-upcoming-sessions';
import PackageCarousel from '@/components/client/package-carousel';
import PendingBookingCard from '@/components/client/pending-booking-card';
import RecommendedTrainersPanel from '@/components/client/recommended-trainers-panel';
import SessionHistory from '@/components/client/session-history';
import YourTrainersPanel from '@/components/client/your-trainers-panel';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { searchUrl } from '@/lib/search';
import { profile } from '@/routes/client';
import type {
    ClientPackage,
    ClientPastSession,
    ClientPendingBooking,
    ClientTrainer,
    ClientUpcomingBooking,
    TrainerSummary,
} from '@/types';

type HomeProps = {
    firstName: string;
    /** Confirmed and not over yet, first one first. */
    upcoming: ClientUpcomingBooking[];
    pending: ClientPendingBooking[];
    /** Sessions done, the most recent first. */
    past: ClientPastSession[];
    packages: ClientPackage[];
    trainers: ClientTrainer[];
    /** Only while `trainers` is empty. */
    recommended: TrainerSummary[];
    /** False until the client fills in "Completa il tuo profilo". */
    hasPreferences: boolean;
};

/**
 * "Le mie prenotazioni": the dashboard of the client area
 * (docs/design/cliente-dashboard.html), the first page after the login.
 */
export default function Home({
    firstName,
    upcoming,
    pending,
    past,
    packages,
    trainers,
    recommended,
    hasPreferences,
}: HomeProps) {
    const [now] = useState(() => new Date());
    // All of Italy: the client's preferences only change the order.
    const bookUrl = searchUrl();
    const [next, ...later] = upcoming;
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
                    <Button
                        asChild
                        className="h-11.5 rounded-xl px-5 text-[15px] font-semibold"
                    >
                        <Link href={bookUrl}>
                            <Plus aria-hidden="true" strokeWidth={2.5} />
                            Prenota una seduta
                        </Link>
                    </Button>
                }
            />

            <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[3_1_540px] flex-col gap-5">
                    {next ? (
                        <NextSessionHero booking={next} now={now} />
                    ) : (
                        <NoUpcomingSessions
                            bookUrl={bookUrl}
                            trainer={resumeTrainer}
                            packageSessionsLeft={resumeSessionsLeft}
                        />
                    )}

                    {pending.length > 0 && (
                        <Panel title="In attesa di conferma" className="gap-3">
                            {pending.map((booking) => (
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

                    <SessionHistory sessions={past} />
                </div>

                <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-5">
                    {!hasPreferences && (
                        <section
                            aria-labelledby="completa-profilo"
                            className="flex flex-col gap-3 rounded-[20px] border bg-card p-5 md:p-6"
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-secondary">
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                </span>
                                <h2
                                    id="completa-profilo"
                                    className="text-[17px] leading-6 font-semibold"
                                >
                                    Completa il tuo profilo
                                </h2>
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Dicci come preferisci allenarti: ti consigliamo
                                i trainer giusti per te.
                            </span>
                            <Button
                                asChild
                                variant="outline"
                                className="h-10 self-start rounded-[10px]"
                            >
                                <Link href={profile()}>Completa</Link>
                            </Button>
                        </section>
                    )}

                    {packages.length > 0 && (
                        <PackageCarousel packages={packages} />
                    )}

                    {trainers.length > 0 ? (
                        <YourTrainersPanel
                            trainers={trainers}
                            searchHref={bookUrl}
                        />
                    ) : (
                        recommended.length > 0 && (
                            <RecommendedTrainersPanel
                                trainers={recommended}
                                searchHref={bookUrl}
                            />
                        )
                    )}
                </div>
            </div>
        </>
    );
}

Home.layout = { section: 'bookings' };
