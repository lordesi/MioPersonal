import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ReviewForm from '@/components/client/review-form';
import { formatDayShort } from '@/lib/format';
import { review as reviewRoute } from '@/routes/client/bookings';
import type { ClientPastSession } from '@/types';

/** Asked for this many days after the session, then only "Sedute svolte" has it. */
const PROMPT_DAYS = 14;

const storageKey = (id: number) => `review-prompt-dismissed-${id}`;

function dismissed(id: number): boolean {
    try {
        return window.localStorage.getItem(storageKey(id)) !== null;
    } catch {
        return false;
    }
}

/**
 * The latest session done in the last 14 days and not reviewed yet: the one
 * to ask about. Null when there is none.
 */
export function sessionToReview(
    past: ClientPastSession[],
    now: Date,
): ClientPastSession | null {
    const since = now.getTime() - PROMPT_DAYS * 24 * 60 * 60 * 1000;

    return (
        past.find(
            (session) =>
                session.canReview &&
                new Date(session.start).getTime() >= since &&
                !dismissed(session.id),
        ) ?? null
    );
}

/**
 * "Com'è andata con Marco?": at the top of "Le mie prenotazioni" after a
 * session, the same form as "Lascia una recensione". "Non ora" hides it
 * for that session, in this browser.
 */
export default function ReviewPrompt({
    session,
}: {
    session: ClientPastSession;
}) {
    const [hidden, setHidden] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>();

    if (hidden) {
        return null;
    }

    const hide = () => {
        try {
            window.localStorage.setItem(storageKey(session.id), '1');
        } catch {
            // Private window: it comes back next time, that's fine.
        }

        setHidden(true);
    };

    const publish = (review: { rating: number; text: string }) =>
        router.post(reviewRoute.url(session.id), review, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setHidden(true);
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
        <section
            aria-labelledby={`review-prompt-${session.id}`}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-4 md:p-5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2
                        id={`review-prompt-${session.id}`}
                        className="text-lg font-semibold tracking-[-0.01em]"
                    >
                        Com’è andata con {session.trainerFirstName}?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {session.serviceName} · {formatDayShort(session.start)}.
                        La tua recensione aiuta altri a scegliere e{' '}
                        {session.trainerFirstName} a farsi conoscere.
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Non ora"
                    onClick={hide}
                    className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-secondary"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            </div>
            <ReviewForm
                processing={processing}
                error={error}
                cancelLabel="Non ora"
                onCancel={hide}
                onPublish={publish}
            />
        </section>
    );
}
