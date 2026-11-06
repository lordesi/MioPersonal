import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { login } from '@/routes';
import { destroy, store } from '@/routes/client/favorites';
import {
    destroy as destroyGym,
    store as storeGym,
} from '@/routes/client/favorites/gyms';

/** What the heart saves: a trainer profile or a gym. */
export type FavoriteKind = 'trainer' | 'gym';

const routes = {
    trainer: { store, destroy },
    gym: { store: storeGym, destroy: destroyGym },
};

/**
 * Saves or removes a trainer (or a gym) from the client's favorites. Only
 * the shared data is reloaded (the numbers on "Preferiti" in the menu and
 * in the searches): the page stays as it is. Guests are sent to the login.
 */
export function saveFavorite(
    slug: string,
    saved: boolean,
    onError?: () => void,
    kind: FavoriteKind = 'trainer',
): void {
    const { store, destroy } = routes[kind];

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
 * The heart of a trainer or a gym: full when saved. Only guests and clients
 * can use it (`canSave`): trainers, gyms and admins don't have favorites.
 */
export function useFavorite(
    slug: string,
    initial: boolean,
    kind: FavoriteKind = 'trainer',
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
        saveFavorite(slug, next, () => setPressed(!next), kind);
    };

    return {
        pressed,
        canSave: !user || user.role === 'client',
        change,
    };
}
