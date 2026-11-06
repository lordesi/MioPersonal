import { Head } from '@inertiajs/react';
import Faq from '@/components/home/faq';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import type { CatalogOption, SeoData, TrainerSummary } from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    seo: SeoData;
};

export default function Home({
    featuredTrainers,
    disciplines,
    cities,
    seo,
}: HomeProps) {
    return (
        <>
            <Head title={seo.title} />
            <HeroSearch disciplines={disciplines} cities={cities} />
            <FeaturedTrainers trainers={featuredTrainers} />
            <PopularDisciplines disciplines={disciplines} />
            <HowItWorks />
            <Faq />
        </>
    );
}
