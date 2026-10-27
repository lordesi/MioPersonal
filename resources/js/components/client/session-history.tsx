import { Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, History, RotateCcw, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ReviewForm from '@/components/client/review-form';
import { Button } from '@/components/ui/button';
import { dateBlockParts, formatDayShort, formatTimeSpan } from '@/lib/format';
import { review as reviewRoute } from '@/routes/client/bookings';
import type { ClientPastSession } from '@/types';

/** Sessions shown before "Vedi tutte". */
const VISIBLE = 3;

/**
 * "Sedute svolte": the last sessions done, each with "Lascia una
 * recensione" (or the review already left) and "Prenota di nuovo". Only the
 * last three at first: "Vedi tutte" opens the others. Empty, it says the
 * history starts here.
 */
export default function SessionHistory({
    sessions,
}: {
    sessions: ClientPastSession[];
}) {
    const [showAll, setShowAll] = useState(false);

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

    const shown = showAll ? sessions : sessions.slice(0, VISIBLE);

    return (
        <section
            aria-labelledby="sedute-svolte"
            className="flex flex-col gap-2.5 rounded-3xl border bg-card p-5 md:p-6"
        >
            <h2
                id="sedute-svolte"
                className="text-xl font-bold tracking-[-0.02em]"
            >
                Sedute svolte
            </h2>

            <ul className="flex flex-col">
                {shown.map((session) => (
                    <PastSessionItem key={session.id} session={session} />
                ))}
            </ul>

            {sessions.length > VISIBLE && (
                <Button
                    type="button"
                    variant="ghost"
                    className="-mx-5 -mb-5 h-11 rounded-none rounded-b-3xl border-t text-sm font-semibold md:-mx-6 md:-mb-6"
                    aria-expanded={showAll}
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll
                        ? 'Mostra meno'
                        : `Vedi tutte (${sessions.length})`}
                    {showAll ? (
                        <ChevronUp aria-hidden="true" />
                    ) : (
                        <ChevronDown aria-hidden="true" />
                    )}
                </Button>
            )}
        </section>
    );
}

function PastSessionItem({ session }: { session: ClientPastSession }) {
    const [writing, setWriting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>();
    const date = dateBlockParts(session.start);

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
        <li className="flex flex-col gap-3 border-t border-border/70 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3.5">
                <span className="flex h-14 w-13 flex-none flex-col items-center justify-center rounded-[14px] bg-primary text-primary-foreground tabular-nums">
                    <span className="text-[10px] leading-3 font-bold tracking-[0.08em] text-primary-foreground/65 uppercase">
                        {date.weekday}
                    </span>
                    <span className="text-xl leading-6 font-bold">
                        {date.day}
                    </span>
                </span>
                <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.75">
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
                <span className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
                    {session.canReview && !writing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9.5 rounded-[10px] px-3.5 text-[13px] font-semibold"
                            onClick={() => setWriting(true)}
                        >
                            <Star aria-hidden="true" className="size-3.5" />
                            Lascia una recensione
                        </Button>
                    )}
                    {session.review && (
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3 text-xs font-semibold tabular-nums">
                            <Star
                                aria-hidden="true"
                                className="size-3 fill-current"
                            />
                            Recensione lasciata · {session.review.rating}★
                        </span>
                    )}
                    <Button
                        asChild
                        className="h-9.5 rounded-[10px] px-3.5 text-[13px] font-semibold"
                    >
                        <Link href={session.trainerHref}>
                            <RotateCcw
                                aria-hidden="true"
                                className="size-3.5"
                                strokeWidth={2.2}
                            />
                            Prenota di nuovo
                        </Link>
                    </Button>
                </span>
            </div>

            {writing && (
                <div className="md:ml-16.5">
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
