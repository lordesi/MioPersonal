import { Head } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import EmptyState from '@/components/states/empty-state';
import PageHeading from '@/components/trainer/area/page-heading';
import RatingOverview from '@/components/trainer/area/rating-overview';
import ReviewReplyCard from '@/components/trainer/area/review-reply-card';
import SegmentedTabs from '@/components/trainer/area/segmented-tabs';
import type { TrainerAreaReview } from '@/types';

type ReviewsProps = {
    /** average is null until the first review. */
    summary: { average: number | null; count: number };
    reviews: TrainerAreaReview[];
};

type Filter = 'all' | 'toReply' | 'replied';

/** "Recensioni": the clients' reviews, the reply to each one and the average. */
export default function Reviews({ summary, reviews }: ReviewsProps) {
    const listId = useId();
    const [filter, setFilter] = useState<Filter>('all');

    const toReply = reviews.filter((review) => review.reply === null);
    const replied = reviews.filter((review) => review.reply !== null);
    const shown = { all: reviews, toReply, replied }[filter];

    return (
        <>
            <Head title="Recensioni" />

            <PageHeading
                title="Recensioni"
                action={
                    reviews.length > 0 && (
                        <SegmentedTabs
                            label="Filtra recensioni"
                            controls={listId}
                            value={filter}
                            onChange={setFilter}
                            tabs={[
                                {
                                    value: 'all',
                                    label: 'Tutte',
                                    count: reviews.length,
                                },
                                {
                                    value: 'toReply',
                                    label: 'Da rispondere',
                                    count: toReply.length,
                                },
                                {
                                    value: 'replied',
                                    label: 'Con risposta',
                                    count: replied.length,
                                },
                            ]}
                        />
                    )
                }
            />

            {reviews.length === 0 ? (
                <EmptyState
                    icon={Star}
                    title="Ancora nessuna recensione"
                    description="Dopo una seduta svolta il cliente può lasciarti una recensione: la trovi qui e puoi rispondere."
                    bordered
                    className="rounded-3xl bg-card"
                />
            ) : (
                <div className="flex flex-wrap items-start gap-5">
                    <div
                        id={listId}
                        role="tabpanel"
                        className="flex min-w-0 flex-[3_1_560px] flex-col gap-3.5"
                    >
                        {shown.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-input bg-card px-6 py-10 text-center text-sm text-foreground/70">
                                {filter === 'toReply'
                                    ? 'Hai risposto a tutte le recensioni.'
                                    : 'Nessuna recensione con risposta, per ora.'}
                            </div>
                        ) : (
                            shown.map((review) => (
                                <ReviewReplyCard
                                    key={review.id}
                                    review={review}
                                />
                            ))
                        )}
                    </div>

                    {summary.average !== null && (
                        <RatingOverview
                            average={summary.average}
                            count={summary.count}
                            ratings={reviews.map((review) => review.rating)}
                            allFromSession={reviews.every(
                                (review) => review.fromSession,
                            )}
                        />
                    )}
                </div>
            )}
        </>
    );
}

Reviews.layout = { section: 'reviews' };
