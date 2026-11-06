/** The logged-in user: only these fields are shared (HandleInertiaRequests). */
export type User = {
    id: number;
    name: string;
    email: string;
    /** URL of the photo (Completa profilo); null shows the initials. */
    avatar?: string | null;
    email_verified_at: string | null;
    /** See App\Enums\UserRole. */
    role?: 'client' | 'trainer' | 'admin';
};

export type Auth = {
    user: User;
    /** Trainers saved by a client (null for the other roles). */
    favoritesCount: number | null;
};
