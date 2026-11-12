import { Link } from '@inertiajs/react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import BookingGroup from '@/components/client/booking-group';
import CancelBookingDialog from '@/components/client/cancel-booking-dialog';
import TrainerRow from '@/components/client/trainer-row';
import { Button } from '@/components/ui/button';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import { formatHoursLeft, formatSlot, hoursUntil } from '@/lib/format';
import { searchUrl } from '@/lib/search';
import type { ClientPendingBooking } from '@/types';

type PendingBookingCardProps = {
    booking: ClientPendingBooking;
};

/**
 * A request the trainer has not answered yet, or one that expired or was declined.
 * Cancelling asks first and can't be undone: there is no "Ripristina".
 */
export default function PendingBookingCard({
    booking,
}: PendingBookingCardProps) {
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const isGuest = booking.group?.role === 'guest';

    const detail = [
        formatSlot(booking.start, booking.hours),
        booking.serviceName,
        // "Ripeti ogni settimana": the trainer may accept only this session.
        booking.repeatWeekly &&
            `richiesta: ${booking.repeatWeekly.toLowerCase()}`,
    ]
        .filter(Boolean)
        .join(' · ');
    const status =
        booking.status !== 'pending'
            ? booking.status
            : cancelled
              ? 'cancelled'
              : 'pending';

    return (
        <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 md:p-5">
            <TrainerRow
                name={booking.trainerName}
                href={booking.trainerHref}
                detail={detail}
                aside={<BookingStatusBadge status={status} />}
            />

            {booking.status === 'cancelled' && (
                <>
                    <span className="text-sm text-muted-foreground">
                        {booking.trainerFirstName} ha annullato la seduta.
                        Abbiamo liberato lo slot e, se era in un pacchetto, la
                        seduta è di nuovo disponibile.
                    </span>
                    {booking.cancelNote && (
                        <blockquote className="rounded-lg bg-muted px-3 py-2.5 text-[13px] leading-4.5">
                            «{booking.cancelNote}»
                        </blockquote>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button asChild className="h-10 px-3.5">
                            <Link href={booking.trainerHref}>
                                Scegli un altro orario
                            </Link>
                        </Button>
                    </div>
                </>
            )}

            {(status === 'expired' || status === 'declined') && (
                <>
                    <span className="text-sm text-muted-foreground">
                        {status === 'expired'
                            ? `${booking.trainerFirstName} non ha risposto in tempo, quindi lo slot è stato liberato.`
                            : `${booking.trainerFirstName} non può in questo orario.`}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild className="h-10 px-3.5">
                            <Link href={booking.trainerHref}>
                                Scegli un altro orario
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 px-3.5"
                        >
                            <Link href={searchUrl()}>Trainer simili</Link>
                        </Button>
                    </div>
                </>
            )}

            {status === 'pending' && booking.expiresAt && (
                <>
                    <p className="rounded-lg bg-muted px-3 py-2.5 text-[13px] leading-4.5">
                        {isGuest
                            ? 'Lo slot è riservato.'
                            : 'Lo slot è riservato per te.'}{' '}
                        {booking.trainerFirstName} ha ancora{' '}
                        <strong className="tabular-nums">
                            {formatHoursLeft(hoursUntil(booking.expiresAt))}
                        </strong>{' '}
                        per confermare: se non risponde, lo liberiamo e ti
                        avvisiamo.
                    </p>
                    {booking.group && (
                        <BookingGroup
                            bookingId={booking.id}
                            group={booking.group}
                            trainerName={booking.trainerName}
                        />
                    )}
                    {/* A friend invited to the session doesn't cancel it: they can only leave. */}
                    {!isGuest && (
                        <div className="flex flex-wrap gap-2">
                            <CancelBookingDialog
                                trainerFirstName={booking.trainerFirstName}
                                onConfirm={cancelBooking}
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 px-3.5 max-md:h-11 max-md:flex-[1_1_140px]"
                                    >
                                        Annulla
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </>
            )}

            {status === 'cancelled' && booking.status !== 'cancelled' && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                        role="status"
                        className="text-sm text-muted-foreground"
                    >
                        {/* The design says "Giulia è stata avvisata": rephrased
                            so it works for every trainer, whatever the gender. */}
                        Prenotazione annullata, senza costi. Abbiamo avvisato{' '}
                        {booking.trainerFirstName}.
                    </span>
                    <Button asChild variant="outline" className="h-10 px-3.5">
                        <Link href={booking.trainerHref}>Prenota di nuovo</Link>
                    </Button>
                </div>
            )}
        </article>
    );
}
