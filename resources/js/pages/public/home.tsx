import { Head } from '@inertiajs/react';
import FeaturedTrainers from '@/components/home/featured-trainers';
import ForTrainers from '@/components/home/for-trainers';
import HeroSearch from '@/components/home/hero-search';
import HowItWorks from '@/components/home/how-it-works';
import PopularDisciplines from '@/components/home/popular-disciplines';
import QuizBanner from '@/components/home/quiz-banner';
import TrainerVerification from '@/components/home/trainer-verification';
import type { TrainerSummary } from '@/types';

type HomeProps = {
    featuredTrainers: TrainerSummary[];
};

export default function Home({ featuredTrainers }: HomeProps) {
    return (
        <>
            {/* Empty title: the browser tab shows just the app name. */}
            <Head title="" />
            <HeroSearch />
            <FeaturedTrainers trainers={featuredTrainers} />
            <QuizBanner />
            <PopularDisciplines />
            <HowItWorks />
            <TrainerVerification />
            <ForTrainers />
        </>
    );
}
