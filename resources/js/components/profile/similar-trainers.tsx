import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import TrainerCard from '@/components/trainer/trainer-card';
import type { TrainerProfile } from '@/types';

type SimilarTrainersProps = {
    trainers: TrainerProfile['similarTrainers'];
    /** "Vedi tutti": the search of the trainer's city. */
    searchHref: string;
};

/** Similar trainers, with the cards of the search; hidden without any. */
export default function SimilarTrainers({
    trainers,
    searchHref,
}: SimilarTrainersProps) {
    if (trainers.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="similar-title"
            className="flex flex-col gap-4"
        >
            <div className="flex flex-wrap items-end justify-between gap-2.5">
                <h2
                    id="similar-title"
                    className="text-[26px] leading-8 font-bold tracking-[-0.02em]"
                >
                    Trainer simili
                </h2>
                <Link
                    href={searchHref}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                    Vedi tutti
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
                {trainers.map((trainer) => (
                    <li key={trainer.href} className="flex">
                        <TrainerCard trainer={trainer} className="flex-1" />
                    </li>
                ))}
            </ul>
        </section>
    );
}
