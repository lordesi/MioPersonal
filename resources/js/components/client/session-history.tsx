import { Link, router } from '@inertiajs/react';
import { History, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ReviewForm from '@/components/client/review-form';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { formatDayShort, formatTimeSpan } from '@/lib/format';
import { review as reviewRoute } from '@/routes/client/bookings';
import type { ClientPastSession } from '@/types';

/**
 * "Sedute svolte": the last sessions done, each with its review or
 * "Lascia una recensione". Empty, it says the history starts here.
 */
export default function SessionHistory({
    sessions,
}: {
    sessions: ClientPastSession[];
}) {
    if (sessions.length === 0) {
        return (
            <section
                aria-labelledby="storico-vuoto"
                className="flex flex-wrap items-center gap-4 rounded-[20px] border bg-card p-5 md:p-6"
            >
                <span className="flex size-12 flex-none items-center justify-center rounded-[14px] bg-secondary">
                    <History aria-hidden="true" className="size-5.5" />
                </span>
                <span className="flex min-w-55 flex-1 flex-col gap-0.5">
                    <h2 id="storico-vuoto" className="text-base font-semibold">
                        Nessuna seduta svolta, per ora
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        Dopo il primo allenamento la trovi qui e puoi lasciare
                        una recensione al trainer.
                    </span>
                </span>
            </section>
        );
    }

    return (
        <Panel title="Sedute svolte" className="gap-3.5">
            <ul className="flex flex-col divide-y">
                {sessions.map((session) => (
                    <PastSessionItem key={session.id} session={session} />
                ))}
            </ul>
        </Panel>
    );
}

/** The review already left: stars and text. */
function YourReview({ rating, text }: { rating: number; text: string }) {
    return (
        <p className="flex flex-col gap-1 rounded-xl bg-secondary px-3.5 py-3 text-sm">
            <span
                className="flex items-center gap-0.5"
                role="img"
                aria-label={`Hai lasciato ${rating} ${rating === 1 ? 'stella' : 'stelle'}`}
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        aria-hidden="true"
                        className={
                            star <= rating
                                ? 'size-3.5 fill-current'
                                : 'size-3.5 text-muted-foreground'
                        }
                    />
                ))}
            </span>
            <span className="text-muted-foreground">«{text}»</span>
        </p>
    );
}

function PastSessionItem({ session }: { session: ClientPastSession }) {
    const [writing, setWriting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>();

    const publish = (review: { rating: number; text: string }) =>
        router.post(reviewRoute.url(session.id), review, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setWriting(false);
                setError(undefined);
                toast.success('Recensione pubblicata. Grazie!');
            },
            onError: (errors) =>
                setError(
                    errors.review ??
                        errors.text ??
                        errors.rating ??
                        'Riprova tra poco.',
                ),
        });

    return (
        <li className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-3">
                <UserAvatar
                    name={session.trainerName}
                    size="lg"
                    className="size-11 text-[13px] [&_[data-slot=avatar-fallback]]:bg-secondary"
                />
                <span className="flex min-w-45 flex-1 flex-col">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        {session.discipline} con{' '}
                        <Link
                            href={session.trainerHref}
                            className="hover:underline"
                        >
                            {session.trainerName}
                        </Link>
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                        {formatDayShort(session.start)} ·{' '}
                        {formatTimeSpan(session.start, session.hours)} ·{' '}
                        {session.serviceName}
                    </span>
                </span>
                {session.canReview && !writing && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[10px] px-3.5"
                        onClick={() => setWriting(true)}
                    >
                        Lascia una recensione
                    </Button>
                )}
                <Button
                    asChild
                    variant="ghost"
                    className="h-10 rounded-[10px] px-3 underline"
                >
                    <Link href={session.trainerHref}>Prenota di nuovo</Link>
                </Button>
            </div>

            {session.review && <YourReview {...session.review} />}

            {writing && (
                <div className="rounded-xl border p-4">
                    <ReviewForm
                        processing={processing}
                        error={error}
                        onCancel={() => {
                            setWriting(false);
                            setError(undefined);
                        }}
                        onPublish={publish}
                    />
                </div>
            )}
        </li>
    );
}
