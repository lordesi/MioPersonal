import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { login } from '@/routes';
import { destroy, store } from '@/routes/client/favorites';

/**
 * Saves or removes a trainer from the client's favorites. Only the shared
 * data is reloaded (the number on "Preferiti" in the menu): the page stays
 * as it is. Guests are sent to the login.
 */
export function saveFavorite(
    slug: string,
    saved: boolean,
    onError?: () => void,
): void {
    router.visit(saved ? store.url(slug) : destroy.url(slug), {
        method: saved ? 'post' : 'delete',
        preserveScroll: true,
        preserveState: true,
        only: ['auth'],
        onError: () => {
            toast.error('Non siamo riusciti a salvare. Riprova tra poco.');
            onError?.();
        },
    });
}

/**
 * The heart of a trainer: full when saved. Only guests and clients can use
 * it (`canSave`): trainers and admins don't have favorites.
 */
export function useFavorite(
    slug: string,
    initial: boolean,
): { pressed: boolean; canSave: boolean; change: (pressed: boolean) => void } {
    const { auth } = usePage().props;
    const [pressed, setPressed] = useState(initial);
    const user = auth?.user;

    const change = (next: boolean) => {
        if (!user) {
            router.visit(login());

            return;
        }

        setPressed(next);
        saveFavorite(slug, next, () => setPressed(!next));
    };

    return {
        pressed,
        canSave: !user || user.role === 'client',
        change,
    };
}
