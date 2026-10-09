import { Link } from '@inertiajs/react';
import { useState } from 'react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import ReviewForm, { ratingLabel } from '@/components/client/review-form';
import TrainerRow from '@/components/client/trainer-row';
import { Button } from '@/components/ui/button';
import { formatDayShort } from '@/lib/format';
import type { ClientPastSession } from '@/types';

type PastSessionCardProps = {
    session: ClientPastSession;
};

/** A completed session: leave a review or book the trainer again. */
export default function PastSessionCard({ session }: PastSessionCardProps) {
    const [formOpen, setFormOpen] = useState(false);
    // TODO: save the review on the server; for now it only lives in the page.
    const [publishedRating, setPublishedRating] = useState<number | null>(null);

    const bookAgain = (
        <Button asChild variant="outline" className="h-10 px-3.5">
            <Link href={session.trainerHref}>Prenota di nuovo</Link>
        </Button>
    );

    return (
        <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 md:p-5">
            <TrainerRow
                name={session.trainerName}
                href={session.trainerHref}
                detail={`${formatDayShort(session.start)} · ${session.serviceName}`}
                aside={<BookingStatusBadge status="completed" />}
            />

            {session.review ? (
                <>
                    <span className="text-sm text-muted-foreground">
                        Hai lasciato {session.review.rating}{' '}
                        {session.review.rating === 1 ? 'stella' : 'stelle'}: «
                        {session.review.text}»
                    </span>
                    <div className="flex gap-2">{bookAgain}</div>
                </>
            ) : publishedRating !== null ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span role="status" className="text-sm tabular-nums">
                        <strong>Recensione pubblicata</strong> ·{' '}
                        {ratingLabel(publishedRating)}
                    </span>
                    {bookAgain}
                </div>
            ) : formOpen ? (
                <ReviewForm
                    onCancel={() => setFormOpen(false)}
                    onPublish={(review) => setPublishedRating(review.rating)}
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        className="h-10 px-3.5"
                        onClick={() => setFormOpen(true)}
                    >
                        Lascia una recensione
                    </Button>
                    {bookAgain}
                </div>
            )}
        </article>
    );
}
