import { Link } from '@inertiajs/react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import SectionLabel from '@/components/shared/section-label';
import UserAvatar from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/types';

export type BookingSummaryRow = {
    label: string;
    value: ReactNode;
    /** Bold value, used for the price. */
    emphasis?: boolean;
};

type BookingSummaryProps = {
    /** Label above the card, e.g. "Riepilogo" or "Il tuo slot è riservato". */
    title: string;
    trainer: {
        name: string;
        /** e.g. "Functional e Pilates · Città Studi" */
        subtitle: string;
        href?: string;
        photoUrl?: string | null;
    };
    status?: BookingStatus;
    rows: BookingSummaryRow[];
    /** Actions under the details, e.g. "Sposta" and "Annulla la prenotazione". */
    children?: ReactNode;
    className?: string;
};

export default function BookingSummary({
    title,
    trainer,
    status,
    rows,
    children,
    className,
}: BookingSummaryProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className={cn(
                'flex flex-col gap-3.5 rounded-xl border bg-card p-4.5',
                className,
            )}
        >
            <SectionLabel id={titleId}>{title}</SectionLabel>

            <div className="flex items-center gap-3">
                <UserAvatar
                    name={trainer.name}
                    src={trainer.photoUrl}
                    size="lg"
                    className="text-muted-foreground"
                />
                <span className="flex flex-col">
                    {trainer.href ? (
                        <Link
                            href={trainer.href}
                            className="text-base font-semibold"
                        >
                            {trainer.name}
                        </Link>
                    ) : (
                        <span className="text-base font-semibold">
                            {trainer.name}
                        </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {trainer.subtitle}
                    </span>
                </span>
                {status && (
                    <BookingStatusBadge
                        status={status}
                        className="ml-auto shrink-0"
                    />
                )}
            </div>

            <dl className="flex flex-col gap-2.5 border-t pt-3.5 text-sm tabular-nums">
                {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd
                            className={cn(
                                'text-right',
                                row.emphasis ? 'font-semibold' : 'font-medium',
                            )}
                        >
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {children && (
                <div className="flex flex-wrap gap-2 pt-1">{children}</div>
            )}
        </section>
    );
}
