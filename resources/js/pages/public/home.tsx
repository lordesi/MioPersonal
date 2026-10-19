import { Head } from '@inertiajs/react';
import Faq from '@/components/home/faq';
import FeaturedTrainers from '@/components/home/featured-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import type { CatalogOption, TrainerSummary } from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
    disciplines: CatalogOption[];
    cities: CatalogOption[];
};

export default function Home({
    featuredTrainers,
    disciplines,
    cities,
}: HomeProps) {
    return (
        <>
            {/* Empty title: the browser tab shows just the app name. */}
            <Head title="" />
            <HeroSearch disciplines={disciplines} cities={cities} />
            <FeaturedTrainers trainers={featuredTrainers} />
            <PopularDisciplines disciplines={disciplines} />
            <HowItWorks />
            <Faq />
        </>
    );
}

// The dark header continues into the hero.
Home.layout = { header: 'hero' };
