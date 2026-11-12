import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import Panel from '@/components/trainer/area/panel';
import { formatDayRelative, formatTimeSpan } from '@/lib/format';
import { bookings } from '@/routes/client';
import type { ClientUpcomingBooking } from '@/types';

type NextSessionSummaryProps = {
    next: ClientUpcomingBooking | null;
    /** "Nuovo orario proposto" and "Annullate dal trainer". */
    toAnswer: number;
    now: Date;
};

/**
 * "Prossima seduta" in short, in "Panoramica": the details, cancelling and
 * the rest are in "Le mie prenotazioni".
 */
export default function NextSessionSummary({
    next,
    toAnswer,
    now,
}: NextSessionSummaryProps) {
    return (
        <Panel
            title="Prossima seduta"
            action={
                <Link
                    href={bookings()}
                    className="inline-flex items-center gap-1 text-[13px] leading-4.5 font-semibold hover:underline"
                >
                    Le mie prenotazioni
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
            }
            className="gap-3"
        >
            {toAnswer > 0 && (
                <Link
                    href={bookings()}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    {toAnswer === 1
                        ? '1 prenotazione aspetta una tua risposta'
                        : `${toAnswer} prenotazioni aspettano una tua risposta`}
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            )}

            {next ? (
                <div className="flex items-center gap-3.5">
                    <span className="flex size-11 flex-none items-center justify-center rounded-full bg-secondary">
                        <CalendarClock aria-hidden="true" className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className="text-[15px] leading-5.5 font-bold tabular-nums">
                            {formatDayRelative(next.start, now)} ·{' '}
                            {formatTimeSpan(next.start, next.hours)}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                            {next.discipline} con {next.trainerName} ·{' '}
                            {next.placeLabel}
                        </span>
                    </span>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Nessuna seduta in programma.
                </p>
            )}
        </Panel>
    );
}
