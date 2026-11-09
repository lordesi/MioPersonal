import { Head } from '@inertiajs/react';
import Faq from '@/components/home/faq';
import FeaturedGyms from '@/components/home/featured-gyms';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import NewsStrip from '@/components/news/news-strip';
import type {
    CatalogOption,
    CityWithCoordinates,
    GymSummary,
    NewsPreview,
    SeoData,
    TrainerSummary,
} from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
    /** "In tendenza", "Liberi oggi", "Nuovi": only the ones with enough trainers. */
    trainerShelves: {
        key: string;
        title: string;
        trainers: TrainerSummary[];
    }[];
    /** "Palestre in evidenza": hidden when empty. */
    featuredGyms: GymSummary[];
    disciplines: CatalogOption[];
    /** With their center, for "Usa la mia posizione". */
    cities: CityWithCoordinates[];
    /** "Servizi" of the gyms' search. */
    amenities: CatalogOption[];
    /** "Novità" of all of Italy: hidden when empty. */
    news: NewsPreview;
    seo: SeoData;
};

export default function Home({
    featuredTrainers,
    trainerShelves,
    featuredGyms,
    news,
    disciplines,
    cities,
    amenities,
    seo,
}: HomeProps) {
    return (
        <>
            <Head title={seo.title} />
            <HeroSearch
                disciplines={disciplines}
                cities={cities}
                amenities={amenities}
            />
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
            <NewsStrip news={news} variant="home" />
            <PopularDisciplines disciplines={disciplines} />
            <HowItWorks />
            <Faq />
        </>
    );
}
