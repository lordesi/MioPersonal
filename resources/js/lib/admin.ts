import type { AdminBadgeVariant } from '@/components/admin/admin-badge';
import type {
    AdminBookingStatus,
    ContactMessageStatus,
    TrainerReviewStatus,
} from '@/types';

type StatusStyle = { label: string; variant: AdminBadgeVariant };

export const trainerStatuses: Record<TrainerReviewStatus, StatusStyle> = {
    review: { label: 'In revisione', variant: 'dashed' },
    changes: { label: 'Modifiche richieste', variant: 'outline' },
    approved: { label: 'Approvato', variant: 'solid' },
    rejected: { label: 'Rifiutato', variant: 'muted' },
};

export const messageStatuses: Record<ContactMessageStatus, StatusStyle> = {
    new: { label: 'Nuovo', variant: 'solid' },
    'in-progress': { label: 'In corso', variant: 'dashed' },
    closed: { label: 'Chiuso', variant: 'muted' },
};

export const bookingStatuses: Record<AdminBookingStatus, StatusStyle> = {
    pending: { label: 'In attesa', variant: 'dashed' },
    confirmed: { label: 'Confermata', variant: 'solid' },
    completed: { label: 'Svolta', variant: 'outline' },
    expired: { label: 'Decaduta', variant: 'muted' },
    cancelled: { label: 'Annullata', variant: 'muted' },
    no_show: { label: 'Assenza', variant: 'muted' },
};

/** Whole days from an ISO UTC moment until now (never negative). */
export function daysSince(iso: string, now = new Date()): number {
    const days =
        (now.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);

    return Math.max(0, Math.floor(days));
}

/** 0 → "oggi", 1 → "1 giorno", 3 → "3 giorni" (how long a trainer is waiting). */
export function formatWait(days: number): string {
    if (days === 0) {
        return 'oggi';
    }

    return days === 1 ? '1 giorno' : `${days} giorni`;
}
