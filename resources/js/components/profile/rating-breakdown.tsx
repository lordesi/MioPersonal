import ProgressBar from '@/components/shared/progress-bar';
import { cn } from '@/lib/utils';

type RatingBreakdownProps = {
    /** One row per star, from 5 to 1. */
    distribution: { stars: number; count: number }[];
    total: number;
    /** The stars of the active filter, null = every review. */
    selected: number | null;
    onSelect: (stars: number | null) => void;
    className?: string;
};

/**
 * "5★ ▬▬▬▬▬ 18": how many reviews have each rating, like on Google. Each row
 * is a button that shows only those reviews; pressed again, it shows them all.
 */
export default function RatingBreakdown({
    distribution,
    total,
    selected,
    onSelect,
    className,
}: RatingBreakdownProps) {
    return (
        <div className={cn('flex flex-col gap-0.5', className)}>
            {distribution.map((row) => {
                const pressed = selected === row.stars;

                return (
                    <button
                        key={row.stars}
                        type="button"
                        aria-pressed={pressed}
                        aria-label={`${row.stars} stelle: ${row.count} ${row.count === 1 ? 'recensione' : 'recensioni'}`}
                        // Without reviews there is nothing to show.
                        disabled={row.count === 0}
                        onClick={() => onSelect(pressed ? null : row.stars)}
                        className={cn(
                            '-mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-1 text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                            pressed && 'bg-muted',
                            // A filter is on: the other rows step back.
                            selected !== null && !pressed && 'opacity-50',
                        )}
                    >
                        <span className="w-5 text-left text-muted-foreground">
                            {row.stars}★
                        </span>
                        <span aria-hidden="true" className="flex-1">
                            <ProgressBar
                                value={row.count}
                                max={total}
                                label={`${row.stars} stelle`}
                                className="h-2"
                            />
                        </span>
                        <span className="w-6 text-right text-muted-foreground">
                            {row.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
