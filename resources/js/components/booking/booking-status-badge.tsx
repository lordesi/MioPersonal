import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statuses: Record<BookingStatus, { label: string; className: string }> = {
    pending: {
        label: 'Da confermare',
        className: 'border-dashed border-input bg-transparent text-foreground',
    },
    confirmed: {
        label: 'Confermata',
        className: 'border-transparent bg-primary text-primary-foreground',
    },
    completed: {
        label: 'Svolta',
        className: 'border-border bg-transparent text-foreground',
    },
    declined: {
        label: 'Rifiutata',
        className: 'border-transparent bg-muted text-muted-foreground',
    },
    cancelled: {
        label: 'Annullata',
        className: 'border-transparent bg-muted text-muted-foreground',
    },
    expired: {
        label: 'Non confermata',
        className: 'border-transparent bg-muted text-muted-foreground',
    },
};

type BookingStatusBadgeProps = {
    status: BookingStatus;
    /** Use on dark (bg-primary) surfaces, like the "Prossime" card. */
    onPrimary?: boolean;
    className?: string;
};

export default function BookingStatusBadge({
    status,
    onPrimary = false,
    className,
}: BookingStatusBadgeProps) {
    const { label, className: statusClassName } = statuses[status];

    return (
        <Badge
            className={cn(
                'h-5.5 rounded-full px-2 text-xs font-semibold',
                statusClassName,
                onPrimary &&
                    status === 'confirmed' &&
                    'bg-primary-foreground text-primary',
                className,
            )}
        >
            {label}
        </Badge>
    );
}
