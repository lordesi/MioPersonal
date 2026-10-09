import ProgressBar from '@/components/shared/progress-bar';
import ResponsiveText from '@/components/shared/responsive-text';
import ReviewCard from '@/components/trainer/review-card';
import { Button } from '@/components/ui/button';
import { formatRating } from '@/lib/format';
import type { TrainerProfile } from '@/types';

type ReviewsSectionProps = {
    trainer: Pick<
        TrainerProfile,
        'name' | 'rating' | 'reviewCount' | 'ratingDistribution' | 'reviews'
    >;
};

/** Average, star distribution (desktop) and the latest reviews. */
export default function ReviewsSection({ trainer }: ReviewsSectionProps) {
    const firstName = trainer.name.split(' ')[0];

    if (trainer.rating === null) {
        return null;
    }

    return (
        <section
            id="recensioni"
            aria-labelledby="reviews-title"
            className="flex scroll-mt-6 flex-col gap-3 md:gap-5"
        >
            <div className="flex items-baseline justify-between">
                <h2
                    id="reviews-title"
                    className="text-xl font-semibold tracking-tight md:text-2xl"
                >
                    Recensioni
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums md:hidden">
                    <strong className="text-xl text-foreground">
                        {formatRating(trainer.rating)}
                    </strong>{' '}
                    · {trainer.reviewCount}
                </span>
            </div>

            <div className="hidden flex-wrap items-center gap-8 rounded-xl border p-6 md:flex">
                <div className="flex flex-col gap-1 tabular-nums">
                    <span className="text-5xl font-bold tracking-tight">
                        {formatRating(trainer.rating)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {trainer.reviewCount} recensioni
                    </span>
                </div>
                <div className="flex flex-[1_1_260px] flex-col gap-1.5">
                    {trainer.ratingDistribution.map((row) => (
                        <div
                            key={row.stars}
                            className="flex items-center gap-2.5 text-xs font-medium tabular-nums"
                        >
                            <span className="w-5 text-muted-foreground">
                                {row.stars}★
                            </span>
                            <ProgressBar
                                value={row.count}
                                max={trainer.reviewCount}
                                label={`${row.stars} stelle: ${row.count} recensioni`}
                                className="h-2 flex-1"
                            />
                            <span className="w-5 text-right text-muted-foreground">
                                {row.count}
                            </span>
                        </div>
                    ))}
                </div>
                <p className="basis-full text-xs font-medium text-muted-foreground">
                    Le recensioni arrivano solo da clienti che hanno svolto una
                    seduta con questo trainer.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {trainer.reviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        authorName={review.authorName}
                        meta={review.meta}
                        rating={review.rating}
                        text={review.text}
                        reply={
                            review.reply
                                ? {
                                      label: `Risposta di ${firstName}:`,
                                      text: review.reply,
                                  }
                                : undefined
                        }
                    />
                ))}
            </div>

            {/* TODO: load all reviews once they come from the database. */}
            <Button
                type="button"
                variant="outline"
                className="h-11 md:h-9 md:self-start"
            >
                <ResponsiveText
                    mobile="Mostra tutte le recensioni"
                    desktop={`Mostra tutte le ${trainer.reviewCount} recensioni`}
                />
            </Button>
            <p className="text-xs font-medium text-muted-foreground md:hidden">
                Solo da clienti che hanno svolto una seduta.
            </p>
        </section>
    );
}
