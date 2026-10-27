import { Clock, CreditCard } from 'lucide-react';
import ServicePicker from '@/components/profile/service-picker';
import { Button } from '@/components/ui/button';
import { totalPriceLabel } from '@/lib/booking';
import { formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

type BookingAsideProps = {
    services: TrainerService[];
    service: TrainerService;
    onServiceChange: (serviceId: number) => void;
    /** Chosen duration of the session. */
    minutes: number;
    selectedStart: string | null;
    /** "Conferma entro 24 ore" or "Conferma immediata". */
    confirmLabel: string;
    /** "Prenota il tuo slot", once a slot is chosen. */
    onBook: () => void;
    /** The request is being sent. */
    booking: boolean;
};

/** The black booking box next to the profile content (from lg). */
export default function BookingAside({
    services,
    service,
    onServiceChange,
    minutes,
    selectedStart,
    confirmLabel,
    onBook,
    booking,
}: BookingAsideProps) {
    return (
        <aside
            aria-labelledby="booking-title"
            className="hidden flex-col gap-4 rounded-3xl bg-primary p-5.5 text-primary-foreground shadow-2xl lg:sticky lg:top-6 lg:flex"
        >
            <div className="flex flex-col gap-0.5">
                <h2 id="booking-title" className="sr-only">
                    Prenota
                </h2>
                <span className="text-[34px] leading-10 font-bold tracking-[-0.03em] tabular-nums">
                    {totalPriceLabel(service, minutes)}
                </span>
                {selectedStart && (
                    <span className="text-sm text-primary-foreground/60 tabular-nums">
                        {formatSlot(selectedStart, minutes / 60)}
                    </span>
                )}
            </div>

            <ServicePicker
                variant="dark"
                legend="Servizi disponibili"
                services={services}
                value={service.id}
                onChange={onServiceChange}
            />

            {selectedStart ? (
                <Button
                    type="button"
                    className="h-12.5 rounded-[14px] bg-primary-foreground text-[15px] font-semibold text-primary hover:bg-primary-foreground/85"
                    disabled={booking}
                    onClick={onBook}
                >
                    Prenota il tuo slot
                </Button>
            ) : (
                // Without a slot: a link to the calendar, grey like the disabled button of the design.
                <Button
                    asChild
                    className="h-12.5 rounded-[14px] bg-primary-foreground/10 text-[15px] font-semibold text-primary-foreground/60 hover:bg-primary-foreground/15"
                >
                    <a href="#prenota">Scegli uno slot</a>
                </Button>
            )}

            <ul className="flex flex-col gap-2.5 border-t border-primary-foreground/10 pt-3.5 text-[13px] leading-[18px] text-primary-foreground/80">
                <li className="flex gap-2.5">
                    <Clock aria-hidden="true" className="size-4 shrink-0" />
                    {confirmLabel}
                </li>
                <li className="flex gap-2.5">
                    <CreditCard
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    Nessun pagamento online
                </li>
            </ul>
        </aside>
    );
}
