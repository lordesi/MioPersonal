import { Head } from '@inertiajs/react';
import { Star } from 'lucide-react';
import ResponsiveText from '@/components/shared/responsive-text';
import PageHeading from '@/components/trainer/area/page-heading';
import EmptyState from '@/components/states/empty-state';
import ReviewReplyCard from '@/components/trainer/area/review-reply-card';
import { formatRating } from '@/lib/format';
import type { TrainerAreaReview } from '@/types';

type ReviewsProps = {
    /** average is null until the first review. */
    summary: { average: number | null; count: number };
    reviews: TrainerAreaReview[];
};

export default function Reviews({ summary, reviews }: ReviewsProps) {
    const totals =
        summary.average === null
            ? 'Ancora nessuna recensione'
            : `${formatRating(summary.average)} di media · ${summary.count} recensioni`;

    return (
        <>
            <Head title="Recensioni" />

            <PageHeading
                title="Recensioni"
                description={
                    <ResponsiveText
                        mobile={totals}
                        desktop={
                            summary.count === 0
                                ? totals
                                : `${totals} · tutte da sedute svolte`
                        }
                    />
                }
            />

            {reviews.length === 0 && (
                <EmptyState
                    icon={Star}
                    title="Ancora nessuna recensione"
                    description="Dopo una seduta svolta il cliente può lasciarti una recensione: la trovi qui e puoi rispondere."
                    bordered
                />
            )}

            {reviews.map((review) => (
                <ReviewReplyCard key={review.id} review={review} />
            ))}
        </>
    );
}

Reviews.layout = { section: 'reviews' };
