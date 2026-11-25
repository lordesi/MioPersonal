import { Link } from '@inertiajs/react';
import { Clock, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { useState } from 'react';
import BookingGroup from '@/components/client/booking-group';
import {
    AreaBadge,
    areaButtonClassName,
    areaSectionTitleClassName,
    carbCardClassName,
    openCardClassName,
    roundButtonClassName,
} from '@/components/mp/area-bits';
import type { BadgeTone } from '@/components/mp/area-bits';
import DarkDialog from '@/components/mp/dark-dialog';
import { Initials } from '@/components/trainer/ui/bits';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import {
    dateBlockParts,
    formatDateLong,
    formatDayTimeRelative,
    formatTime,
    formatTimeSpan,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    ClientPackage,
    ClientPendingBooking,
    ClientUpcomingBooking,
} from '@/types';

/** "Tra 18 ore", "Domani", "Confermata": the badge of a confirmed session. */
export function upcomingBadge(
    start: string,
    now: Date,
): { label: string; tone: BadgeTone } {
    const hours = (new Date(start).getTime() - now.getTime()) / 3_600_000;

    if (hours < 1) {
        return { label: 'Tra poco', tone: 'solid' };
    }

    if (hours < 24) {
        const rounded = Math.round(hours);

        return {
            label: rounded === 1 ? 'Tra 1 ora' : `Tra ${rounded} ore`,
            tone: 'solid',
        };
    }

    if (hours < 48) {
        return { label: 'Domani', tone: 'solid' };
    }

    return { label: 'Confermata', tone: 'neutral' };
}

/** Google Maps for a place; null for the sessions online. */
export function directionsHref(place: string): string | null {
    if (place === '' || /online|videochiamata/i.test(place)) {
        return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

/**
 * "PROSSIMA SEDUTA" (design "Prenotazioni · V2"): the turquoise outline, the
 * time in big, the day and the discipline, the trainer and the place, then
 * Scrivi, Indicazioni and "Dettagli".
 */
export function NextBookingCard({
    booking,
    now,
    messageHref,
    onDetails,
}: {
    booking: ClientUpcomingBooking;
    now: Date;
    messageHref: string | null;
    onDetails: () => void;
}) {
    const badge = upcomingBadge(booking.start, now);
    const directions = directionsHref(booking.placeLabel);

    return (
        <section
            aria-label="Prossima seduta"
            className={cn(
                carbCardClassName,
                openCardClassName,
                'flex flex-col gap-4.5 p-5',
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-[0.02em] text-brand">
                    PROSSIMA SEDUTA
                </span>
                <AreaBadge tone={badge.tone}>{badge.label}</AreaBadge>
            </div>
            <div className="flex flex-col gap-1">
                <b className="text-4xl leading-10.5 font-bold tracking-[-0.02em] tabular-nums">
                    {formatTimeSpan(booking.start, booking.hours)}
                </b>
                <span className="text-[17px] leading-5.5 text-muted-foreground">
                    {formatDateLong(booking.start)} · {booking.discipline}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <Initials name={booking.trainerName} size={44} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                        href={booking.trainerHref}
                        className="truncate text-[17px] leading-5.5 font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {booking.trainerName}
                    </Link>
                    {booking.placeLabel && (
                        <span className="truncate text-[15px] leading-5 text-muted-foreground">
                            {booking.placeLabel}
                        </span>
                    )}
                </span>
            </div>
            <div className="flex gap-2.5">
                {messageHref && (
                    <Link
                        href={messageHref}
                        aria-label={`Scrivi a ${booking.trainerFirstName}`}
                        title="Scrivi"
                        className={roundButtonClassName}
                    >
                        <MessageCircle aria-hidden="true" className="size-5" />
                    </Link>
                )}
                {directions && (
                    <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Indicazioni per ${booking.placeLabel}`}
                        title="Indicazioni"
                        className={roundButtonClassName}
                    >
                        <Navigation aria-hidden="true" className="size-5" />
                    </a>
                )}
                <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={onDetails}
                    className={cn(
                        areaButtonClassName('primary', 'lg'),
                        'flex-1',
                    )}
                >
                    Dettagli
                </button>
            </div>
        </section>
    );
}

/** An item of "Più avanti": a confirmed session or a request waiting. */
export type TimelineItem =
    | { kind: 'upcoming'; booking: ClientUpcomingBooking }
    | { kind: 'pending'; booking: ClientPendingBooking };

/**
 * "Più avanti": the line with a turquoise dot for each session, the day and
 * the time, the discipline and the trainer, the badge. A tap opens the
 * details (or the request, which can still be withdrawn).
 */
export function LaterTimeline({
    items,
    onOpen,
}: {
    items: TimelineItem[];
    onOpen: (item: TimelineItem) => void;
}) {
    return (
        <section
            aria-labelledby="later-title"
            className="flex flex-col gap-1.5"
        >
            <h2
                id="later-title"
                className={cn(areaSectionTitleClassName, 'mb-2')}
            >
                Più avanti
            </h2>
            <ol className="flex flex-col">
                {items.map((item, index) => {
                    const { booking } = item;
                    const parts = dateBlockParts(booking.start);
                    const what =
                        item.kind === 'upcoming'
                            ? item.booking.discipline
                            : item.booking.serviceName;
                    const content = (
                        <>
                            <span className="text-xs leading-4 font-semibold tracking-[0.02em] text-muted-foreground uppercase tabular-nums">
                                {parts.weekday} {parts.day} {parts.month} ·{' '}
                                {formatTime(booking.start)}
                            </span>
                            <b className="text-[17px] leading-5.5 font-semibold">
                                {what} con {booking.trainerName}
                            </b>
                            <span className="flex gap-2 pt-0.5">
                                {item.kind === 'upcoming' ? (
                                    <AreaBadge>Confermata</AreaBadge>
                                ) : (
                                    <AreaBadge tone="warning">
                                        Da confermare
                                    </AreaBadge>
                                )}
                            </span>
                        </>
                    );

                    return (
                        <li
                            key={`${item.kind}-${booking.id}`}
                            className="flex gap-4"
                        >
                            <span
                                aria-hidden="true"
                                className="flex w-3.5 shrink-0 flex-col items-center pt-1.5"
                            >
                                <span
                                    className={cn(
                                        'size-2.5 shrink-0 rounded-full',
                                        item.kind === 'upcoming'
                                            ? 'bg-brand'
                                            : 'bg-input',
                                    )}
                                />
                                {index < items.length - 1 && (
                                    <span className="mt-1 w-0.5 flex-1 bg-separator" />
                                )}
                            </span>
                            <button
                                type="button"
                                aria-haspopup="dialog"
                                onClick={() => onOpen(item)}
                                className="flex min-w-0 flex-1 flex-col gap-0.75 rounded-xl pb-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {content}
                                {item.kind === 'pending' && (
                                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                                        In attesa della conferma di{' '}
                                        {item.booking.trainerFirstName}.
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

/**
 * The details of a confirmed session: when, where, the service, the friends
 * invited, and "Annulla seduta" until the free cancellation ends.
 */
export function BookingDetailsDialog({
    booking,
    now,
    messageHref,
    onOpenChange,
}: {
    booking: ClientUpcomingBooking | null;
    now: Date;
    messageHref: string | null;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <DarkDialog
            open={booking !== null}
            onOpenChange={onOpenChange}
            title={
                booking
                    ? `${booking.discipline} con ${booking.trainerName}`
                    : ''
            }
            className="md:max-w-130"
        >
            {booking && (
                <DetailsBody
                    key={booking.id}
                    booking={booking}
                    now={now}
                    messageHref={messageHref}
                />
            )}
        </DarkDialog>
    );
}

function DetailsBody({
    booking,
    now,
    messageHref,
}: {
    booking: ClientUpcomingBooking;
    now: Date;
    messageHref: string | null;
}) {
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const [confirming, setConfirming] = useState(false);
    // A friend invited to the session doesn't cancel it: they can only leave.
    const isGuest = booking.group?.role === 'guest';
    const freeCancellation =
        !isGuest && new Date(booking.freeCancellationUntil) > now;
    const directions = directionsHref(booking.placeLabel);

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <b className="text-[28px] leading-8.5 font-bold tracking-[-0.01em] tabular-nums">
                    {formatTimeSpan(booking.start, booking.hours)}
                </b>
                <span className="text-[17px] leading-5.5 text-muted-foreground">
                    {formatDateLong(booking.start)}
                </span>
            </div>

            <dl className="flex flex-col gap-3 text-[15px] leading-5">
                {booking.placeLabel && (
                    <div className="flex items-start gap-2.5">
                        <dt className="sr-only">Dove</dt>
                        <MapPin
                            aria-hidden="true"
                            className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
                        />
                        <dd>{booking.placeLabel}</dd>
                    </div>
                )}
                <div className="flex items-start gap-2.5">
                    <dt className="sr-only">Servizio</dt>
                    <span
                        aria-hidden="true"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                    />
                    <dd>{booking.serviceLabel}</dd>
                </div>
                {freeCancellation && !cancelled && (
                    <div className="flex items-start gap-2.5 text-muted-foreground">
                        <dt className="sr-only">Cancellazione</dt>
                        <Clock
                            aria-hidden="true"
                            className="mt-0.5 size-4.5 shrink-0"
                        />
                        <dd>
                            Annulli gratis fino a{' '}
                            {formatDayTimeRelative(
                                booking.freeCancellationUntil,
                                now,
                            )}
                        </dd>
                    </div>
                )}
            </dl>

            {booking.group && !cancelled && (
                <BookingGroup
                    bookingId={booking.id}
                    group={booking.group}
                    trainerName={booking.trainerName}
                    variant="dark"
                />
            )}

            {cancelled ? (
                <p
                    role="status"
                    className="rounded-2xl bg-secondary px-4 py-3 text-[15px] leading-5"
                >
                    Seduta annullata. Abbiamo avvisato{' '}
                    {booking.trainerFirstName}.
                </p>
            ) : confirming ? (
                <div
                    role="alertdialog"
                    aria-label="Conferma l’annullamento"
                    className="flex flex-col gap-3 rounded-2xl bg-secondary p-4"
                >
                    <p className="text-[15px] leading-5 font-semibold">
                        Vuoi annullare la seduta di{' '}
                        {formatDayTimeRelative(booking.start, now)}? Avvisiamo
                        noi {booking.trainerFirstName}.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className={areaButtonClassName('outline', 'md')}
                        >
                            No, tienila
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setConfirming(false);
                                cancelBooking();
                            }}
                            className={areaButtonClassName('destructive', 'md')}
                        >
                            Sì, annulla
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2.5">
                    {messageHref && (
                        <Link
                            href={messageHref}
                            className={areaButtonClassName('outline', 'md')}
                        >
                            <MessageCircle
                                aria-hidden="true"
                                className="size-4.5"
                            />
                            Scrivi
                        </Link>
                    )}
                    {directions && (
                        <a
                            href={directions}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={areaButtonClassName('outline', 'md')}
                        >
                            <Navigation
                                aria-hidden="true"
                                className="size-4.5"
                            />
                            Indicazioni
                        </a>
                    )}
                    <Link
                        href={booking.trainerHref}
                        className={areaButtonClassName('outline', 'md')}
                    >
                        Profilo del trainer
                    </Link>
                    {freeCancellation && (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className={cn(
                                areaButtonClassName('ghost', 'md'),
                                'text-[#ff7a7a]',
                            )}
                        >
                            Annulla seduta
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * A package (design "Pacchetti"): the trainer, "9 di 10 sedute", "Rinnova"
 * and the turquoise bar of the sessions done.
 */
export function PackageCard({
    pack,
    renewHref,
}: {
    pack: ClientPackage;
    renewHref: string;
}) {
    const percent = pack.total > 0 ? (pack.done / pack.total) * 100 : 0;

    return (
        <div className={cn(carbCardClassName, 'flex flex-col gap-3 p-4')}>
            <div className="flex items-center gap-3">
                <Initials name={pack.trainerName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="truncate text-base leading-5.5 font-semibold">
                        {pack.name} con {pack.trainerName}
                    </b>
                    <span className="text-[15px] leading-5 text-muted-foreground tabular-nums">
                        {pack.done} di {pack.total} sedute
                    </span>
                </span>
                <Link
                    href={renewHref}
                    className={areaButtonClassName('outline', 'sm')}
                >
                    Rinnova
                </Link>
            </div>
            <span
                role="progressbar"
                aria-label={`${pack.done} sedute fatte su ${pack.total}`}
                aria-valuemin={0}
                aria-valuemax={pack.total}
                aria-valuenow={pack.done}
                className="block h-1.5 overflow-hidden rounded-full bg-[#26282c]"
            >
                <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${percent}%` }}
                />
            </span>
        </div>
    );
}
