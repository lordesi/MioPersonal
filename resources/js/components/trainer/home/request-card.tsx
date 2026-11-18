import { Check, ChevronDown, Clock, Repeat, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import ClientAbout from '@/components/trainer/area/client-about';
import { Initials } from '@/components/trainer/ui/bits';
import {
    brandButtonClassName,
    outlineButtonClassName,
    roundOutlineClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import {
    formatAgo,
    formatDayTimeRelative,
    formatHoursShort,
    formatPrice,
    formatTimeSpan,
    hoursUntil,
} from '@/lib/format';
import { romeParts } from '@/lib/calendar';
import { formatDayMonthShort, formatWeekdayShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AttendanceRate, TrainerBookingRequest } from '@/types';

type RequestCardProps = {
    request: TrainerBookingRequest;
    /** While an answer is being saved: the buttons wait. */
    busy: boolean;
    /** `weekly`: "Accetta ogni settimana" of a "Ripeti ogni settimana" request. */
    onConfirm: (weekly: boolean) => void;
    onDecline: () => void;
    /** The phone carousel: fixed width; desktop: fills the grid cell. */
    className?: string;
};

/**
 * A request of "Da confermare": who, when, the price and the answer. "Dettagli"
 * opens what helps to decide (the note, how often the client shows up, "Su di
 * te") and the time left. "Rifiuta" asks first. When the client asks to
 * repeat it every week: "Ogni settimana" or "Solo questa".
 */
export default function RequestCard({
    request,
    busy,
    onConfirm,
    onDecline,
    className,
}: RequestCardProps) {
    const nameId = useId();
    const detailsId = useId();
    const askId = useId();
    const [open, setOpen] = useState(false);
    const [askDecline, setAskDecline] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const declineRef = useRef<HTMLButtonElement>(null);
    const asked = useRef(false);
    const firstName = request.clientName.split(' ')[0];
    const day = romeParts(request.start).date;
    const hasDetails =
        request.note !== null ||
        request.attendance !== null ||
        request.about !== null ||
        request.guestNames.length > 0;

    useEffect(() => {
        // Keyboard users land on the question, then back on "Rifiuta".
        if (askDecline) {
            asked.current = true;
            cancelRef.current?.focus();
        } else if (asked.current) {
            declineRef.current?.focus();
        }
    }, [askDecline]);

    return (
        <article
            aria-labelledby={nameId}
            className={cn(
                'flex flex-col gap-3.5 rounded-[26px] bg-[#121212] p-4 shadow-[inset_0_0_0_1px_#2c2c2c]',
                className,
            )}
        >
            <div className="flex items-center gap-2.5">
                <Initials name={request.clientName} size={36} />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span
                        id={nameId}
                        className="truncate text-[15px] font-semibold"
                    >
                        {request.clientName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatAgo(request.requestedAt)}
                    </span>
                </span>
                <span className="text-[15px] font-bold tabular-nums">
                    {formatPrice(request.priceCents)}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-xl leading-6.5 font-semibold tabular-nums">
                    {formatWeekdayShort(day)} {formatDayMonthShort(day)},{' '}
                    {formatTimeSpan(request.start, request.hours)}
                </span>
                <span className="text-[13px] text-muted-foreground">
                    {request.serviceName} · {request.placeLabel}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2.5 text-xs font-semibold tabular-nums">
                    <Clock
                        aria-hidden="true"
                        className="size-3"
                        strokeWidth={2.5}
                    />
                    Scade tra {formatHoursShort(hoursUntil(request.expiresAt))}
                </span>
                {request.repeatWeekly && (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-soft px-2.5 text-xs font-semibold text-brand">
                        <Repeat aria-hidden="true" className="size-3" />
                        {request.repeatWeekly}
                    </span>
                )}
                {hasDetails && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={detailsId}
                        onClick={() => setOpen(!open)}
                        className="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-1 text-[13px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Dettagli
                        <ChevronDown
                            aria-hidden="true"
                            className={cn(
                                'size-4 transition-transform',
                                open && 'rotate-180',
                            )}
                        />
                    </button>
                )}
            </div>

            {open && (
                <div id={detailsId} className="flex flex-col gap-3">
                    {request.guestNames.length > 0 && (
                        <span className="text-[13px] text-muted-foreground">
                            Con {request.guestNames.join(', ')}
                        </span>
                    )}
                    {request.note && (
                        <p className="rounded-2xl bg-card px-3.5 py-3 text-[15px] leading-5">
                            «{request.note}»
                        </p>
                    )}
                    {request.attendance && (
                        <div className="flex flex-wrap gap-2">
                            <Attendance
                                label="Presenze"
                                rate={request.attendance.platform}
                            />
                            {request.attendance.withYou && (
                                <Attendance
                                    label="Con te"
                                    rate={request.attendance.withYou}
                                />
                            )}
                        </div>
                    )}
                    {request.about && (
                        <ClientAbout
                            about={request.about}
                            className="border-t border-border pt-3"
                        />
                    )}
                </div>
            )}

            {askDecline ? (
                <div
                    role="alertdialog"
                    aria-labelledby={askId}
                    className="flex flex-col gap-3 rounded-2xl bg-card p-3.5"
                >
                    <span id={askId} className="text-[15px] font-semibold">
                        Rifiutare la richiesta di {firstName}? Lo slot di{' '}
                        {formatDayTimeRelative(request.start)} torna libero.
                    </span>
                    <span className="flex gap-2">
                        <button
                            ref={cancelRef}
                            type="button"
                            disabled={busy}
                            onClick={() => setAskDecline(false)}
                            className={cn(softButtonClassName, 'h-11 flex-1')}
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onDecline}
                            className={cn(
                                outlineButtonClassName,
                                'flex-1 border-destructive text-destructive',
                            )}
                        >
                            Sì, rifiuta
                        </button>
                    </span>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    <button
                        ref={declineRef}
                        type="button"
                        disabled={busy}
                        onClick={() => setAskDecline(true)}
                        aria-label={`Rifiuta la richiesta di ${request.clientName}`}
                        title="Rifiuta"
                        className={roundOutlineClassName}
                    >
                        <X aria-hidden="true" className="size-4.5" />
                    </button>
                    {request.repeatWeekly && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onConfirm(false)}
                            className={cn(outlineButtonClassName, 'flex-1')}
                        >
                            Solo questa
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onConfirm(request.repeatWeekly !== null)}
                        aria-label={`Accetta la richiesta di ${request.clientName}`}
                        className={cn(
                            brandButtonClassName,
                            'flex-1 text-[17px]',
                        )}
                    >
                        {request.repeatWeekly ? (
                            <Repeat aria-hidden="true" className="size-4.5" />
                        ) : (
                            <Check
                                aria-hidden="true"
                                className="size-4.5"
                                strokeWidth={2.5}
                            />
                        )}
                        {request.repeatWeekly ? 'Ogni settimana' : 'Accetta'}
                    </button>
                </div>
            )}
        </article>
    );
}

/** "Presenze 100% su 3 sedute", "Con te 90% su 10 sedute". */
function Attendance({
    label,
    rate,
}: {
    label: string;
    rate: AttendanceRate | null;
}) {
    return (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-[13px] font-medium tabular-nums">
            <Check aria-hidden="true" className="size-3.25" strokeWidth={2.5} />
            {rate === null
                ? `${label}: nessuna seduta ancora`
                : `${label} ${rate.rate}% su ${rate.sessions === 1 ? '1 seduta' : `${rate.sessions} sedute`}`}
        </span>
    );
}
