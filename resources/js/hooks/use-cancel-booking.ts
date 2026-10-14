import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cancel } from '@/routes/client/bookings';

/**
 * "Annulla" of a booking card: saves the cancellation on the server, then
 * the card shows «Prenotazione annullata» until the next visit.
 */
export function useCancelBooking(bookingId: number): {
    cancelled: boolean;
    cancelBooking: () => void;
} {
    const [cancelled, setCancelled] = useState(false);

    const cancelBooking = () =>
        router.patch(
            cancel.url(bookingId),
            {},
            {
                preserveScroll: true,
                // Only the shared data: the lists stay as they are, so the
                // card can show its message instead of disappearing.
                only: ['auth'],
                onSuccess: () => setCancelled(true),
                onError: (errors) =>
                    toast.error(errors.booking ?? 'Riprova tra poco.'),
            },
        );

    return { cancelled, cancelBooking };
}
