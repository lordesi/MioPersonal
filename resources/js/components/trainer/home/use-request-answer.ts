import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { accept, decline } from '@/routes/trainer/requests';
import type { TrainerBookingRequest } from '@/types';

/**
 * "Accetta" and "Rifiuta" of a booking request, from "Home" and from
 * "Richieste". `only`: the props the page reloads after the answer.
 */
export function useRequestAnswer(only: string[]) {
    // The request whose answer is being saved.
    const [busyId, setBusyId] = useState<number | null>(null);

    const answer = (
        request: TrainerBookingRequest,
        value: 'confirmed' | 'declined',
        weekly = false,
    ) => {
        const action = value === 'confirmed' ? accept : decline;

        router.post(action.url(request.id), weekly ? { weekly: true } : {}, {
            preserveScroll: true,
            // The badge of the menu follows.
            only: [...only, 'trainerArea'],
            onStart: () => setBusyId(request.id),
            onFinish: () => setBusyId(null),
            onSuccess: () => {
                // "Accetta ogni settimana": the server says how many sessions are set.
                if (weekly) {
                    return;
                }

                toast.success(
                    value === 'confirmed'
                        ? `Confermata: ${request.clientName} riceve i tuoi contatti.`
                        : 'Rifiutata: lo slot è di nuovo libero.',
                );
            },
            // Expired or cancelled meanwhile: say it and show the real list.
            onError: (errors) => {
                toast.error(errors.booking ?? 'Riprova tra poco.');
                router.reload({ only: [...only, 'trainerArea'] });
            },
        });
    };

    return { busyId, answer };
}
