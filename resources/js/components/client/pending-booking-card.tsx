import { Link } from '@inertiajs/react';
import { useState } from 'react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import TrainerRow from '@/components/client/trainer-row';
import { Button } from '@/components/ui/button';
import { formatHoursLeft, formatSlot, hoursUntil } from '@/lib/format';
import { searchUrl } from '@/lib/search';
import type { ClientPendingBooking } from '@/types';

type PendingBookingCardProps = {
    booking: ClientPendingBooking;
};

/**
 * A request the trainer has not answered yet, or one that expired.
 * Cancelling only changes the page for now.
 */
export default function PendingBookingCard({
    booking,
}: PendingBookingCardProps) {
    // TODO: send cancel/restore to the server once bookings are stored.
    const [cancelled, setCancelled] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const detail = `${formatSlot(booking.start, booking.hours)} · ${booking.serviceName}`;
    const status =
        booking.status === 'expired'
            ? 'expired'
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

            {status === 'expired' && (
                <>
                    <span className="text-sm text-muted-foreground">
                        {booking.trainerFirstName} non ha risposto entro 24 ore,
                        quindi lo slot è stato liberato.
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
                        Lo slot è riservato per te. {booking.trainerFirstName}{' '}
                        ha ancora{' '}
                        <strong className="tabular-nums">
                            {formatHoursLeft(hoursUntil(booking.expiresAt))}
                        </strong>{' '}
                        per confermare: se non risponde, lo liberiamo e ti
                        avvisiamo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-3.5 max-md:h-11 max-md:flex-[1_1_140px]"
                            aria-expanded={calendarOpen}
                            onClick={() => setCalendarOpen(!calendarOpen)}
                        >
                            Aggiungi al calendario
                        </Button>
                        {/* TODO: open the reschedule flow. */}
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-3.5 max-md:h-11 max-md:flex-[1_1_140px]"
                        >
                            Sposta
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10 px-3 underline"
                            onClick={() => setCancelled(true)}
                        >
                            Annulla
                        </Button>
                    </div>
                    {calendarOpen && (
                        // TODO: generate the calendar links and the .ics file.
                        <div
                            role="group"
                            aria-label="Aggiungi al calendario"
                            className="flex flex-wrap gap-1.5"
                        >
                            {[
                                'Google Calendar',
                                'Calendario Apple',
                                'Scarica .ics',
                            ].map((label) => (
                                <Button
                                    key={label}
                                    type="button"
                                    variant="outline"
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {status === 'cancelled' && (
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
                    <Button
                        type="button"
                        variant="ghost"
                        className="px-3 underline"
                        onClick={() => setCancelled(false)}
                    >
                        Ripristina
                    </Button>
                </div>
            )}
        </article>
    );
}
