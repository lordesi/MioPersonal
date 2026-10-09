import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ratingWords = ['Pessima', 'Così così', 'Buona', 'Molto buona', 'Ottima'];

/** 0 → "Tocca una stella", 4 → "4 su 5 · Molto buona" */
export function ratingLabel(rating: number): string {
    return rating === 0
        ? 'Tocca una stella'
        : `${rating} su 5 · ${ratingWords[rating - 1]}`;
}

type ReviewFormProps = {
    onCancel: () => void;
    onPublish: (review: { rating: number; text: string }) => void;
};

/** Star picker and text box to review a completed session. */
export default function ReviewForm({ onCancel, onPublish }: ReviewFormProps) {
    const textId = useId();
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');

    return (
        <div className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-1">
                <legend className="pb-1 text-sm font-medium">
                    Il tuo voto
                </legend>
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            aria-label={
                                star === 1 ? '1 stella' : `${star} stelle`
                            }
                            aria-pressed={star <= rating}
                            onClick={() => setRating(star)}
                            className="flex size-11 items-center justify-center rounded-lg hover:bg-accent"
                        >
                            <Star
                                aria-hidden="true"
                                className={cn(
                                    'size-7',
                                    star <= rating && 'fill-current',
                                )}
                            />
                        </button>
                    ))}
                    <span
                        aria-live="polite"
                        className="ml-2 text-sm text-muted-foreground tabular-nums"
                    >
                        {ratingLabel(rating)}
                    </span>
                </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={textId}>Racconta com'è andata</Label>
                <Textarea
                    id={textId}
                    rows={3}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3.5"
                    onClick={onCancel}
                >
                    Annulla
                </Button>
                <Button
                    type="button"
                    className="h-10 px-3.5"
                    disabled={rating === 0}
                    onClick={() => onPublish({ rating, text })}
                >
                    Pubblica
                </Button>
            </div>
        </div>
    );
}
