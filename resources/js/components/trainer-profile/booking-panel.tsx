import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { TrainerBooking } from '@/hooks/use-trainer-booking';
import { servicePriceLabel, totalPriceLabel } from '@/lib/booking';
import { formatPrice, formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

/**
 * "da 35 €": the lowest price of a session (packages and bought packages
 * left out, unless there is nothing else).
 */
export function startingPrice(services: TrainerService[]): string | null {
    const sessions = services.filter(
        (service) =>
            service.packageId === null &&
            (service.sessions ?? null) === null &&
            service.priceCents > 0,
    );
    const list = sessions.length > 0 ? sessions : services;

    if (list.length === 0) {
        return null;
    }

    const lowest = Math.min(...list.map((service) => service.priceCents));

    return lowest === 0 ? 'Gratis' : `da ${formatPrice(lowest)}`;
}

type PanelProps = {
    services: TrainerService[];
    booking: TrainerBooking;
    onShowServices: () => void;
    onChooseTime: () => void;
};

/** The price now: the chosen time's total, or "da 35 €". */
function priceNow(services: TrainerService[], booking: TrainerBooking) {
    return booking.start && booking.service
        ? totalPriceLabel(booking.service, booking.minutes, booking.people)
        : startingPrice(services);
}

/**
 * Desktop, on the right of the profile (design "Desktop · Profilo trainer"):
 * the price, "Scegli data e ora", "Mostra i servizi" and the services.
 */
export function BookingAside({
    services,
    booking,
    onShowServices,
    onChooseTime,
    notes,
    trainerFirstName,
}: PanelProps & {
    /** "Conferma entro 24 ore", "Risponde in genere entro 1 ora". */
    notes: (string | null)[];
    trainerFirstName: string;
}) {
    const price = priceNow(services, booking);
    const slot = booking.start
        ? formatSlot(booking.start, booking.minutes / 60)
        : null;

    return (
        <aside
            aria-label={`Prenota con ${trainerFirstName}`}
            className="sticky top-6 hidden flex-col gap-5 rounded-[26px] bg-background p-6 shadow-[inset_0_0_0_1px_var(--border),0_24px_64px_-12px_rgba(0,0,0,0.8)] md:flex"
        >
            <div className="flex items-center gap-3.5">
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-card text-brand"
                >
                    <CalendarDays className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                    {price && (
                        <span className="text-[28px] leading-8.5 font-bold tabular-nums">
                            {price}{' '}
                            {!booking.start && (
                                <span className="text-[15px] font-normal text-muted-foreground">
                                    / seduta
                                </span>
                            )}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onChooseTime}
                        className="self-start text-left text-[15px] text-muted-foreground underline-offset-3 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {slot ?? 'Scegli data e ora'}
                    </button>
                </span>
            </div>

            {booking.start ? (
                <button
                    type="button"
                    disabled={booking.booking}
                    onClick={booking.bookSlot}
                    className="btn-brand h-12.5 text-[17px]"
                >
                    {booking.booking && <Spinner />}
                    Prenota
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onShowServices}
                    className="btn-brand h-12.5 text-[17px]"
                >
                    Mostra i servizi
                </button>
            )}

            <ul className="flex flex-col border-t border-border pt-2">
                {services.map((service) => (
                    <li key={service.id}>
                        <button
                            type="button"
                            onClick={() => {
                                booking.changeService(service.id);
                                onShowServices();
                            }}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-[15px] outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <span>{service.name}</span>
                            <span className="text-muted-foreground tabular-nums">
                                {servicePriceLabel(service)}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            <p className="text-[13px] leading-4.5 text-muted-foreground">
                {[...notes, 'Nessun pagamento online']
                    .filter(Boolean)
                    .join(' · ')}
            </p>
        </aside>
    );
}

/**
 * Phones (design "Barra 5"): the bar fixed at the bottom, round, on black.
 * "Mostra i servizi", or "Prenota" once a time is chosen.
 */
export function BookingBar({
    services,
    booking,
    onShowServices,
    onChooseTime,
}: PanelProps) {
    const price = priceNow(services, booking);
    const slot = booking.start
        ? formatSlot(booking.start, booking.minutes / 60)
        : null;

    return (
        <div className="fixed inset-x-3 bottom-4 z-40 flex items-center gap-3 rounded-[26px] bg-background p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[inset_0_0_0_1px_var(--border),0_16px_48px_-8px_rgba(0,0,0,0.75)] md:hidden">
            <button
                type="button"
                onClick={onChooseTime}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-card text-brand"
                >
                    <CalendarDays className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                    {price && (
                        <span className="text-[17px] leading-5.5 font-bold whitespace-nowrap tabular-nums">
                            {price}
                        </span>
                    )}
                    <span
                        className={
                            slot
                                ? 'truncate text-[13px] text-foreground tabular-nums'
                                : 'truncate text-[13px] text-muted-foreground'
                        }
                    >
                        {slot ?? 'Scegli data e ora'}
                    </span>
                </span>
            </button>

            {booking.start ? (
                <button
                    type="button"
                    disabled={booking.booking}
                    onClick={booking.bookSlot}
                    className="flex h-11 shrink-0 items-center gap-3 rounded-full bg-[linear-gradient(180deg,#6fe4e6_0%,#42d7d9_52%,#2fc4c6_100%)] pr-1.5 pl-5 text-[17px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_24px_0_rgba(66,215,217,0.28)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-70"
                >
                    Prenota
                    <span className="flex size-8 items-center justify-center rounded-full bg-background text-brand">
                        {booking.booking ? (
                            <Spinner />
                        ) : (
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        )}
                    </span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onShowServices}
                    className="btn-brand h-11 shrink-0 px-5 text-[17px]"
                >
                    Mostra i servizi
                </button>
            )}
        </div>
    );
}
