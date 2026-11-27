import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import { areaButtonClassName } from '@/components/mp/area-bits';
import ReportDialog from '@/components/shared/report-dialog';
import { Initials } from '@/components/trainer/ui/bits';
import { formatPastDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { reply as replyRoute } from '@/routes/trainer/reviews';
import type { TrainerAreaReview } from '@/types';

/** Same limit as TrainerReviewsController::REPLY_MAX. */
const REPLY_MAX = 1000;

/**
 * A client's review in "Recensioni" (design "Trainer · Recensioni · nuovo"):
 * who, when and the stars, the text, then the trainer's public reply or
 * "Rispondi". One reply only: it cannot be changed. "Segnala" sends the
 * review to the team (only its trainer can report it).
 */
export default function ReviewReplyCard({
    review,
}: {
    review: TrainerAreaReview;
}) {
    const nameId = useId();
    const replyId = useId();
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
            className="flex flex-col gap-2.5 border-b border-separator py-4.5"
        >
            <div className="flex items-center gap-3">
                <Initials name={review.authorName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h2
                        id={nameId}
                        className="truncate text-base leading-5.5 font-semibold"
                    >
                        {review.authorName}
                    </h2>
                    <span className="truncate text-[13px] leading-4.5 text-muted-foreground">
                        {review.serviceName && `${review.serviceName} · `}
                        {formatPastDate(review.date)}
                        {review.fromSession && ' · Seduta svolta'}
                    </span>
                </span>
                <span
                    role="img"
                    aria-label={`${review.rating} stelle su 5`}
                    className="shrink-0 tracking-[0.05em] text-brand"
                >
                    {'★'.repeat(review.rating)}
                    <span className="text-[#2e3135]">
                        {'★'.repeat(5 - review.rating)}
                    </span>
                </span>
            </div>

            <p className="text-base leading-6">{review.text}</p>

            {review.reply ? (
                <div className="flex flex-col gap-1 rounded-2xl bg-card px-3.5 py-3">
                    <span className="text-xs font-semibold tracking-[0.02em] text-muted-foreground">
                        LA TUA RISPOSTA
                    </span>
                    <p className="text-[15px] leading-5 whitespace-pre-wrap">
                        {review.reply}
                    </p>
                </div>
            ) : formOpen ? (
                <div className="flex flex-col gap-2">
                    <label htmlFor={replyId} className="sr-only">
                        Rispondi {replyTo}
                    </label>
                    <textarea
                        id={replyId}
                        rows={3}
                        maxLength={REPLY_MAX}
                        value={draft}
                        autoFocus
                        placeholder={`Rispondi ${replyTo} con gentilezza`}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            setError(undefined);
                        }}
                        aria-invalid={error ? true : undefined}
                        className="min-h-24 w-full resize-none rounded-[14px] border border-input bg-card px-4 py-3 text-[17px] leading-5.5 outline-none placeholder:text-muted-foreground focus-visible:border-ring md:text-base"
                    />
                    <InputError message={error} />
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {draft.length} / {REPLY_MAX}
                        </span>
                        <span className="flex gap-2">
                            <button
                                type="button"
                                disabled={sending}
                                onClick={() => {
                                    setFormOpen(false);
                                    setError(undefined);
                                }}
                                className={areaButtonClassName('ghost', 'sm')}
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                disabled={draft.trim() === '' || sending}
                                onClick={publish}
                                className={cn(
                                    areaButtonClassName('primary', 'sm'),
                                    'min-h-10 px-4.5',
                                )}
                            >
                                Pubblica risposta
                            </button>
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    <button
                        type="button"
                        onClick={() => setFormOpen(true)}
                        className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold shadow-[inset_0_0_0_1px_var(--input)] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Rispondi
                    </button>
                </div>
            )}
            <ReportDialog
                type="review"
                target={review.id}
                label="Segnala"
                className="self-end"
                contentClassName="theme-dark"
            />
        </article>
    );
}
