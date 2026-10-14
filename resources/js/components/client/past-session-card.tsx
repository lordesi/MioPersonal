import { Link } from '@inertiajs/react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import TrainerRow from '@/components/client/trainer-row';
import { Button } from '@/components/ui/button';
import { formatDayShort } from '@/lib/format';
import type { ClientPastSession } from '@/types';

type PastSessionCardProps = {
    session: ClientPastSession;
};

/**
 * A completed session: book the trainer again.
 * TODO: «Lascia una recensione» (components/client/review-form.tsx) comes back
 * once reviews are saved on the server (`reviews` table, next step).
 */
export default function PastSessionCard({ session }: PastSessionCardProps) {
    return (
        <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 md:p-5">
            <TrainerRow
                name={session.trainerName}
                href={session.trainerHref}
                detail={`${formatDayShort(session.start)} · ${session.serviceName}`}
                aside={<BookingStatusBadge status="completed" />}
            />

            {session.review && (
                <span className="text-sm text-muted-foreground">
                    Hai lasciato {session.review.rating}{' '}
                    {session.review.rating === 1 ? 'stella' : 'stelle'}: «
                    {session.review.text}»
                </span>
            )}

            <div className="flex gap-2">
                <Button asChild variant="outline" className="h-10 px-3.5">
                    <Link href={session.trainerHref}>Prenota di nuovo</Link>
                </Button>
            </div>
        </article>
    );
}
