/** The logged-in user: only these fields are shared (HandleInertiaRequests). */
export type User = {
    id: number;
    name: string;
    email: string;
    /** URL of the photo (Completa profilo); null shows the initials. */
    avatar?: string | null;
    email_verified_at: string | null;
    /** See App\Enums\UserRole. */
    role?: 'client' | 'trainer' | 'admin' | 'gym';
};

export type Auth = {
    user: User;
    /** Unread notifications, the number on the bell (components/layout/notification-bell.tsx). */
    unreadNotifications: number;
    /** Trainers and gyms saved by a client, for the menu (null for the other roles). */
    favoritesCount: number | null;
    /** The same, apart: the "Preferiti" filter of each search. */
    favoriteCounts: { trainers: number; gyms: number } | null;
};
