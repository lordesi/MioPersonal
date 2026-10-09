import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
    value: number;
    /** Defaults to 100 (percent). Use the real total for counts, e.g. 10 sessions. */
    max?: number;
    /** Accessible name, e.g. "Completamento del profilo". */
    label: string;
    className?: string;
};

export default function ProgressBar({
    value,
    max = 100,
    label,
    className,
}: ProgressBarProps) {
    return (
        <Progress
            value={value}
            max={max}
            aria-label={label}
            className={cn('h-1.5 bg-muted', className)}
        />
    );
}
