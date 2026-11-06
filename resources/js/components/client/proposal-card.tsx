import { router } from '@inertiajs/react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CancelBookingDialog from '@/components/client/cancel-booking-dialog';
import { Button } from '@/components/ui/button';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import { formatHoursLeft, formatSlot, hoursUntil } from '@/lib/format';
import { accept, decline } from '@/routes/client/bookings/reschedule';
import type { ClientUpcomingBooking } from '@/types';

type ProposalCardProps = {
    booking: ClientUpcomingBooking & {
        proposal: NonNullable<ClientUpcomingBooking['proposal']>;
    };
};

/**
 * The trainer proposes another time ("Sposta"): accept it, keep the time of
 * now, or cancel for free (ClientRescheduleController).
 */
export default function ProposalCard({ booking }: ProposalCardProps) {
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const [processing, setProcessing] = useState(false);

    const answer = (route: Parameters<typeof router.visit>[0]) =>
        router.visit(route, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (errors) =>
                toast.error(errors.booking ?? 'Riprova tra poco.'),
        });

    if (cancelled) {
        return (
            <p
                role="status"
                className="rounded-xl border bg-card p-4 text-sm text-muted-foreground"
            >
                Seduta annullata, senza costi. Abbiamo avvisato{' '}
                {booking.trainerFirstName}.
            </p>
        );
    }

    return (
        <article className="flex flex-col gap-3.5 rounded-xl border-[1.5px] border-foreground bg-card p-4 md:p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-foreground text-background">
                    <CalendarClock aria-hidden="true" className="size-4.5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-semibold">
                        {booking.trainerFirstName} propone un altro orario
                    </h3>
                    <p className="flex flex-wrap items-center gap-x-2 text-sm tabular-nums">
                        <span className="text-muted-foreground line-through">
                            {formatSlot(booking.start, booking.hours)}
                        </span>
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                        <strong>
                            {formatSlot(
                                booking.proposal.start,
                                booking.proposal.hours,
                            )}
                        </strong>
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                        Hai{' '}
                        {formatHoursLeft(
                            hoursUntil(booking.proposal.expiresAt),
                        )}{' '}
                        per rispondere: poi resta l’orario di adesso.
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    disabled={processing}
                    className="h-10 px-4 font-semibold max-md:h-11 max-md:flex-[1_1_140px]"
                    onClick={() => answer(accept(booking.id))}
                >
                    Accetta
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={processing}
                    className="h-10 px-4 max-md:h-11 max-md:flex-[1_1_140px]"
                    onClick={() => answer(decline(booking.id))}
                >
                    Tieni l’orario di adesso
                </Button>
                <CancelBookingDialog
                    trainerFirstName={booking.trainerFirstName}
                    onConfirm={cancelBooking}
                    trigger={
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10 px-3 underline max-md:h-11"
                        >
                            Annulla gratis
                        </Button>
                    }
                />
            </div>
        </article>
    );
}
