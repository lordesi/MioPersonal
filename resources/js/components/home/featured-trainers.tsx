import CardCarousel, {
    carouselCardClass,
} from '@/components/home/card-carousel';
import TrainerCard from '@/components/trainer/trainer-card';
import { useFavorite } from '@/hooks/use-favorite';
import { searchUrl } from '@/lib/search';
import type { TrainerSummary } from '@/types';

type FeaturedTrainersProps = {
    trainers: TrainerSummary[];
};

/** "Trainer in evidenza" (HomeController): the best rated, in a carousel. */
export default function FeaturedTrainers({ trainers }: FeaturedTrainersProps) {
    if (trainers.length === 0) {
        return null;
    }

    return (
        <CardCarousel
            title="Trainer in evidenza"
            titleId="featured-title"
            href={searchUrl()}
            linkLabel="Vedi tutti"
            prevLabel="Trainer precedenti"
            nextLabel="Trainer successivi"
            className="py-10 md:py-18"
        >
            {trainers.map((trainer) => (
                <FeaturedCard key={trainer.slug} trainer={trainer} />
            ))}
        </CardCarousel>
    );
}

/** One card of the carousel, like the search results: each heart keeps its own state. */
function FeaturedCard({ trainer }: { trainer: TrainerSummary }) {
    const favorite = useFavorite(trainer.slug, trainer.favorite ?? false);

    return (
        <TrainerCard
            trainer={trainer}
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
            className={carouselCardClass}
        />
    );
}
