import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import UserAvatar from '@/components/shared/user-avatar';
import StarRating from '@/components/trainer/star-rating';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPastDate } from '@/lib/format';
import { reply as replyRoute } from '@/routes/trainer/reviews';
import type { TrainerAreaReview } from '@/types';

/** A client's review, with the trainer's public reply or the form to write one. */
export default function ReviewReplyCard({
    review,
}: {
    review: TrainerAreaReview;
}) {
    const replyId = useId();
    const [formOpen, setFormOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string>();
    const [sending, setSending] = useState(false);

    // Saved on the server: the page reloads the reviews with the reply.
    const publish = () =>
        router.post(
            replyRoute.url(review.id),
            { reply: draft.trim() },
            {
                preserveScroll: true,
                only: ['reviews'],
                onStart: () => setSending(true),
                onFinish: () => setSending(false),
                onError: (errors) => setError(errors.reply),
            },
        );

    return (
        <article className="flex flex-col gap-3 rounded-[20px] border bg-card p-5 md:p-6">
            <div className="flex items-center gap-3">
                <UserAvatar
                    name={review.authorName}
                    size="md"
                    className="[&_[data-slot=avatar-fallback]]:bg-secondary"
                />
                <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-[15px] leading-5 font-semibold">
                        {review.authorName} ·
                        <StarRating value={review.rating} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {review.serviceName && `${review.serviceName} · `}
                        {formatPastDate(review.date)}
                    </span>
                </div>
            </div>

            <p className="text-[15px] leading-5.5">{review.text}</p>

            {review.reply ? (
                <div className="rounded-r-lg border-l-3 border-foreground bg-muted p-3 text-sm">
                    <strong>La tua risposta:</strong> {review.reply}
                </div>
            ) : formOpen ? (
                <div className="flex flex-col gap-2">
                    <Label htmlFor={replyId}>La tua risposta pubblica</Label>
                    <Textarea
                        id={replyId}
                        rows={3}
                        maxLength={1000}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        aria-invalid={error ? true : undefined}
                    />
                    <InputError message={error} />
                    <Button
                        type="button"
                        className="self-start"
                        disabled={draft.trim() === '' || sending}
                        onClick={publish}
                    >
                        Pubblica risposta
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() => setFormOpen(true)}
                >
                    Rispondi
                </Button>
            )}
        </article>
    );
}
