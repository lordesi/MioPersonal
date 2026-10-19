import { Link } from '@inertiajs/react';
import { CalendarPlus, Clock, MapPin } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import {
    dateBlockParts,
    formatDayRelative,
    formatDayTimeRelative,
    formatTimeSpan,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClientUpcomingBooking } from '@/types';

type NextSessionHeroProps = {
    booking: ClientUpcomingBooking;
    now: Date;
};

/**
 * "La tua prossima seduta": the black card at the top of the dashboard.
 * "Annulla seduta" asks right in the card, as in the design; once cancelled
 * it can't be restored (the slot is free for the others again).
 */
export default function NextSessionHero({
    booking,
    now,
}: NextSessionHeroProps) {
    const titleId = useId();
    const confirmTitleId = useId();
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const [confirming, setConfirming] = useState(false);
    const keepButton = useRef<HTMLButtonElement>(null);
    const date = dateBlockParts(booking.start);
    const freeCancellation = new Date(booking.freeCancellationUntil) > now;
    const day = formatDayRelative(booking.start, now);

    // The question replaces the buttons: move the focus there.
    useEffect(() => {
        if (confirming) {
            keepButton.current?.focus();
        }
    }, [confirming]);

    return (
        <section
            aria-labelledby={titleId}
            className="overflow-hidden rounded-3xl bg-sidebar text-sidebar-foreground"
        >
            <div className="flex flex-col gap-5.5 p-5 md:p-7">
                <div className="flex items-center justify-between gap-3">
                    <h2
                        id={titleId}
                        className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                    >
                        LA TUA PROSSIMA SEDUTA
                    </h2>
                    <span
                        className={cn(
                            'inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-semibold',
                            cancelled
                                ? 'border border-sidebar-foreground/30 text-sidebar-foreground/80'
                                : 'bg-sidebar-primary text-sidebar-primary-foreground',
                        )}
                    >
                        {cancelled ? 'Annullata' : 'Confermata'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-5.5">
                    <span className="flex h-24 w-22 flex-none flex-col items-center justify-center rounded-[18px] bg-sidebar-primary text-sidebar-primary-foreground tabular-nums">
                        <span className="text-xs font-bold tracking-[0.06em] uppercase">
                            {date.weekday}
                        </span>
                        <span className="text-[38px] leading-10.5 font-bold tracking-[-0.03em]">
                            {date.day}
                        </span>
                        <span className="text-xs font-bold tracking-[0.06em] uppercase">
                            {date.month}
                        </span>
                    </span>
                    <span className="flex min-w-60 flex-1 flex-col gap-1.5">
                        <span className="text-[26px] leading-8 font-bold tracking-[-0.03em] tabular-nums md:text-[32px] md:leading-9.5">
                            {day},{' '}
                            {formatTimeSpan(booking.start, booking.hours)}
                        </span>
                        <span className="text-[17px] leading-6 font-medium text-sidebar-foreground/90">
                            {booking.discipline} · {booking.serviceLabel}
                        </span>
                    </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <div className="flex flex-[1_1_220px] items-center gap-3 rounded-[14px] bg-sidebar-accent px-3.5 py-3">
                        <UserAvatar
                            name={booking.trainerName}
                            size="lg"
                            className="size-10 text-[13px] [&_[data-slot=avatar-fallback]]:bg-sidebar-border [&_[data-slot=avatar-fallback]]:text-sidebar-foreground"
                        />
                        <span className="flex min-w-0 flex-col">
                            <span className="text-xs text-sidebar-muted-foreground">
                                Trainer
                            </span>
                            <Link
                                href={booking.trainerHref}
                                className="text-[15px] leading-5.5 font-semibold hover:underline"
                            >
                                {booking.trainerName}
                            </Link>
                        </span>
                    </div>
                    <div className="flex flex-[1_1_220px] items-center gap-3 rounded-[14px] bg-sidebar-accent px-3.5 py-3">
                        <span className="flex size-10 flex-none items-center justify-center rounded-full bg-sidebar-border">
                            <MapPin aria-hidden="true" className="size-4.5" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                            <span className="text-xs text-sidebar-muted-foreground">
                                Dove
                            </span>
                            <span className="text-[15px] leading-5.5 font-semibold">
                                {booking.placeLabel}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {cancelled ? (
                <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border bg-sidebar-accent/50 px-5 py-4 md:px-7"
                >
                    <span className="text-sm text-sidebar-foreground/85">
                        Seduta annullata. Abbiamo avvisato{' '}
                        {booking.trainerFirstName}.
                    </span>
                    <Link
                        href={booking.trainerHref}
                        className="inline-flex min-h-11 items-center px-2 text-sm font-semibold underline"
                    >
                        Prenota di nuovo
                    </Link>
                </div>
            ) : confirming ? (
                <div
                    role="alertdialog"
                    aria-labelledby={confirmTitleId}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border bg-sidebar-accent px-5 py-4 md:px-7"
                >
                    <span className="flex flex-col gap-0.5">
                        <span
                            id={confirmTitleId}
                            className="text-[15px] leading-5.5 font-semibold"
                        >
                            Vuoi annullare la seduta di{' '}
                            {formatDayTimeRelative(booking.start, now)}?
                        </span>
                        <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                            {freeCancellation
                                ? `È gratuita fino a ${formatDayTimeRelative(booking.freeCancellationUntil, now)}. Avvisiamo noi il trainer.`
                                : 'La cancellazione gratuita è scaduta. Avvisiamo noi il trainer.'}
                        </span>
                    </span>
                    <div className="flex gap-2">
                        <Button
                            ref={keepButton}
                            type="button"
                            variant="outline"
                            className="h-11 rounded-[10px] border-sidebar-foreground/25 bg-transparent px-4 text-sidebar-foreground hover:bg-sidebar-border hover:text-sidebar-foreground"
                            onClick={() => setConfirming(false)}
                        >
                            No, tienila
                        </Button>
                        <Button
                            type="button"
                            className="h-11 rounded-[10px] bg-sidebar-primary px-4 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            onClick={() => {
                                setConfirming(false);
                                cancelBooking();
                            }}
                        >
                            Sì, annulla
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border bg-sidebar-accent/50 px-5 py-4 md:px-7">
                    <span className="flex items-center gap-2 text-sm text-sidebar-foreground/85 tabular-nums">
                        <Clock
                            aria-hidden="true"
                            className="size-4 flex-none"
                        />
                        {freeCancellation
                            ? `Cancellazione gratuita fino a ${formatDayTimeRelative(booking.freeCancellationUntil, now)}`
                            : 'Cancellazione gratuita scaduta'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 rounded-[10px] px-4 text-sidebar-foreground underline hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            onClick={() => setConfirming(true)}
                        >
                            Annulla seduta
                        </Button>
                        <Button
                            asChild
                            className="h-11 rounded-[10px] bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        >
                            {/* A file to download: a plain link, not an Inertia visit. */}
                            <a href={booking.calendarHref} download>
                                <CalendarPlus aria-hidden="true" />
                                Aggiungi al calendario
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
