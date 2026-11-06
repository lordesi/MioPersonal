import { Head } from '@inertiajs/react';
import Faq from '@/components/home/faq';
import FeaturedGyms from '@/components/home/featured-gyms';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import type {
    CatalogOption,
    CityWithCoordinates,
    GymSummary,
    SeoData,
    TrainerSummary,
} from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
    /** "Palestre in evidenza": hidden when empty. */
    featuredGyms: GymSummary[];
    disciplines: CatalogOption[];
    /** With their center, for "Usa la mia posizione". */
    cities: CityWithCoordinates[];
    /** "Servizi" of the gyms' search. */
    amenities: CatalogOption[];
    seo: SeoData;
};

export default function Home({
    featuredTrainers,
    featuredGyms,
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
            <FeaturedGyms gyms={featuredGyms} />
            <PopularDisciplines disciplines={disciplines} />
            <HowItWorks />
            <Faq />
        </>
    );
}
