import { router } from '@inertiajs/react';
import { CalendarPlus, MapPin } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatSlot } from '@/lib/format';
import { accept, decline } from '@/routes/client/bookings/proposal';
import type { ClientPendingBooking } from '@/types';

/**
 * A session the trainer put in the calendar with the client ("Aggiungi
 * seduta"): "Accetta" confirms it, "Rifiuta" frees the time
 * (ClientSessionProposalController). Without an answer it lapses when the
 * session starts.
 */
export default function TrainerProposalCard({
    booking,
}: {
    booking: ClientPendingBooking;
}) {
    const [processing, setProcessing] = useState(false);

    const answer = (route: Parameters<typeof router.visit>[0]) =>
        router.visit(route, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (errors) =>
                toast.error(errors.booking ?? 'Riprova tra poco.'),
        });

    return (
        <article className="flex flex-col gap-3.5 rounded-xl border-[1.5px] border-foreground bg-card p-4 md:p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-foreground text-background">
                    <CalendarPlus aria-hidden="true" className="size-4.5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-semibold">
                        {booking.trainerFirstName} ti propone una seduta
                    </h3>
                    <p className="text-sm tabular-nums">
                        <strong>
                            {formatSlot(booking.start, booking.hours)}
                        </strong>
                        {' · '}
                        {booking.serviceName}
                    </p>
                    {booking.placeLabel && (
                        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                            <MapPin aria-hidden="true" className="size-3.5" />
                            {booking.placeLabel}
                        </p>
                    )}
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
                    Rifiuta
                </Button>
            </div>
        </article>
    );
}
