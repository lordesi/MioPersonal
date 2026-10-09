import { useId, useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import StarRating from '@/components/trainer/star-rating';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPastDate } from '@/lib/format';
import type { TrainerAreaReview } from '@/types';

/** A client's review, with the trainer's public reply or the form to write one. */
export default function ReviewReplyCard({
    review,
}: {
    review: TrainerAreaReview;
}) {
    const replyId = useId();
    // TODO: save the reply on the server; for now it only lives in the page.
    const [reply, setReply] = useState(review.reply);
    const [formOpen, setFormOpen] = useState(false);
    const [draft, setDraft] = useState('');

    return (
        <article className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:p-5">
            <div className="flex items-center gap-3">
                <UserAvatar name={review.authorName} size="md" />
                <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-[15px] leading-5 font-semibold">
                        {review.authorName} ·
                        <StarRating value={review.rating} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {review.serviceName} · {formatPastDate(review.date)}
                    </span>
                </div>
            </div>

            <p className="text-[15px] leading-5.5">{review.text}</p>

            {reply ? (
                <div className="rounded-r-lg border-l-3 border-foreground bg-muted p-3 text-sm">
                    <strong>La tua risposta:</strong> {reply}
                </div>
            ) : formOpen ? (
                <div className="flex flex-col gap-2">
                    <Label htmlFor={replyId}>La tua risposta pubblica</Label>
                    <Textarea
                        id={replyId}
                        rows={3}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                    />
                    <Button
                        type="button"
                        className="self-start"
                        disabled={draft.trim() === ''}
                        onClick={() => setReply(draft.trim())}
                    >
                        Pubblica risposta
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    className="self-start"
                    onClick={() => setFormOpen(true)}
                >
                    Rispondi
                </Button>
            )}
        </article>
    );
}
