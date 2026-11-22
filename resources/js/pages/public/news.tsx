import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, MapPin, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { eventCard, gymCard, trainerCard } from '@/components/mp/cards';
import {
    pageColumnClassName,
    pageTitleClassName,
    sectionTitleClassName,
} from '@/components/mp/page-bits';
import ProfileCard from '@/components/mp/profile-card';
import SaveableCard from '@/components/mp/saveable-card';
import { ResultsGrid } from '@/components/mp/search-results';
import OptionsMenu from '@/components/search/options-menu';
import { useFeatures } from '@/lib/features';
import type { Features } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { news } from '@/routes';
import type {
    GroupSessionSummary,
    GymSummary,
    SeoData,
    TrainerSummary,
} from '@/types';

type NewsProps = {
    seo: SeoData;
    city: { slug: string; name: string } | null;
    trainers: TrainerSummary[];
    gyms: GymSummary[];
    /** The events published lately, still to come. */
    events: GroupSessionSummary[];
    cities: { value: string; label: string }[];
    /** "Nuovo" for this many days. */
    days: number;
};

/** What the page lists, by the parts of the site switched on. */
function newsIntro(features: Features): string {
    const joined = features.gyms
        ? 'I personal trainer e le palestre appena arrivati su MioPersonal, verificati dal nostro team'
        : 'I personal trainer appena arrivati su MioPersonal, verificati dal nostro team';

    return features.events
        ? `${joined}, e i nuovi eventi in programma.`
        : `${joined}.`;
}

/**
 * "Novità": the trainers and gyms that joined in the last days, and the new
 * events, in Italy or a city. The cards of the home and of the searches.
 */
export default function News({
    seo,
    city,
    trainers,
    gyms,
    events,
    cities,
    days,
}: NewsProps) {
    const place = city ? `a ${city.name}` : 'in Italia';
    const features = useFeatures();
    const empty =
        trainers.length === 0 && gyms.length === 0 && events.length === 0;

    return (
        <div
            className={cn(
                pageColumnClassName,
                'gap-10 pb-16 md:gap-16 md:pb-24',
            )}
        >
            <Head title={seo.title} />

            <header className="flex flex-col gap-4 pt-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6 md:pt-10">
                <div className="flex flex-col gap-3">
                    <span className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.6px] text-brand uppercase">
                        <Sparkles aria-hidden="true" className="size-4" />
                        Ultimi {days} giorni
                    </span>
                    <h1 className={pageTitleClassName}>Novità {place}</h1>
                    <p className="max-w-150 text-[17px] leading-6 text-muted-foreground">
                        {newsIntro(features)}
                    </p>
                </div>
                <OptionsMenu
                    label="Città"
                    noneLabel="Tutta Italia"
                    options={cities}
                    value={city?.slug ?? null}
                    onChange={(value) =>
                        router.visit(news.url(value ? { city: value } : {}))
                    }
                    searchPlaceholder="Cerca una città"
                    className="theme-dark"
                    trigger={
                        <button
                            type="button"
                            className="field-pill h-12.5 w-full justify-between px-5 text-[17px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-64"
                        >
                            <span className="flex items-center gap-2.5">
                                <MapPin
                                    aria-hidden="true"
                                    className="size-5 text-muted-foreground"
                                />
                                {city?.name ?? 'Tutta Italia'}
                            </span>
                            <ChevronDown
                                aria-hidden="true"
                                className="size-5 text-muted-foreground"
                            />
                        </button>
                    }
                />
            </header>

            {empty && (
                <p
                    role="status"
                    className="rounded-[26px] bg-card px-5 py-4 text-[15px] leading-5.25 text-muted-foreground"
                >
                    Nessuna novità {place} negli ultimi {days} giorni.{' '}
                    <Link
                        href={searchUrl({}, city?.slug)}
                        className="font-semibold text-brand hover:underline"
                    >
                        Cerca tra tutti i trainer
                    </Link>
                    {features.gyms && (
                        <>
                            {' '}
                            o{' '}
                            <Link
                                href={gymSearchUrl({}, city?.slug)}
                                className="font-semibold text-brand hover:underline"
                            >
                                le palestre
                            </Link>
                        </>
                    )}
                    .
                </p>
            )}

            {trainers.length > 0 && (
                <NewsSection id="new-trainers" title="Nuovi trainer">
                    <ResultsGrid
                        items={trainers}
                        itemKey={(trainer) => trainer.slug}
                    >
                        {(trainer) => (
                            <SaveableCard
                                {...trainerCard(trainer)}
                                badge="Nuovo"
                                slug={trainer.slug}
                                favoriteKind="trainer"
                                saved={trainer.favorite}
                            />
                        )}
                    </ResultsGrid>
                </NewsSection>
            )}

            {gyms.length > 0 && (
                <NewsSection id="new-gyms" title="Nuove palestre">
                    <ResultsGrid items={gyms} itemKey={(gym) => gym.slug}>
                        {(gym) => (
                            <SaveableCard
                                {...gymCard(gym)}
                                badge="Nuova"
                                slug={gym.slug}
                                favoriteKind="gym"
                                saved={gym.favorite}
                            />
                        )}
                    </ResultsGrid>
                </NewsSection>
            )}

            {events.length > 0 && (
                <NewsSection id="new-events" title="Nuovi eventi">
                    <ResultsGrid items={events} itemKey={(event) => event.slug}>
                        {(event) => <ProfileCard {...eventCard(event)} />}
                    </ResultsGrid>
                </NewsSection>
            )}
        </div>
    );
}

function NewsSection({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-4 md:gap-5">
            <h2 id={id} className={sectionTitleClassName}>
                {title}
            </h2>
            {children}
        </section>
    );
}
