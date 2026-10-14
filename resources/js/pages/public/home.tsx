import { Head } from '@inertiajs/react';
import FeaturedTrainers from '@/components/home/featured-trainers';
import ForTrainers from '@/components/home/for-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import TrainerVerification from '@/components/home/trainer-verification';
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
            <TrainerVerification />
            <ForTrainers />
        </>
    );
}
