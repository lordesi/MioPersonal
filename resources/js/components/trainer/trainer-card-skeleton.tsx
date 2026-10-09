import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TrainerCardSkeletonProps = {
    count?: number;
    /** Announced to screen readers while data loads. */
    label?: string;
    className?: string;
};

/** Grey placeholders shown instead of trainer cards while data loads. */
export default function TrainerCardSkeleton({
    count = 3,
    label = 'Caricamento dei trainer',
    className,
}: TrainerCardSkeletonProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3.5 rounded-xl border bg-card p-5',
                className,
            )}
        >
            <span role="status" className="sr-only">
                {label}
            </span>
            {Array.from({ length: count }, (_, index) => (
                <div key={index} aria-hidden="true" className="flex gap-3">
                    <Skeleton className="size-18 shrink-0 rounded-lg bg-muted" />
                    <div className="flex flex-1 flex-col gap-2 pt-1">
                        <Skeleton className="h-3.5 w-3/5 rounded-lg bg-muted" />
                        <Skeleton className="h-3 w-2/5 rounded-lg bg-muted" />
                        <Skeleton className="h-3 w-3/4 rounded-lg bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
