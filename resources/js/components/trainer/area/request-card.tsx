import { Check, Clock } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
    dateBlockParts,
    formatDayTimeRelative,
    formatHoursShort,
    formatTimeSpan,
    hoursUntil,
} from '@/lib/format';
import type { AttendanceRate, TrainerBookingRequest } from '@/types';

type RequestCardProps = {
    request: TrainerBookingRequest;
    /** While an answer is being saved: the buttons wait. */
    busy: boolean;
    onConfirm: () => void;
    onDecline: () => void;
};

/**
 * A request of "Richieste" waiting for the trainer (docs/design): when, who,
 * how often the client shows up and how long is left to answer.
 * "Conferma" saves at once; "Rifiuta" asks first, in the black strip.
 */
export default function RequestCard({
    request,
    busy,
    onConfirm,
    onDecline,
}: RequestCardProps) {
    const nameId = useId();
    const askId = useId();
    const [askDecline, setAskDecline] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const declineRef = useRef<HTMLButtonElement>(null);
    const opened = useRef(false);

    const date = dateBlockParts(request.start);
    const firstName = request.clientName.split(' ')[0];

    useEffect(() => {
        // Keyboard users land on the question, then back on "Rifiuta".
        if (askDecline) {
            opened.current = true;
            cancelRef.current?.focus();
        } else if (opened.current) {
            declineRef.current?.focus();
        }
    }, [askDecline]);

    return (
        <article
            aria-labelledby={nameId}
            className="overflow-hidden rounded-3xl border bg-card"
        >
            <div className="flex flex-wrap gap-5 p-5 md:p-5.5">
                <div className="flex h-21 w-19 flex-none flex-col items-center justify-center rounded-[18px] bg-sidebar text-sidebar-foreground">
                    <span className="text-[11px] leading-3.5 font-bold tracking-[0.08em] text-sidebar-muted-foreground uppercase">
                        {date.weekday}
                    </span>
                    <span className="text-[30px] leading-8.5 font-bold tracking-[-0.03em] tabular-nums">
                        {date.day}
                    </span>
                    <span className="text-[11px] leading-3.5 font-bold tracking-[0.08em] text-sidebar-muted-foreground uppercase">
                        {date.month}
                    </span>
                </div>

                <div className="flex min-w-60 flex-1 flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="flex items-center gap-2.5">
                            <UserAvatar
                                name={request.clientName}
                                size="md"
                                className="[&_[data-slot=avatar-fallback]]:bg-secondary [&_[data-slot=avatar-fallback]]:font-bold"
                            />
                            {/* Not a link: the client is in "Clienti" only after a confirmation. */}
                            <h2
                                id={nameId}
                                className="text-lg leading-6.5 font-bold tracking-[-0.01em]"
                            >
                                {request.clientName}
                            </h2>
                        </span>
                        <ExpiryChip expiresAt={request.expiresAt} />
                    </div>

                    <span className="text-[22px] leading-7 font-bold tracking-[-0.02em] tabular-nums">
                        {formatTimeSpan(request.start, request.hours)}
                    </span>
                    <span className="text-sm text-foreground/70">
                        {request.serviceName}
                    </span>
                    {request.note && (
                        <p className="rounded-lg bg-muted px-3 py-2.5 text-sm">
                            «{request.note}»
                        </p>
                    )}

                    {request.attendance && (
                        <div className="flex flex-wrap gap-2">
                            <AttendanceChip
                                label="Presenze"
                                rate={request.attendance.platform}
                            />
                            {request.attendance.withYou && (
                                <AttendanceChip
                                    label="Con te"
                                    rate={request.attendance.withYou}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <TimeLeftBar
                requestedAt={request.requestedAt}
                expiresAt={request.expiresAt}
            />

            {askDecline ? (
                <div
                    role="alertdialog"
                    aria-labelledby={askId}
                    className="flex flex-wrap items-center justify-between gap-3 bg-sidebar px-5 py-4 text-sidebar-foreground md:px-5.5"
                >
                    <span className="flex flex-col gap-0.5">
                        <span
                            id={askId}
                            className="text-[15px] leading-5.5 font-semibold"
                        >
                            Rifiutare la richiesta di {firstName}?
                        </span>
                        <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                            Lo slot di {formatDayTimeRelative(request.start)}{' '}
                            torna libero per gli altri clienti.
                        </span>
                    </span>
                    <span className="flex gap-2">
                        <Button
                            ref={cancelRef}
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setAskDecline(false)}
                            className="h-11 rounded-[10px] border-sidebar-foreground/25 bg-transparent px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            Annulla
                        </Button>
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={onDecline}
                            className="h-11 rounded-[10px] bg-sidebar-primary px-4 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        >
                            Sì, rifiuta
                        </Button>
                    </span>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-end gap-2 bg-muted/50 px-5 py-4 md:px-5.5">
                    <Button
                        ref={declineRef}
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setAskDecline(true)}
                        className="h-11 flex-1 rounded-xl px-4.5 font-semibold sm:flex-none"
                    >
                        Rifiuta
                    </Button>
                    <Button
                        type="button"
                        disabled={busy}
                        onClick={onConfirm}
                        className="h-11 flex-1 rounded-xl px-5 font-semibold sm:flex-none"
                    >
                        <Check aria-hidden="true" strokeWidth={2.5} />
                        Conferma
                    </Button>
                </div>
            )}
        </article>
    );
}

/** The black "Scade tra 12 h". */
function ExpiryChip({ expiresAt }: { expiresAt: string }) {
    return (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-sidebar px-2.5 text-xs font-semibold text-sidebar-foreground tabular-nums">
            <Clock aria-hidden="true" className="size-3.25" strokeWidth={2.5} />
            Scade tra {formatHoursShort(hoursUntil(expiresAt))}
        </span>
    );
}

/** "Presenze 100% su 3 sedute", "Con te 90% su 10 sedute". */
function AttendanceChip({
    label,
    rate,
}: {
    label: string;
    rate: AttendanceRate | null;
}) {
    return (
        <span className="inline-flex h-7.5 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-[13px] leading-4.5 font-medium tabular-nums">
            <Check aria-hidden="true" className="size-3.25" strokeWidth={2.5} />
            {rate === null
                ? `${label}: nessuna seduta ancora`
                : `${label} ${rate.rate}% su ${rate.sessions === 1 ? '1 seduta' : `${rate.sessions} sedute`}`}
        </span>
    );
}

/** The thin bar under the card: the time left to answer, out of the whole wait. */
function TimeLeftBar({
    requestedAt,
    expiresAt,
}: {
    requestedAt: string;
    expiresAt: string;
}) {
    const end = new Date(expiresAt).getTime();
    const total = end - new Date(requestedAt).getTime();
    const left = total > 0 ? (end - Date.now()) / total : 0;
    const percent = Math.round(Math.min(1, Math.max(0, left)) * 100);

    return (
        <div aria-hidden="true" className="h-1 bg-secondary">
            <div
                className="h-full bg-foreground"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}
