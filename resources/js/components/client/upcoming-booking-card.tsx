import BookingStatusBadge from '@/components/booking/booking-status-badge';
import { Button } from '@/components/ui/button';
import {
    dateBlockParts,
    formatDayTimeLong,
    formatTimeRange,
} from '@/lib/format';
import type { ClientUpcomingBooking } from '@/types';

type UpcomingBookingCardProps = {
    booking: ClientUpcomingBooking;
};

const outlineOnPrimary =
    'h-10 flex-[1_1_120px] border border-current bg-transparent text-primary-foreground shadow-none hover:bg-primary-foreground/10';

/** Dark card of a confirmed session, with the trainer's contacts. */
export default function UpcomingBookingCard({
    booking,
}: UpcomingBookingCardProps) {
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
                <BookingStatusBadge status={booking.status} onPrimary />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button asChild className={outlineOnPrimary}>
                    <a href={`tel:${booking.trainerPhone}`}>Chiama</a>
                </Button>
                <Button asChild className={outlineOnPrimary}>
                    <a href={`mailto:${booking.trainerEmail}`}>Email</a>
                </Button>
                {/* TODO: offer Google, Apple and .ics once calendar export exists. */}
                <Button
                    type="button"
                    className="h-10 flex-[1_1_120px] bg-primary-foreground font-semibold text-primary hover:bg-primary-foreground/90"
                >
                    Aggiungi al calendario
                </Button>
            </div>

            {/* TODO: wire "Sposta" and "Annulla" to the booking flow. */}
            <span className="text-xs tabular-nums opacity-75">
                Cancellazione gratuita fino a{' '}
                {formatDayTimeLong(booking.freeCancellationUntil)} ·{' '}
                <button type="button" className="underline">
                    Sposta
                </button>{' '}
                ·{' '}
                <button type="button" className="underline">
                    Annulla
                </button>
            </span>
        </article>
    );
}
