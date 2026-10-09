import { Star } from 'lucide-react';
import { formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';

type RatingSummaryProps = {
    rating: number;
    reviewCount?: number;
    /** 'short' → "★ 4,9 (23)" on cards, 'long' → "★ 4,9 · 23 recensioni" on the profile. */
    format?: 'short' | 'long';
    className?: string;
};

export default function RatingSummary({
    rating,
    reviewCount,
    format = 'short',
    className,
}: RatingSummaryProps) {
    const count =
        reviewCount === undefined
            ? null
            : format === 'short'
              ? `(${reviewCount})`
              : `· ${reviewCount} ${reviewCount === 1 ? 'recensione' : 'recensioni'}`;

    return (
        <span
            className={cn(
                'flex items-center gap-1 text-sm font-semibold tabular-nums',
                className,
            )}
        >
            <Star aria-hidden="true" className="size-3.5 fill-current" />
            {formatRating(rating)}
            {count && (
                <span className="font-normal text-muted-foreground">
                    {count}
                </span>
            )}
        </span>
    );
}
