import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
    /** Whole stars from 1 to 5. */
    value: number;
    className?: string;
};

/** Read-only row of 5 stars, read aloud as "4 stelle su 5". */
export default function StarRating({ value, className }: StarRatingProps) {
    return (
        <span
            role="img"
            aria-label={`${value} ${value === 1 ? 'stella' : 'stelle'} su 5`}
            className={cn('flex gap-0.5', className)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden="true"
                    className={cn(
                        'size-3 md:size-3.5',
                        star <= value && 'fill-current',
                    )}
                />
            ))}
        </span>
    );
}
