import { router } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useRef, useState } from 'react';
import ReportDialog from '@/components/shared/report-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { formatPastDate, formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerProfile, TrainerReview } from '@/types';

/** Reviews added by each "Mostra altre recensioni". */
const PAGE_SIZE = 10;

type ReviewsBlockProps = {
    trainer: Pick<
        TrainerProfile,
        'name' | 'rating' | 'reviewCount' | 'ratingDistribution' | 'reviews'
    >;
    /** Every review: undefined until "Mostra tutte" asks the server for them. */
    allReviews?: TrainerReview[];
    /** "Segnala" under each review: not in the preview of a profile. */
    canReport: boolean;
};

/**
 * "Recensioni" of the dark profile: the average with the bars from 5 to 1,
 * the latest 3 (two side by side on desktop, the ones with an answer on a
 * whole row), then all of them, 10 at a time, the newest first.
 */
export default function ReviewsBlock({
    trainer,
    allReviews,
    canReport,
}: ReviewsBlockProps) {
    const firstName = trainer.name.split(' ')[0];
    const sectionRef = useRef<HTMLElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [shown, setShown] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(false);

    if (trainer.rating === null) {
        return null;
    }

    /** All the reviews come with the first click, once. */
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

    /** Back to the 3 latest, at the top of the section. */
    const showLess = () => {
        setExpanded(false);
        setShown(PAGE_SIZE);
        sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // While all the reviews are loading, the preview stays on screen.
    const list = expanded ? (allReviews ?? trainer.reviews) : trainer.reviews;
    const visible = list.slice(0, expanded ? shown : 3);
    const reviews = trainer.reviewCount === 1 ? 'recensione' : 'recensioni';

    return (
        <section
            ref={sectionRef}
            id="recensioni"
            aria-labelledby="reviews-title"
            className="flex scroll-mt-6 flex-col gap-4 md:gap-5"
        >
            <h2
                id="reviews-title"
                className="text-[22px] leading-7 font-bold md:text-[28px] md:leading-8.5"
            >
                Recensioni
            </h2>

            <div className="flex items-center gap-4 md:gap-10 md:p-6">
                <div className="flex shrink-0 flex-col gap-1 md:gap-1.5">
                    <span className="text-[40px] leading-11 font-bold tabular-nums md:text-[56px] md:leading-none">
                        {formatRating(trainer.rating)}
                    </span>
                    <Stars value={Math.round(trainer.rating)} />
                    <span className="text-[13px] text-muted-foreground md:text-sm">
                        {trainer.reviewCount} {reviews}
                    </span>
                </div>
                <ul className="flex flex-1 flex-col gap-1.5 text-xs text-muted-foreground tabular-nums md:gap-2 md:text-[13px]">
                    {trainer.ratingDistribution.map((row) => (
                        <li
                            key={row.stars}
                            className="flex items-center gap-2 md:gap-2.5"
                        >
                            <span className="w-2.5">{row.stars}</span>
                            <span
                                aria-hidden="true"
                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                            >
                                <span
                                    className="block h-full bg-brand"
                                    style={{
                                        width: `${trainer.reviewCount > 0 ? (row.count / trainer.reviewCount) * 100 : 0}%`,
                                    }}
                                />
                            </span>
                            <span className="w-3 text-right">{row.count}</span>
                            <span className="sr-only">
                                {row.count}{' '}
                                {row.count === 1 ? 'recensione' : 'recensioni'}{' '}
                                da {row.stars}{' '}
                                {row.stars === 1 ? 'stella' : 'stelle'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <ul className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-6">
                {visible.map((review) => (
                    <li
                        key={review.id}
                        className={cn(
                            'flex flex-col gap-2.5 border-b border-white/17 pb-4 md:gap-3 md:border-b-0 md:pb-0',
                        )}
                    >
                        <ReviewItem
                            review={review}
                            firstName={firstName}
                            canReport={canReport}
                        />
                    </li>
                ))}
            </ul>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
                {!expanded && trainer.reviewCount > trainer.reviews.length && (
                    <button
                        type="button"
                        onClick={showAll}
                        className="h-11 rounded-full bg-brand px-6 text-[17px] font-semibold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-12 md:text-base"
                    >
                        Mostra tutte le {trainer.reviewCount} recensioni
                    </button>
                )}
                {expanded &&
                    (loading || visible.length < list.length ? (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setShown(shown + PAGE_SIZE)}
                            className="btn-brand h-11 text-[17px] md:h-12.5 md:w-80"
                        >
                            {loading && <Spinner aria-hidden="true" />}
                            Mostra altre recensioni
                        </button>
                    ) : (
                        trainer.reviewCount > 3 && (
                            <button
                                type="button"
                                onClick={showLess}
                                className="min-h-11 self-start px-2 text-[15px] font-semibold underline underline-offset-3"
                            >
                                Mostra meno
                            </button>
                        )
                    ))}
                <p className="text-[13px] text-muted-foreground">
                    Solo chi ha fatto una seduta con {firstName} può lasciare
                    una recensione.
                </p>
            </div>
        </section>
    );
}

function ReviewItem({
    review,
    firstName,
    canReport,
}: {
    review: TrainerReview;
    firstName: string;
    canReport: boolean;
}) {
    const getInitials = useInitials();
    const date = formatPastDate(review.createdAt);

    return (
        <>
            <div className="flex items-center gap-2.5 md:gap-3">
                <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold md:size-10 md:text-[13px]"
                >
                    {getInitials(review.authorName)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-semibold">
                        {review.authorName}
                    </span>
                    <span className="text-xs text-muted-foreground md:text-[13px]">
                        {[
                            review.serviceName,
                            date.charAt(0).toUpperCase() + date.slice(1),
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </span>
                </span>
                <span className="flex items-center gap-1 text-[13px] font-semibold md:text-sm">
                    <Star
                        aria-hidden="true"
                        className="size-4 fill-brand text-brand"
                    />
                    <span className="sr-only">Voto:</span>
                    {review.rating}
                </span>
            </div>
            <p className="text-[15px] leading-5.25 break-words md:leading-5.5">
                {review.text}
            </p>
            {review.reply && (
                <p className="rounded-[14px] bg-muted px-3.5 py-3 text-[13px] leading-4.5 text-muted-foreground md:px-4 md:text-sm md:leading-5">
                    <span className="block font-semibold text-foreground md:inline">
                        Risposta di {firstName}
                        <span className="hidden md:inline">:</span>
                    </span>{' '}
                    {review.reply}
                </p>
            )}
            {canReport && (
                <ReportDialog
                    type="review"
                    target={review.id}
                    label="Segnala"
                    className="self-end"
                    contentClassName="theme-dark"
                />
            )}
        </>
    );
}

/** Five stars, the first `value` full: "4 stelle su 5". */
function Stars({ value }: { value: number }) {
    return (
        <span
            role="img"
            aria-label={`${value} stelle su 5`}
            className="flex gap-0.5 text-brand md:gap-0.75"
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden="true"
                    className={cn('size-4', star <= value && 'fill-current')}
                />
            ))}
        </span>
    );
}
