import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ratingWords = ['Pessima', 'Così così', 'Buona', 'Molto buona', 'Ottima'];

/** 0 → "Tocca le stelle", 4 → "Molto buona" */
function ratingLabel(rating: number): string {
    return rating === 0 ? 'Tocca le stelle' : ratingWords[rating - 1];
}

type ReviewFormProps = {
    onCancel: () => void;
    onPublish: (review: { rating: number; text: string }) => void;
    /** True while the review is being saved. */
    processing?: boolean;
    /** The server's answer when the review can't be saved. */
    error?: string;
};

/**
 * "Com'è andata?": stars and text to review a session done, opened right
 * under the session in "Sedute svolte". The text is required.
 */
export default function ReviewForm({
    onCancel,
    onPublish,
    processing = false,
    error,
}: ReviewFormProps) {
    const starsId = useId();
    const textId = useId();
    const errorId = useId();
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');

    return (
        <div className="flex flex-col gap-3 rounded-2xl border bg-muted/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
                <span id={starsId} className="text-sm font-semibold">
                    Com'è andata?
                </span>
                <span
                    role="radiogroup"
                    aria-labelledby={starsId}
                    className="flex gap-1"
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            aria-label={
                                star === 1 ? '1 stella' : `${star} stelle`
                            }
                            onClick={() => setRating(star)}
                            className="flex size-8 items-center justify-center rounded-lg transition-transform hover:scale-110 motion-reduce:transition-none"
                        >
                            <Star
                                aria-hidden="true"
                                strokeWidth={1.5}
                                className={cn(
                                    'size-6',
                                    star <= rating && 'fill-current',
                                )}
                            />
                        </button>
                    ))}
                </span>
                <span
                    aria-live="polite"
                    className="text-[13px] leading-4.5 text-muted-foreground"
                >
                    {ratingLabel(rating)}
                </span>
            </div>

            <label htmlFor={textId} className="sr-only">
                Racconta la tua esperienza
            </label>
            <Textarea
                id={textId}
                rows={2}
                maxLength={1000}
                value={text}
                placeholder="Racconta in breve la tua esperienza"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setText(event.target.value)}
                className="min-h-16 rounded-xl bg-card"
            />
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-9.5 rounded-[10px] px-3.5 text-[13px]"
                    onClick={onCancel}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    className="h-9.5 rounded-[10px] px-4 text-[13px] font-semibold"
                    disabled={rating === 0 || text.trim() === '' || processing}
                    onClick={() => onPublish({ rating, text })}
                >
                    Pubblica recensione
                </Button>
            </div>
        </div>
    );
}
