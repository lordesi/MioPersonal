import { Link } from '@inertiajs/react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import CancelBookingDialog from '@/components/client/cancel-booking-dialog';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import {
    dateBlockParts,
    formatDayTimeLong,
    formatTimeRange,
} from '@/lib/format';
import type { ClientUpcomingBooking } from '@/types';

type UpcomingBookingCardProps = {
    booking: ClientUpcomingBooking;
};

/**
 * Dark card of a confirmed session. It can only be cancelled: to change the
 * time the client cancels and books again.
 */
export default function UpcomingBookingCard({
    booking,
}: UpcomingBookingCardProps) {
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const date = dateBlockParts(booking.start);

    return (
        <article className="flex flex-col gap-3 rounded-xl bg-primary p-3.5 text-primary-foreground md:p-5">
            <div className="flex items-center gap-3">
                <span className="flex h-15.5 w-14 flex-none flex-col items-center justify-center rounded-lg bg-primary-foreground text-primary tabular-nums">
                    <span className="text-[11px] font-semibold uppercase">
                        {date.weekday}
                    </span>
                    <span className="text-2xl leading-7 font-bold">
                        {date.day}
                    </span>
                    <span className="text-[11px] font-semibold uppercase">
                        {date.month}
                    </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[17px] leading-6 font-bold">
                        {booking.discipline} con {booking.trainerName}
                    </span>
                    <span className="text-[13px] leading-4.5 tabular-nums opacity-75">
                        {formatTimeRange(booking.start, booking.hours)} ·{' '}
                        {booking.placeLabel}
                    </span>
                </span>
                <BookingStatusBadge
                    status={cancelled ? 'cancelled' : booking.status}
                    onPrimary
                />
            </div>

            {cancelled ? (
                <span role="status" className="text-sm">
                    Prenotazione annullata. Abbiamo avvisato{' '}
                    {booking.trainerFirstName}.{' '}
                    <Link href={booking.trainerHref} className="underline">
                        Prenota di nuovo
                    </Link>
                </span>
            ) : (
                <span className="text-xs tabular-nums opacity-75">
                    Cancellazione gratuita fino a{' '}
                    {formatDayTimeLong(booking.freeCancellationUntil)} ·{' '}
                    <CancelBookingDialog
                        trainerFirstName={booking.trainerFirstName}
                        onConfirm={cancelBooking}
                        trigger={
                            <button type="button" className="underline">
                                Annulla
                            </button>
                        }
                    />
                </span>
            )}
        </article>
    );
}
