import { router, usePage } from '@inertiajs/react';
import { Check, MessageCircle } from 'lucide-react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import UserAvatar from '@/components/shared/user-avatar';
import StarRating from '@/components/trainer/star-rating';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { formatPastDate } from '@/lib/format';
import { reply as replyRoute } from '@/routes/trainer/reviews';
import type { TrainerAreaReview } from '@/types';

/** Same limit as TrainerReviewsController::REPLY_MAX. */
const REPLY_MAX = 1000;

/**
 * A client's review in "Recensioni" (docs/design), with the trainer's public
 * reply or the form to write it. One reply only: it cannot be changed.
 */
export default function ReviewReplyCard({
    review,
}: {
    review: TrainerAreaReview;
}) {
    const nameId = useId();
    const replyId = useId();
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const [formOpen, setFormOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string>();
    const [sending, setSending] = useState(false);

    const firstName = review.authorName.split(' ')[0];
    // "Rispondi a Giorgio", but "Rispondi ad Anna".
    const replyTo = `${/^a/i.test(firstName) ? 'ad' : 'a'} ${firstName}`;

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
        <article
            aria-labelledby={nameId}
            className="flex flex-col gap-4.5 rounded-3xl border bg-card p-5 md:p-6"
        >
            <div className="flex flex-wrap items-center gap-3">
                <UserAvatar
                    name={review.authorName}
                    size="md"
                    className="size-11 text-sm font-bold [&_[data-slot=avatar-fallback]]:bg-sidebar [&_[data-slot=avatar-fallback]]:text-sidebar-foreground"
                />
                <span className="flex min-w-45 flex-1 flex-col">
                    <h2 id={nameId} className="text-base font-semibold">
                        {review.authorName}
                    </h2>
                    <span className="text-[13px] leading-4.5 text-foreground/70">
                        {review.serviceName && `${review.serviceName} · `}
                        {formatPastDate(review.date)}
                    </span>
                </span>
                {review.fromSession && (
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-xs font-semibold">
                        <Check
                            aria-hidden="true"
                            className="size-3.25"
                            strokeWidth={2.5}
                        />
                        Seduta svolta
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2.5">
                <StarRating value={review.rating} size="lg" />
                <p className="text-lg leading-7 font-medium tracking-[-0.01em]">
                    “{review.text}”
                </p>
            </div>

            {review.reply ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-sidebar px-4.5 py-4 text-sidebar-foreground">
                    <span className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="flex size-6.5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground"
                        >
                            {getInitials(auth.user?.name ?? '')}
                        </span>
                        <span className="text-[13px] leading-4.5 font-semibold">
                            La tua risposta
                        </span>
                    </span>
                    <p className="text-sm leading-5.25 whitespace-pre-wrap text-sidebar-foreground/90">
                        {review.reply}
                    </p>
                </div>
            ) : formOpen ? (
                <div className="flex flex-col gap-2.5 rounded-2xl bg-secondary p-4">
                    <Label
                        htmlFor={replyId}
                        className="text-[13px] leading-4.5"
                    >
                        Rispondi {replyTo}
                    </Label>
                    <Textarea
                        id={replyId}
                        rows={3}
                        maxLength={REPLY_MAX}
                        value={draft}
                        autoFocus
                        placeholder="Ringrazia e aggiungi un dettaglio sulla seduta…"
                        onChange={(event) => {
                            setDraft(event.target.value);
                            setError(undefined);
                        }}
                        aria-invalid={error ? true : undefined}
                        className="rounded-xl bg-card px-3.5 py-3 text-sm leading-5.25"
                    />
                    <InputError message={error} />
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {draft.length} / {REPLY_MAX}
                        </span>
                        <span className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-[10px] px-3.5 font-semibold"
                                disabled={sending}
                                onClick={() => {
                                    setFormOpen(false);
                                    setError(undefined);
                                }}
                            >
                                Annulla
                            </Button>
                            <Button
                                type="button"
                                className="h-10 rounded-[10px] px-4 font-semibold"
                                disabled={draft.trim() === '' || sending}
                                onClick={publish}
                            >
                                Pubblica risposta
                            </Button>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end border-t pt-4">
                    <Button
                        type="button"
                        className="h-11 rounded-xl px-4.5 font-semibold"
                        onClick={() => setFormOpen(true)}
                    >
                        <MessageCircle aria-hidden="true" />
                        Rispondi
                    </Button>
                </div>
            )}
        </article>
    );
}
