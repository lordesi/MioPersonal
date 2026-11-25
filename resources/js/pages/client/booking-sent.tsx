import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddToCalendar from '@/components/booking/add-to-calendar';
import VerifyEmailNotice from '@/components/booking/verify-email-notice';
import BookingGroup from '@/components/client/booking-group';
import {
    AreaBadge,
    areaButtonClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import { DarkLogo } from '@/components/mp/dark-header';
import AppNotificationsCard from '@/components/pwa/app-notifications-card';
import { Initials } from '@/components/trainer/ui/bits';
import { useCancelBooking } from '@/hooks/use-cancel-booking';
import {
    formatDateLong,
    formatHours,
    formatPrice,
    formatTimeSpan,
} from '@/lib/format';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { bookings } from '@/routes/client';
import type { SentBooking } from '@/types';

type BookingSentProps = {
    booking: SentBooking;
};

/**
 * "Richiesta inviata" (design "Richiesta inviata · V1"): what the client
 * sees right after sending a request: the turquoise check, the request with
 * the trainer, the time and the details, the calendar, then "Vai alle
 * prenotazioni" and "Annulla la richiesta".
 */
export default function BookingSent({ booking }: BookingSentProps) {
    const { auth } = usePage().props;
    const { trainer } = booking;
    const confirmed = booking.status === 'confirmed';
    const { cancelled, cancelBooking } = useCancelBooking(booking.id);
    const [confirming, setConfirming] = useState(false);

    // Dialogs and toasts open in a portal outside the page: dark too.
    useEffect(() => {
        document.documentElement.classList.add('theme-dark');

        return () => document.documentElement.classList.remove('theme-dark');
    }, []);

    const rows = [
        {
            label: 'Seduta',
            value: `${booking.serviceName} · ${formatHours(booking.hours)}`,
        },
        // "Ripeti ogni settimana": asked, or already set ("Sedute fisse").
        ...(booking.repeatWeekly
            ? [
                  {
                      label: 'Ogni settimana',
                      value: booking.repeatWeekly.set
                          ? `${booking.repeatWeekly.label}, sedute fisse attive`
                          : `${booking.repeatWeekly.label}, se il trainer accetta`,
                  },
              ]
            : []),
        // No place when the trainer has more than one: the row is left out.
        ...(booking.placeLabel
            ? [{ label: 'Dove', value: booking.placeLabel }]
            : []),
        {
            label: 'Prezzo',
            value: booking.group
                ? `${formatPrice(booking.priceCents)} in ${booking.group.people}`
                : formatPrice(booking.priceCents),
        },
    ];

    return (
        <div className="theme-dark flex min-h-screen flex-col bg-background text-foreground">
            <Head
                title={confirmed ? 'Seduta confermata' : 'Richiesta inviata'}
            />

            <header className="mx-auto flex w-full max-w-170 px-4 pt-3 md:px-8 md:pt-6">
                <DarkLogo />
            </header>

            <main className="mx-auto flex w-full max-w-170 flex-1 flex-col gap-7 px-4 pt-6 pb-10 md:px-8 md:pt-10 md:pb-16">
                <div className="flex flex-col gap-4">
                    <span className="flex size-18 items-center justify-center rounded-full bg-brand text-black">
                        <Check
                            aria-hidden="true"
                            className="size-8"
                            strokeWidth={2.5}
                        />
                    </span>
                    <h1 className={areaTitleClassName}>
                        {confirmed ? 'Seduta confermata' : 'Richiesta inviata'}
                    </h1>
                    <p className="text-[17px] leading-6 text-muted-foreground">
                        {confirmed
                            ? `${trainer.firstName} conferma le prenotazioni in automatico: la seduta è già confermata.`
                            : `${trainer.firstName} deve confermare. Ti avvisiamo nell’Inbox appena risponde.`}
                    </p>
                </div>

                <section
                    aria-label="La tua richiesta"
                    className={cn(
                        carbCardClassName,
                        'flex flex-col gap-4 p-4.5',
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Initials name={trainer.name} size={48} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <Link
                                href={trainer.href}
                                className="truncate text-[17px] leading-5.5 font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {trainer.name}
                            </Link>
                            <span className="truncate text-[15px] leading-5 text-muted-foreground">
                                {trainer.subtitle}
                            </span>
                        </span>
                        {cancelled ? (
                            <AreaBadge tone="destructive">Annullata</AreaBadge>
                        ) : confirmed ? (
                            <AreaBadge tone="solid">Confermata</AreaBadge>
                        ) : (
                            <AreaBadge tone="warning">Da confermare</AreaBadge>
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <b className="text-[28px] leading-8.5 font-bold tracking-[-0.01em] tabular-nums">
                            {formatTimeSpan(booking.start, booking.hours)}
                        </b>
                        <span className="text-base text-muted-foreground">
                            {formatDateLong(booking.start)}
                        </span>
                    </div>
                    <dl className="flex flex-col">
                        {rows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-baseline justify-between gap-4 border-t border-separator py-3"
                            >
                                <dt className="text-[15px] text-muted-foreground">
                                    {row.label}
                                </dt>
                                <dd className="text-right text-base font-semibold">
                                    {row.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* "Invita un amico": the link right away, while the friends are in mind. */}
                {booking.group && !cancelled && (
                    <section
                        aria-labelledby="invita-amici"
                        className={cn(
                            carbCardClassName,
                            'flex flex-col gap-3 p-4.5',
                        )}
                    >
                        <h2
                            id="invita-amici"
                            className="text-lg leading-6 font-bold"
                        >
                            Invita i tuoi amici
                        </h2>
                        <p className="text-[15px] leading-5 text-muted-foreground">
                            Manda il link a chi viene con te: si registra, si
                            unisce alla seduta e riceve conferme e promemoria.
                        </p>
                        <BookingGroup
                            bookingId={booking.id}
                            group={booking.group}
                            trainerName={trainer.name}
                            variant="dark"
                        />
                    </section>
                )}

                {!cancelled && <AddToCalendar booking={booking} />}

                <AppNotificationsCard
                    title={
                        confirmed
                            ? 'Ricevi i promemoria sul telefono'
                            : `Ti avvisiamo quando ${trainer.firstName} conferma`
                    }
                    description={
                        confirmed
                            ? 'Una notifica il giorno prima e 2 ore prima della seduta.'
                            : 'Una notifica sul telefono appena risponde, e i promemoria prima della seduta.'
                    }
                    dismissKey="booking-sent"
                />

                {auth.user.email_verified_at === null && (
                    <VerifyEmailNotice
                        email={auth.user.email}
                        trainerFirstName={trainer.firstName}
                    />
                )}

                <div className="flex flex-col gap-2">
                    <Link
                        href={bookings()}
                        className={areaButtonClassName('primary', 'lg')}
                    >
                        Vai alle prenotazioni
                    </Link>
                    {cancelled ? (
                        <>
                            <p
                                role="status"
                                className="py-2 text-center text-[15px] text-muted-foreground"
                            >
                                Richiesta annullata. Abbiamo avvisato{' '}
                                {trainer.firstName}.
                            </p>
                            <Link
                                href={searchUrl()}
                                className={areaButtonClassName('ghost', 'lg')}
                            >
                                Cerca altri trainer
                            </Link>
                        </>
                    ) : confirming ? (
                        <div
                            role="alertdialog"
                            aria-label="Conferma l’annullamento"
                            className="flex flex-col gap-3 rounded-2xl bg-card p-4"
                        >
                            <p className="text-[15px] leading-5 font-semibold">
                                Vuoi annullare{' '}
                                {confirmed ? 'la seduta' : 'la richiesta'}?
                                Avvisiamo noi {trainer.firstName}.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className={areaButtonClassName(
                                        'outline',
                                        'md',
                                    )}
                                >
                                    No, tienila
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirming(false);
                                        cancelBooking();
                                    }}
                                    className={areaButtonClassName(
                                        'destructive',
                                        'md',
                                    )}
                                >
                                    Sì, annulla
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className={areaButtonClassName('ghost', 'lg')}
                        >
                            {confirmed
                                ? 'Annulla la seduta'
                                : 'Annulla la richiesta'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
