import { Head } from '@inertiajs/react';
import UpcomingEvents from '@/components/events/upcoming-events';
import FeaturedCourses from '@/components/home/featured-courses';
import FeaturedGyms from '@/components/home/featured-gyms';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
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

/** "In tendenza", or "in evidenza" while too few are trending (HomeController). */
type Shelf<T> = {
    key: 'trending' | 'featured';
    title: string;
    items: T[];
};

type HomeProps = {
    trainers: Shelf<TrainerSummary>;
    /** Hidden when empty. */
    gyms: Shelf<GymSummary>;
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
 * The home: the search of the four kinds, then the trainers and the gyms
 * "in tendenza" (or "in evidenza"), the courses, the events, the news and
 * the professionals.
 */
export default function Home({
    trainers,
    gyms,
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
            <FeaturedTrainers
                id={`${trainers.key}-trainers`}
                title={trainers.title}
                trainers={trainers.items}
            />
            <FeaturedGyms
                id={`${gyms.key}-gyms`}
                title={gyms.title}
                gyms={gyms.items}
            />
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
