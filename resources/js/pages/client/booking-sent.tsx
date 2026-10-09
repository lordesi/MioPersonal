import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import AddToCalendar from '@/components/booking/add-to-calendar';
import BookingSummary from '@/components/booking/booking-summary';
import NextSteps from '@/components/booking/next-steps';
import VerifyEmailNotice from '@/components/booking/verify-email-notice';
import MinimalHeader from '@/components/layout/minimal-header';
import SectionLabel from '@/components/shared/section-label';
import UserAvatar from '@/components/shared/user-avatar';
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
import { bookings } from '@/routes/client';
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
                <UserAvatar
                    name={auth.user.name}
                    src={auth.user.avatar}
                    label={`Account di ${auth.user.name}`}
                    className="text-foreground"
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
                    <p className="max-w-115 opacity-80">
                        {trainer.firstName} conferma entro{' '}
                        {booking.confirmWithinHours} ore. Se non risponde, lo
                        slot si libera e ti avvisiamo subito.
                    </p>
                </section>

                {/* Only on mobile, as in the design. */}
                <AddToCalendar
                    trainerFirstName={trainer.firstName}
                    className="md:hidden"
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
                        {
                            label: 'Prezzo indicativo',
                            value: `${formatPrice(booking.priceCents)}, da pagare a ${trainer.firstName}`,
                            emphasis: true,
                        },
                        {
                            label: 'Cancellazione',
                            value: `Gratis fino a ${formatHours(booking.freeCancellationHours)} prima`,
                        },
                    ]}
                >
                    {/* TODO: open the reschedule and cancel flows of this booking. */}
                    <Button asChild variant="outline" className="h-10 px-3.5">
                        <Link href={bookings()}>Sposta</Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="h-10 px-3.5 underline"
                    >
                        <Link href={bookings()}>Annulla la prenotazione</Link>
                    </Button>
                </BookingSummary>

                <NextSteps
                    trainerFirstName={trainer.firstName}
                    confirmWithinHours={booking.confirmWithinHours}
                />

                <div className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        className="h-12 flex-[1_1_200px] rounded-[10px] text-base font-semibold"
                    >
                        <Link href={bookings()}>Vai alle mie prenotazioni</Link>
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
