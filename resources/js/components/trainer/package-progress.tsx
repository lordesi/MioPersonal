import ProgressBar from '@/components/shared/progress-bar';
import { cn } from '@/lib/utils';

/** Above this many sessions the cells would be too thin: one plain bar. */
const MAX_CELLS = 20;

type PackageProgressProps = {
    done: number;
    total: number;
    /** On the black card of the client: lighter empty cells. */
    tone?: 'light' | 'dark';
    className?: string;
};

/**
 * The sessions of a package as a row of cells, one per session, the done
 * ones filled: "0/10" is ten empty cells (as in docs/design).
 */
export default function PackageProgress({
    done,
    total,
    tone = 'light',
    className,
}: PackageProgressProps) {
    const label = `Sedute svolte: ${done} di ${total}`;

    if (total > MAX_CELLS) {
        return (
            <ProgressBar
                value={done}
                max={total}
                label={label}
                className={cn('h-2', className)}
            />
        );
    }

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            className={cn('grid gap-0.75', className)}
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-2 rounded-full',
                        tone === 'light'
                            ? index < done
                                ? 'bg-foreground'
                                : 'bg-border'
                            : index < done
                              ? 'bg-sidebar-primary'
                              : 'bg-sidebar-foreground/20',
                    )}
                />
            ))}
        </div>
    );
}
