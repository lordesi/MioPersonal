import CardCarousel, {
    carouselCardClass,
} from '@/components/home/card-carousel';
import { SaveableGymCard } from '@/components/gym/gym-card';
import { gymSearchUrl } from '@/lib/gym';
import type { GymSummary } from '@/types';

type FeaturedGymsProps = {
    gyms: GymSummary[];
};

/**
 * "Palestre in evidenza" (HomeController): gyms with a cover photo, the ones
 * with a promotion first, in the same carousel as the trainers. Hidden when
 * there are none.
 */
export default function FeaturedGyms({ gyms }: FeaturedGymsProps) {
    if (gyms.length === 0) {
        return null;
    }

    return (
        <CardCarousel
            title="Palestre in evidenza"
            titleId="featured-gyms-title"
            href={gymSearchUrl()}
            linkLabel="Vedi tutte"
            prevLabel="Palestre precedenti"
            nextLabel="Palestre successive"
            // Right below the trainers: the space above is theirs.
            className="pb-10 md:pb-18"
        >
            {gyms.map((gym) => (
                <SaveableGymCard
                    key={gym.slug}
                    gym={gym}
                    layout="tile"
                    className={carouselCardClass}
                />
            ))}
        </CardCarousel>
    );
}
