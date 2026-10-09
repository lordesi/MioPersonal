import { TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import UserAvatar from '@/components/shared/user-avatar';
import { daysSince, formatWait, trainerStatuses } from '@/lib/admin';
import { cn } from '@/lib/utils';
import type { TrainerReviewStatus, TrainerUnderReview } from '@/types';

type VerificationQueueProps = {
    trainers: TrainerUnderReview[];
    /** Status after the decisions taken on this page. */
    statusOf: (trainer: TrainerUnderReview) => TrainerReviewStatus;
    selectedId: number;
    onSelect: (id: number) => void;
    reviewCount: number;
};

/** "In attesa · 4": the profiles to check, oldest first. */
export default function VerificationQueue({
    trainers,
    statusOf,
    selectedId,
    onSelect,
    reviewCount,
}: VerificationQueueProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="overflow-hidden rounded-[14px] border bg-card"
        >
            <div className="flex items-baseline justify-between border-b p-3.5">
                <h2
                    id={titleId}
                    className="text-[15px] font-semibold tabular-nums"
                >
                    In attesa · {reviewCount}
                </h2>
                <span className="text-xs text-muted-foreground">
                    Dal più vecchio
                </span>
            </div>

            <ul>
                {trainers.map((trainer) => {
                    const status = trainerStatuses[statusOf(trainer)];
                    const isSelected = trainer.id === selectedId;
                    const warnings = trainer.warnings.length;

                    return (
                        <li key={trainer.id}>
                            <button
                                type="button"
                                aria-current={isSelected ? 'true' : undefined}
                                onClick={() => onSelect(trainer.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 border-b px-3.5 py-3 text-left',
                                    isSelected
                                        ? 'bg-secondary shadow-[inset_3px_0_0_0] shadow-foreground'
                                        : 'hover:bg-accent',
                                )}
                            >
                                <UserAvatar
                                    name={trainer.name}
                                    size="md"
                                    className="size-10"
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="text-sm font-semibold">
                                        {trainer.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {trainer.disciplines.join(', ')} ·{' '}
                                        {trainer.zone}
                                    </span>
                                    <span className="flex flex-wrap gap-1 pt-1">
                                        <AdminBadge variant={status.variant}>
                                            {status.label}
                                        </AdminBadge>
                                        {warnings > 0 && (
                                            <AdminBadge variant="muted">
                                                <TriangleAlert
                                                    aria-hidden="true"
                                                    className="size-3"
                                                />
                                                {warnings === 1
                                                    ? '1 avviso'
                                                    : `${warnings} avvisi`}
                                            </AdminBadge>
                                        )}
                                    </span>
                                </span>
                                <span className="shrink-0 text-xs font-semibold tabular-nums">
                                    {formatWait(daysSince(trainer.statusSince))}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
