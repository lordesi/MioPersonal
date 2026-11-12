import { Head } from '@inertiajs/react';
import UpcomingEvents from '@/components/events/upcoming-events';
import FeaturedCourses from '@/components/home/featured-courses';
import FeaturedGyms from '@/components/home/featured-gyms';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
import PopularDisciplines from '@/components/home/popular-disciplines';
import ProBand from '@/components/home/pro-band';
import NewsStrip from '@/components/news/news-strip';
import type {
    CatalogOption,
    CityWithCoordinates,
    CourseSummary,
    GroupSessionSummary,
    GymSummary,
    NewsPreview,
    SeoData,
    TrainerSummary,
} from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
    /** "In tendenza" and "Nuovi": only with enough trainers. */
    trainerShelves: {
        key: string;
        title: string;
        trainers: TrainerSummary[];
    }[];
    /** "Palestre in evidenza": hidden when empty. */
    featuredGyms: GymSummary[];
    /** "Corsi in palestra": hidden when empty. */
    featuredCourses: CourseSummary[];
    /** "Prossimi eventi": hidden when empty. */
    events: GroupSessionSummary[];
    disciplines: CatalogOption[];
    /** With their center, for "Usa la mia posizione". */
    cities: CityWithCoordinates[];
    /** "Servizi" of the gyms' search. */
    amenities: CatalogOption[];
    /** "Tipo" of the events' search. */
    eventTypes: CatalogOption[];
    /** "Novità" of all of Italy: hidden when empty. */
    news: NewsPreview;
    seo: SeoData;
};

/**
 * The home: the search of the four kinds, the disciplines, then one row per
 * kind (trainer, palestre, corsi, eventi), the news and the professionals.
 */
export default function Home({
    featuredTrainers,
    trainerShelves,
    featuredGyms,
    featuredCourses,
    events,
    news,
    disciplines,
    cities,
    amenities,
    eventTypes,
    seo,
}: HomeProps) {
    return (
        <>
            <Head title={seo.title} />
            <HeroSearch
                disciplines={disciplines}
                cities={cities}
                amenities={amenities}
                eventTypes={eventTypes}
            />
            <PopularDisciplines disciplines={disciplines} />
            <FeaturedTrainers trainers={featuredTrainers} />
            {trainerShelves.map((shelf) => (
                <FeaturedTrainers
                    key={shelf.key}
                    id={shelf.key}
                    title={shelf.title}
                    trainers={shelf.trainers}
                />
            ))}
            <FeaturedGyms gyms={featuredGyms} />
            <FeaturedCourses courses={featuredCourses} />
            <UpcomingEvents
                events={events}
                className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8 md:pb-18"
            />
            <NewsStrip news={news} variant="home" />
            <ProBand />
        </>
    );
}
