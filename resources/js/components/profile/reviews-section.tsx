import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProfileSection from '@/components/profile/profile-section';
import RatingBreakdown from '@/components/profile/rating-breakdown';
import ReviewCard from '@/components/trainer/review-card';
import StarRating from '@/components/trainer/star-rating';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatPastDate, formatRating } from '@/lib/format';
import type { TrainerProfile, TrainerReview } from '@/types';

/** Reviews added by each "Mostra altre recensioni". */
const PAGE_SIZE = 10;

const SORTS = {
    recent: 'Più recenti',
    oldest: 'Meno recenti',
    best: 'Migliori',
    worst: 'Peggiori',
} as const;

type Sort = keyof typeof SORTS;

type ReviewsSectionProps = {
    trainer: Pick<
        TrainerProfile,
        'name' | 'rating' | 'reviewCount' | 'ratingDistribution' | 'reviews'
    >;
    /** Every review: undefined until "Mostra tutte" asks the server for them. */
    allReviews?: TrainerReview[];
};

/**
 * Average and stars (each bar filters the list), the latest 3 reviews, then
 * all of them, 10 at a time, sorted as the client chooses.
 */
export default function ReviewsSection({
    trainer,
    allReviews,
}: ReviewsSectionProps) {
    const firstName = trainer.name.split(' ')[0];
    const sectionRef = useRef<HTMLElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [stars, setStars] = useState<number | null>(null);
    const [sort, setSort] = useState<Sort>('recent');
    const [shown, setShown] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(false);

    if (trainer.rating === null) {
        return null;
    }

    /** All the reviews come with the first click, once: the rest happens here. */
    const showAll = () => {
        setExpanded(true);

        if (allReviews === undefined && !loading) {
            router.reload({
                only: ['allReviews'],
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            });
        }
    };

    const changeStars = (value: number | null) => {
        setStars(value);
        setShown(PAGE_SIZE);
        showAll();
    };

    const changeSort = (value: Sort) => {
        setSort(value);
        setShown(PAGE_SIZE);
        showAll();
    };

    /** Back to the 3 latest, at the top of the section. */
    const showLess = () => {
        setExpanded(false);
        setStars(null);
        setSort('recent');
        setShown(PAGE_SIZE);
        sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // While all the reviews are loading, the preview stays on screen.
    const matching = sortReviews(
        (allReviews ?? trainer.reviews).filter(
            (review) => stars === null || review.rating === stars,
        ),
        sort,
    );
    const visible = matching.slice(0, expanded ? shown : 3);
    const starsCount =
        trainer.ratingDistribution.find((row) => row.stars === stars)?.count ??
        0;

    return (
        <ProfileSection
            ref={sectionRef}
            id="recensioni"
            titleId="reviews-title"
            title="Recensioni"
        >
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex w-42 shrink-0 flex-col gap-1.5 rounded-[20px] bg-primary p-4.5 text-primary-foreground tabular-nums">
                    <span className="text-[44px] leading-11.5 font-bold tracking-[-0.03em]">
                        {formatRating(trainer.rating)}
                    </span>
                    <StarRating value={Math.round(trainer.rating)} />
                    <span className="text-[13px] leading-[18px] text-primary-foreground/60">
                        {trainer.reviewCount}{' '}
                        {trainer.reviewCount === 1
                            ? 'recensione'
                            : 'recensioni'}
                    </span>
                </div>
                <RatingBreakdown
                    distribution={trainer.ratingDistribution}
                    total={trainer.reviewCount}
                    selected={stars}
                    onSelect={changeStars}
                    className="min-w-60 flex-1"
                />
            </div>

            {trainer.reviewCount > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                        aria-live="polite"
                        className="flex items-center gap-1 text-sm font-medium"
                    >
                        {stars !== null && (
                            <>
                                Recensioni da {stars}{' '}
                                {stars === 1 ? 'stella' : 'stelle'} (
                                {starsCount})
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto px-1"
                                    onClick={() => changeStars(null)}
                                >
                                    Mostra tutte
                                </Button>
                            </>
                        )}
                    </p>
                    <Select
                        value={sort}
                        onValueChange={(value) => changeSort(value as Sort)}
                    >
                        <SelectTrigger
                            aria-label="Ordina le recensioni"
                            className="ml-auto h-11 w-44 bg-background md:h-9"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {Object.entries(SORTS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {visible.map((review) => (
                    <ReviewCard
                        key={review.id}
                        authorName={review.authorName}
                        meta={reviewMeta(review)}
                        rating={review.rating}
                        text={review.text}
                        className="rounded-[18px] border-muted bg-muted/50 p-4.5 md:p-4.5"
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

            {!expanded && trainer.reviewCount > trainer.reviews.length && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 md:h-9 md:self-start"
                    onClick={showAll}
                >
                    Mostra tutte le {trainer.reviewCount} recensioni
                </Button>
            )}
            {expanded &&
                (loading || visible.length < matching.length ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 md:h-9 md:self-start"
                        disabled={loading}
                        onClick={() => setShown(shown + PAGE_SIZE)}
                    >
                        {loading && <Spinner aria-hidden="true" />}
                        Mostra altre recensioni
                    </Button>
                ) : (
                    trainer.reviewCount > 3 && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 md:h-9 md:self-start"
                            onClick={showLess}
                        >
                            Mostra meno
                        </Button>
                    )
                ))}

            <p className="text-[13px] leading-[18px] text-muted-foreground">
                Le recensioni arrivano solo da clienti che hanno svolto una
                seduta con questo trainer.
            </p>
        </ProfileSection>
    );
}

/** "Seduta singola · 2 giorni fa", or just "Luglio 2026" without the service. */
function reviewMeta(review: TrainerReview): string {
    const meta = [review.serviceName, formatPastDate(review.createdAt)]
        .filter(Boolean)
        .join(' · ');

    return meta.charAt(0).toUpperCase() + meta.slice(1);
}

/** The ISO UTC dates sort as text; same rating → the newest first. */
function sortReviews(reviews: TrainerReview[], sort: Sort): TrainerReview[] {
    const newest = (a: TrainerReview, b: TrainerReview) =>
        b.createdAt.localeCompare(a.createdAt);

    return [...reviews].sort((a, b) => {
        switch (sort) {
            case 'oldest':
                return -newest(a, b);
            case 'best':
                return b.rating - a.rating || newest(a, b);
            case 'worst':
                return a.rating - b.rating || newest(a, b);
            default:
                return newest(a, b);
        }
    });
}
