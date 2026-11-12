import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import NextSessionSummary from '@/components/client/next-session-summary';
import PackageCarousel from '@/components/client/package-carousel';
import ActivityPanel from '@/components/client/progress/activity-panel';
import GoalCard from '@/components/client/progress/goal-card';
import LogActivityDialog from '@/components/client/progress/log-activity-dialog';
import WeightPanel from '@/components/client/progress/weight-panel';
import RecommendedTrainersPanel from '@/components/client/recommended-trainers-panel';
import YourTrainersPanel from '@/components/client/your-trainers-panel';
import NewsStrip from '@/components/news/news-strip';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { courseSearchUrl } from '@/lib/course';
import { formatDayLong } from '@/lib/format';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { profile } from '@/routes/client';
import { search as eventsSearch } from '@/routes/events';
import type {
    ActivityKindOption,
    ClientPackage,
    ClientProgressSummary,
    ClientTrainer,
    ClientUpcomingBooking,
    NewsPreview,
    TrainerSummary,
    WeightPoint,
} from '@/types';

type HomeProps = {
    firstName: string;
    /** The next confirmed session, own or as a friend. */
    next: ClientUpcomingBooking | null;
    /** Bookings waiting for the client's answer. */
    toAnswer: number;
    progress: ClientProgressSummary;
    /** Null without the consent to body data. */
    weights: WeightPoint[] | null;
    activityKinds: ActivityKindOption[];
    /** Rome day. */
    today: string;
    /** How many days back a training can be added. */
    daysBack: number;
    packages: ClientPackage[];
    trainers: ClientTrainer[];
    /** Only while `trainers` is empty. */
    recommended: TrainerSummary[];
    /** False until the client fills in "Completa il tuo profilo". */
    hasPreferences: boolean;
    /** "Novità" in the client's city. */
    news: NewsPreview;
};

/**
 * "Panoramica": the first page of the client area after the login. The
 * client's training week by week (sessions, courses and events count by
 * themselves), the next session in short and the trainers, or a few to try.
 */
export default function Home({
    firstName,
    next,
    toAnswer,
    progress,
    weights,
    activityKinds,
    today,
    daysBack,
    packages,
    trainers,
    recommended,
    hasPreferences,
    news,
}: HomeProps) {
    const [now] = useState(() => new Date());
    // All of Italy: the client's preferences only change the order.
    const bookUrl = searchUrl();

    return (
        <>
            <Head title="Panoramica" />

            <PageHeading
                eyebrow={formatDayLong(romeParts(now).date)}
                title={`Ciao ${firstName}`}
                action={
                    <div className="flex flex-wrap gap-2">
                        <LogActivityDialog
                            kinds={activityKinds}
                            today={today}
                            daysBack={daysBack}
                            trigger={
                                <Button
                                    variant="outline"
                                    className="h-11.5 rounded-xl bg-card px-5 text-[15px] font-semibold"
                                >
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                    />
                                    Segna un allenamento
                                </Button>
                            }
                        />
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
                    <NextSessionSummary
                        next={next}
                        toAnswer={toAnswer}
                        now={now}
                    />

                    <ActivityPanel
                        progress={progress}
                        editable
                        empty={
                            <p className="text-sm text-muted-foreground">
                                Le sedute, i corsi e gli eventi che prenoti
                                finiscono qui da soli, settimana dopo settimana.
                                Quello che fai per conto tuo lo aggiungi con
                                "Segna un allenamento".
                            </p>
                        }
                    />
                </div>

                <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-5">
                    <GoalCard
                        progress={progress}
                        hasTrainer={trainers.some((trainer) => trainer.booked)}
                        searchHref={bookUrl}
                    />

                    {weights !== null && (
                        <WeightPanel weights={weights} today={today} />
                    )}

                    {!hasPreferences && <CompleteProfileCard />}

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

            <NewsStrip news={news} />
        </>
    );
}

/** Until the client answers "Completa il tuo profilo". */
function CompleteProfileCard() {
    return (
        <section
            aria-labelledby="completa-profilo"
            className="flex flex-col gap-3 rounded-[20px] border bg-card p-5 md:p-6"
        >
            <span className="flex items-center gap-3">
                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-secondary">
                    <Sparkles aria-hidden="true" className="size-4.5" />
                </span>
                <h2
                    id="completa-profilo"
                    className="text-[17px] leading-6 font-semibold"
                >
                    Completa il tuo profilo
                </h2>
            </span>
            <span className="text-sm text-muted-foreground">
                Dicci come preferisci allenarti: ti consigliamo i trainer giusti
                per te.
            </span>
            <Button
                asChild
                variant="outline"
                className="h-10 self-start rounded-[10px]"
            >
                <Link href={profile()}>Completa</Link>
            </Button>
        </section>
    );
}

Home.layout = { section: 'home' };
