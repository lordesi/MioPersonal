import { cn } from '@/lib/utils';

/**
 * The sessions of the package up to this one filled; this one lighter when
 * missed. Only decoration: "seduta 2 di 10" is written just above. Used by
 * PastSessionCard ("Ultimi 7 giorni") and PastSessionList ("Sedute passate").
 */
export default function PackageCells({
    position,
    total,
    missed,
    className,
}: {
    position: number;
    total: number;
    missed: boolean;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            className={cn('mt-0.5 grid gap-0.75', className)}
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-1.25 rounded-full',
                        index >= position
                            ? 'bg-border'
                            : missed && index === position - 1
                              ? 'bg-muted-foreground/60'
                              : 'bg-foreground',
                    )}
                />
            ))}
        </span>
    );
}
