import { cn } from '@/lib/utils';

type QuizProgressProps = {
    /** Current question, from 1. */
    step: number;
    total: number;
    /** Light segments, for the dark band of the mobile layout. */
    onPrimary?: boolean;
    className?: string;
};

/** One segment per question, filled up to the current one. */
export default function QuizProgress({
    step,
    total,
    onPrimary = false,
    className,
}: QuizProgressProps) {
    return (
        <div
            role="progressbar"
            aria-label="Avanzamento del quiz"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={step}
            className={cn('flex gap-1 md:gap-1.5', className)}
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-1 flex-1 rounded-full',
                        onPrimary
                            ? index < step
                                ? 'bg-primary-foreground'
                                : 'bg-primary-foreground/25'
                            : index < step
                              ? 'bg-primary'
                              : 'bg-muted',
                    )}
                />
            ))}
        </div>
    );
}
