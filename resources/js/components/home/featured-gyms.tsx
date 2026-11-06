import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { SaveableGymCard } from '@/components/gym/gym-card';
import { gymSearchUrl } from '@/lib/gym';
import type { GymSummary } from '@/types';

type FeaturedGymsProps = {
    gyms: GymSummary[];
};

/**
 * "Palestre in evidenza" (HomeController): one row of gyms with a cover
 * photo, the ones with a promotion first. Hidden when there are none.
 */
export default function FeaturedGyms({ gyms }: FeaturedGymsProps) {
    if (gyms.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="featured-gyms-title"
            className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-10 md:gap-7 md:px-8 md:pb-18"
        >
            <div className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
                <h2
                    id="featured-gyms-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Palestre in evidenza
                </h2>
                <Link
                    href={gymSearchUrl()}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0 md:gap-1.5"
                >
                    Vedi tutte
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
                {gyms.map((gym) => (
                    <li key={gym.slug} className="flex">
                        <SaveableGymCard gym={gym} className="flex-1" />
                    </li>
                ))}
            </ul>
        </section>
    );
}
