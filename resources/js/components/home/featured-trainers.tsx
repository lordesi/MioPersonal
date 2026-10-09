import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import TrainerCard from '@/components/trainer/trainer-card';
import { searchUrl } from '@/lib/search';
import type { TrainerSummary } from '@/types';

type FeaturedTrainersProps = {
    trainers: TrainerSummary[];
};

/** Grid on large screens, horizontal carousel on smaller ones. */
export default function FeaturedTrainers({ trainers }: FeaturedTrainersProps) {
    if (trainers.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="featured-title"
            className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-10 md:gap-8 md:py-20"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:items-end md:px-8">
                <h2
                    id="featured-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Trainer in evidenza
                </h2>
                <Link
                    href={searchUrl()}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0 md:gap-1.5"
                >
                    Vedi tutti
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-1 md:px-8 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
                {trainers.map((trainer) => (
                    <TrainerCard
                        key={trainer.name}
                        trainer={trainer}
                        layout="vertical"
                        className="w-68 shrink-0 md:w-80 lg:w-auto"
                    />
                ))}
            </div>
        </section>
    );
}
