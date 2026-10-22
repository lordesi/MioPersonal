import { Link } from '@inertiajs/react';
import CancelBookingDialog from '@/components/client/cancel-booking-dialog';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import {
    dateBlockParts,
    formatDayTimeRelative,
    formatTimeSpan,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClientUpcomingBooking } from '@/types';

type LaterSessionRowProps = {
    booking: ClientUpcomingBooking;
    now: Date;
};

/**
 * A confirmed session of "Più avanti": it can only be cancelled, and only
 * until the end of the free cancellation.
 */
export default function LaterSessionRow({
    booking,
    now,
}: LaterSessionRowProps) {
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const date = dateBlockParts(booking.start);
    const freeCancellation = new Date(booking.freeCancellationUntil) > now;

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border/60 bg-secondary/60 p-3.5">
            <span className="flex h-15 w-14 flex-none flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground tabular-nums">
                <span className="text-[11px] leading-3.5 font-bold uppercase">
                    {date.weekday}
                </span>
                <span className="text-[22px] leading-6.5 font-bold">
                    {date.day}
                </span>
                <span className="text-[11px] leading-3.5 font-bold uppercase">
                    {date.month}
                </span>
            </span>

            <span className="flex min-w-50 flex-1 flex-col">
                <span className="text-[15px] leading-5.5 font-bold tabular-nums">
                    {formatTimeSpan(booking.start, booking.hours)}
                </span>
                <span className="text-sm text-foreground/80">
                    {booking.discipline} con{' '}
                    <Link
                        href={booking.trainerHref}
                        className="hover:underline"
                    >
                        {booking.trainerName}
                    </Link>{' '}
                    · {booking.serviceLabel}
                </span>
                {(cancelled || freeCancellation) && (
                    <span
                        role={cancelled ? 'status' : undefined}
                        className="text-[13px] leading-4.5 text-muted-foreground tabular-nums"
                    >
                        {cancelled
                            ? `Seduta annullata. Abbiamo avvisato ${booking.trainerFirstName}.`
                            : `Cancellazione gratuita fino a ${formatDayTimeRelative(booking.freeCancellationUntil, now)}`}
                    </span>
                )}
            </span>

            <span
                className={cn(
                    'inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-semibold',
                    cancelled
                        ? 'border text-muted-foreground'
                        : 'bg-border text-foreground',
                )}
            >
                {cancelled ? 'Annullata' : 'Confermata'}
            </span>

            {/* Past the free cancellation it can't be cancelled any more. */}
            {!cancelled && freeCancellation && (
                <CancelBookingDialog
                    trainerFirstName={booking.trainerFirstName}
                    onConfirm={cancelBooking}
                    trigger={
                        <button
                            type="button"
                            className="inline-flex min-h-11 items-center px-1.5 text-sm font-medium underline"
                        >
                            Annulla
                        </button>
                    }
                />
            )}
        </li>
    );
}
