import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import AddToCalendar from '@/components/booking/add-to-calendar';
import BookingGroup from '@/components/client/booking-group';
import BookingSummary from '@/components/booking/booking-summary';
import VerifyEmailNotice from '@/components/booking/verify-email-notice';
import AccountMenu from '@/components/layout/account-menu';
import MinimalHeader from '@/components/layout/minimal-header';
import AppNotificationsCard from '@/components/pwa/app-notifications-card';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import {
    addHours,
    formatDateLong,
    formatDateMedium,
    formatHours,
    formatPrice,
    formatTime,
    formatTimeRange,
} from '@/lib/format';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes/client';
import type { SentBooking } from '@/types';

type BookingSentProps = {
    booking: SentBooking;
};

/** "Prenotazione inviata": what the client sees right after sending a request. */
export default function BookingSent({ booking }: BookingSentProps) {
    const { auth } = usePage().props;
    const { trainer } = booking;
    const end = addHours(booking.start, booking.hours);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Prenotazione inviata" />

            <MinimalHeader>
                <AccountMenu
                    variant="client"
                    userName={auth.user.name}
                    headerHeight={16}
                />
            </MinimalHeader>

            <main className="mx-auto flex w-full max-w-180 flex-1 flex-col gap-4 px-4 pt-4 pb-8 md:px-8 md:pt-10 md:pb-16">
                <section
                    aria-labelledby="slot-riservato"
                    className="flex flex-col items-center gap-2.5 rounded-[18px] bg-primary px-4.5 py-6 text-center text-primary-foreground md:px-8 md:py-9"
                >
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary-foreground text-primary">
                        <Check
                            aria-hidden="true"
                            className="size-6.5"
                            strokeWidth={2.5}
                        />
                    </span>
                    <SectionLabel
                        as="span"
                        className="text-primary-foreground opacity-70"
                    >
                        Slot riservato per te
                    </SectionLabel>
                    <h1
                        id="slot-riservato"
                        className="text-[30px] leading-[34px] font-bold tracking-[-0.03em] tabular-nums md:text-[40px] md:leading-11"
                    >
                        {formatDateLong(booking.start)}
                        <br />
                        {formatTime(booking.start)} – {formatTime(end)}
                    </h1>
                    {/* Trainers with automatic confirmation: already confirmed. */}
                    {booking.status === 'confirmed' && (
                        <p className="max-w-115 opacity-80">
                            {trainer.firstName} conferma le prenotazioni in
                            automatico: la seduta è già confermata.
                        </p>
                    )}
                </section>

                {/* "Invita un amico": the link right away, while the friends are in mind. */}
                {booking.group && (
                    <section
                        aria-labelledby="invita-amici"
                        className="flex flex-col gap-3 rounded-[18px] border bg-card p-4.5 md:p-6"
                    >
                        <h2
                            id="invita-amici"
                            className="text-lg leading-6 font-bold tracking-tight"
                        >
                            Invita i tuoi amici
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manda il link a chi viene con te: si registra, si
                            unisce alla seduta e riceve conferme e promemoria.
                        </p>
                        <BookingGroup
                            bookingId={booking.id}
                            group={booking.group}
                            trainerName={trainer.name}
                        />
                    </section>
                )}

                {/* Only on mobile, as in the design. */}
                <AddToCalendar booking={booking} className="md:hidden" />

                <AppNotificationsCard
                    title={
                        booking.status === 'confirmed'
                            ? 'Ricevi i promemoria sul telefono'
                            : `Ti avvisiamo quando ${trainer.firstName} conferma`
                    }
                    description={
                        booking.status === 'confirmed'
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

                <BookingSummary
                    title="Riepilogo"
                    status={booking.status}
                    trainer={{
                        name: trainer.name,
                        subtitle: trainer.subtitle,
                        href: trainer.href,
                    }}
                    rows={[
                        {
                            label: 'Servizio',
                            value: `${booking.serviceName} · ${formatHours(booking.hours)}`,
                        },
                        {
                            label: 'Quando',
                            value: `${formatDateMedium(booking.start)}, ${formatTimeRange(booking.start, booking.hours)}`,
                        },
                        // No place when the trainer has more than one: the row is left out.
                        ...(booking.placeLabel
                            ? [
                                  {
                                      label: 'Dove',
                                      value: (
                                          <>
                                              {booking.placeLabel}
                                              <br />
                                              <span className="font-normal text-muted-foreground">
                                                  Indirizzo dopo la conferma
                                              </span>
                                          </>
                                      ),
                                  },
                              ]
                            : []),
                        {
                            label: 'Prezzo',
                            value: booking.group
                                ? `${formatPrice(booking.priceCents)} in ${booking.group.people}`
                                : formatPrice(booking.priceCents),
                            emphasis: true,
                        },
                    ]}
                >
                    {/* Bookings can't be moved, only cancelled: the dialog is in "Le mie prenotazioni". */}
                    <Button
                        asChild
                        variant="ghost"
                        className="h-10 px-3.5 underline"
                    >
                        <Link href={home()}>Annulla la prenotazione</Link>
                    </Button>
                </BookingSummary>

                <div className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        className="h-12 flex-[1_1_200px] rounded-[10px] text-base font-semibold"
                    >
                        <Link href={home()}>Vai alle mie prenotazioni</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 flex-[1_1_200px] rounded-[10px] text-base"
                    >
                        <Link href={searchUrl()}>Cerca altri trainer</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
