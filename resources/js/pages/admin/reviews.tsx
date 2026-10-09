import { Head } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import ChoiceChips from '@/components/shared/choice-chips';
import StarRating from '@/components/trainer/star-rating';
import { Button } from '@/components/ui/button';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminReview } from '@/types';

type ReviewsProps = {
    reviews: AdminReview[];
};

type Filter = 'all' | 'warnings' | 'hidden';

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tutte' },
    { value: 'warnings', label: 'Con avvisi' },
    { value: 'hidden', label: 'Nascoste' },
];

export default function Reviews({ reviews }: ReviewsProps) {
    const [filter, setFilter] = useState<Filter>('all');
    // TODO: hiding a review only lives in the page until the backend exists.
    const [hidden, setHidden] = useState<Record<number, boolean>>({});

    const isHidden = (review: AdminReview) =>
        hidden[review.id] ?? review.hidden;

    const visible = reviews.filter((review) => {
        if (filter === 'warnings') {
            return review.warning !== null;
        }

        if (filter === 'hidden') {
            return isHidden(review);
        }

        return true;
    });

    return (
        <>
            <Head title="Admin · Recensioni" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra le recensioni"
                className="gap-1.5"
            />

            <div className="grid gap-3 lg:grid-cols-2">
                {visible.map((review) => (
                    <article
                        key={review.id}
                        className={cn(
                            'flex flex-col gap-2.5 rounded-[14px] bg-card p-4',
                            isHidden(review)
                                ? 'border border-dashed border-input opacity-70'
                                : 'border',
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[15px] font-semibold">
                                {review.authorName}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                su {review.trainerName} ·{' '}
                                {formatAgo(review.createdAt)}
                            </span>
                            <StarRating
                                value={review.rating}
                                className="ml-auto"
                            />
                        </div>
                        <p className="text-sm leading-5.25">{review.text}</p>
                        {review.warning && (
                            <AdminBadge
                                variant="warning"
                                className="h-6 px-2.5"
                            >
                                <TriangleAlert
                                    aria-hidden="true"
                                    className="size-3"
                                />
                                {review.warning}
                            </AdminBadge>
                        )}
                        <div className="flex items-center gap-2">
                            {isHidden(review) && (
                                <span className="text-xs font-semibold">
                                    Nascosta al pubblico
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                                onClick={() =>
                                    setHidden({
                                        ...hidden,
                                        [review.id]: !isHidden(review),
                                    })
                                }
                            >
                                {isHidden(review)
                                    ? 'Mostra di nuovo'
                                    : 'Nascondi'}
                            </Button>
                        </div>
                    </article>
                ))}
            </div>

            {visible.length === 0 && (
                <p className="rounded-[14px] border bg-card p-6 text-center text-muted-foreground">
                    Nessuna recensione con questo filtro.
                </p>
            )}
        </>
    );
}

Reviews.layout = { section: 'reviews' };
