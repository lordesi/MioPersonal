import { Head } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import RatingOverview from '@/components/trainer/area/rating-overview';
import ReviewReplyCard from '@/components/trainer/area/review-reply-card';
import ProfilePage from '@/components/trainer/profile-pages/profile-page';
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
    const filters: { value: Filter; label: string; count: number }[] = [
        { value: 'all', label: 'Tutte', count: reviews.length },
        { value: 'toReply', label: 'Da rispondere', count: toReply.length },
        { value: 'replied', label: 'Con risposta', count: replied.length },
    ];

    return (
        <>
            <Head title="Recensioni" />

            <ProfilePage
                title="Recensioni"
                intro="Le risposte le leggono tutti."
            >
                {reviews.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-[24px] bg-card px-6 py-10 text-center">
                        <span className="flex size-13 items-center justify-center rounded-full bg-brand-soft text-brand">
                            <Star aria-hidden="true" className="size-6" />
                        </span>
                        <span className="text-lg font-semibold">
                            Ancora nessuna recensione
                        </span>
                        <span className="max-w-100 text-[15px] text-muted-foreground">
                            I clienti possono lasciare una recensione solo dopo
                            aver svolto una seduta con te.
                        </span>
                    </div>
                ) : (
                    <>
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

                        <div className="flex flex-col gap-4">
                            <div
                                role="group"
                                aria-label="Filtra recensioni"
                                aria-controls={listId}
                                className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
                            >
                                {filters.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        aria-pressed={filter === item.value}
                                        onClick={() => setFilter(item.value)}
                                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap text-foreground shadow-[inset_0_0_0_1px_var(--input)] outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-brand aria-pressed:text-black aria-pressed:shadow-none"
                                    >
                                        {item.label} {item.count}
                                    </button>
                                ))}
                            </div>

                            <div id={listId} className="flex flex-col">
                                {shown.length === 0 ? (
                                    <p className="rounded-[24px] bg-card px-6 py-8 text-center text-[15px] text-muted-foreground">
                                        {filter === 'toReply'
                                            ? 'Hai risposto a tutte le recensioni.'
                                            : 'Nessuna recensione con risposta, per ora.'}
                                    </p>
                                ) : (
                                    shown.map((review) => (
                                        <ReviewReplyCard
                                            key={review.id}
                                            review={review}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </ProfilePage>
        </>
    );
}

Reviews.layout = { section: 'reviews' };
