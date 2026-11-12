import CardCarousel, {
    carouselCardClass,
} from '@/components/home/card-carousel';
import { SaveableGymCard } from '@/components/gym/gym-card';
import { gymSearchUrl } from '@/lib/gym';
import type { GymSummary } from '@/types';

type FeaturedGymsProps = {
    gyms: GymSummary[];
    title?: string;
    /** Unique in the page. */
    id?: string;
};

/**
 * "Palestre in tendenza" (GymShelves), or "Palestre in evidenza"
 * (HomeController): gyms with a cover photo, in the same carousel as the
 * trainers. Hidden when there are none.
 */
export default function FeaturedGyms({
    gyms,
    title = 'Palestre in evidenza',
    id = 'featured-gyms',
}: FeaturedGymsProps) {
    if (gyms.length === 0) {
        return null;
    }

    return (
        <CardCarousel
            title={title}
            titleId={`${id}-title`}
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
