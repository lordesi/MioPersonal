import BookingStatusBadge from '@/components/booking/booking-status-badge';
import ResponsiveText from '@/components/shared/responsive-text';
import UserAvatar from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    formatHours,
    formatHoursShort,
    formatSlot,
    hoursUntil,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerBookingRequest } from '@/types';

/** Requests expiring sooner than this get the filled, more urgent badge. */
const URGENT_HOURS = 6;

export type RequestAnswer = 'pending' | 'confirmed' | 'declined';

type BookingRequestCardProps = {
    request: TrainerBookingRequest;
    answer: RequestAnswer;
    onAnswer: (answer: RequestAnswer) => void;
};

/** A booking waiting for the trainer: confirm, decline or propose a new time. */
export default function BookingRequestCard({
    request,
    answer,
    onAnswer,
}: BookingRequestCardProps) {
    const hoursLeft = hoursUntil(request.expiresAt);

    const undo = (
        <button
            type="button"
            className="text-foreground underline"
            onClick={() => onAnswer('pending')}
        >
            Annulla
        </button>
    );

    return (
        <article
            aria-label={`Prenotazione di ${request.clientName}`}
            className="flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 md:gap-3 md:p-4"
        >
            <div className="flex items-center gap-2.5 md:gap-3">
                <UserAvatar
                    name={request.clientName}
                    size="md"
                    className="md:size-10"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] leading-5 font-semibold md:text-base">
                        {request.clientName}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums md:text-[13px] md:leading-4.5">
                        {formatSlot(request.start, request.hours)} ·{' '}
                        {request.serviceName} · {formatHours(request.hours)}
                    </span>
                </div>
                {answer === 'pending' ? (
                    <Badge
                        className={cn(
                            'h-5.5 rounded-full px-2 text-xs font-semibold tabular-nums',
                            hoursLeft < URGENT_HOURS
                                ? 'border-transparent bg-primary text-primary-foreground'
                                : 'border-dashed border-input bg-transparent text-foreground',
                        )}
                    >
                        Scade tra {formatHoursShort(hoursLeft)}
                    </Badge>
                ) : (
                    <BookingStatusBadge status={answer} />
                )}
            </div>

            <span className="text-[13px] leading-4.5 text-muted-foreground">
                {request.placeLabel}
            </span>

            {answer === 'pending' && (
                <>
                    {request.note && (
                        <p className="rounded-lg bg-muted px-3 py-2.5 text-sm">
                            «{request.note}»
                        </p>
                    )}
                    {/* TODO: send the answer to the server. */}
                    <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-wrap md:gap-2">
                        <Button
                            type="button"
                            className="h-11 md:order-1 md:h-9"
                            onClick={() => onAnswer('confirmed')}
                        >
                            Conferma
                        </Button>
                        {/* TODO: open the "propose another time" flow. */}
                        <Button
                            type="button"
                            variant="outline"
                            className="order-3 col-span-2 h-11 md:order-2 md:col-span-1 md:h-9 md:px-3.5"
                        >
                            Proponi un altro orario
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="-order-1 h-11 md:order-3 md:h-9 md:border-transparent md:px-3 md:shadow-none"
                            onClick={() => onAnswer('declined')}
                        >
                            Rifiuta
                        </Button>
                    </div>
                </>
            )}

            {answer === 'confirmed' && (
                <span role="status" className="text-[13px] leading-4.5">
                    <ResponsiveText
                        mobile="Il cliente ha ricevuto i tuoi contatti."
                        desktop="Confermata: il cliente ha ricevuto l'email con i tuoi contatti. È già nel tuo calendario."
                    />{' '}
                    {undo}
                </span>
            )}

            {answer === 'declined' && (
                <span
                    role="status"
                    className="text-[13px] leading-4.5 text-muted-foreground"
                >
                    <ResponsiveText
                        mobile="Lo slot torna libero."
                        desktop="Rifiutata: lo slot torna libero sul profilo."
                    />{' '}
                    {undo}
                </span>
            )}
        </article>
    );
}
