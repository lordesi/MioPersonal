import { Head } from '@inertiajs/react';
import ResponsiveText from '@/components/shared/responsive-text';
import PageHeading from '@/components/trainer/area/page-heading';
import ReviewReplyCard from '@/components/trainer/area/review-reply-card';
import { Button } from '@/components/ui/button';
import { formatRating } from '@/lib/format';
import type { TrainerAreaReview } from '@/types';

type ReviewsProps = {
    summary: { average: number; count: number };
    reviews: TrainerAreaReview[];
};

export default function Reviews({ summary, reviews }: ReviewsProps) {
    const totals = `${formatRating(summary.average)} di media · ${summary.count} recensioni`;

    return (
        <>
            <Head title="Recensioni" />

            <PageHeading
                title="Recensioni"
                description={
                    <ResponsiveText
                        mobile={totals}
                        desktop={`${totals} · tutte da sedute svolte`}
                    />
                }
                action={
                    // TODO: send the client a link to review their last session.
                    <Button
                        type="button"
                        variant="outline"
                        className="hidden h-10 md:inline-flex"
                    >
                        Chiedi una recensione
                    </Button>
                }
            />

            {reviews.map((review) => (
                <ReviewReplyCard key={review.id} review={review} />
            ))}
        </>
    );
}

Reviews.layout = { section: 'reviews' };
