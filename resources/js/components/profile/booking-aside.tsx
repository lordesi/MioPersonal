import ServicePicker from '@/components/profile/service-picker';
import { Button } from '@/components/ui/button';
import { serviceSummary, totalPriceLabel } from '@/lib/booking';
import { formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

type BookingAsideProps = {
    services: TrainerService[];
    service: TrainerService;
    onServiceChange: (serviceId: number) => void;
    /** Chosen duration of the session. */
    minutes: number;
    selectedStart: string | null;
    /** "Prenota questo slot", once a slot is chosen. */
    onBook: () => void;
    /** The request is being sent. */
    booking: boolean;
};

/** Desktop booking box next to the profile content. */
export default function BookingAside({
    services,
    service,
    onServiceChange,
    minutes,
    selectedStart,
    onBook,
    booking,
}: BookingAsideProps) {
    return (
        <aside
            aria-label="Prenota una seduta"
            className="hidden flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm lg:sticky lg:top-6 lg:flex"
        >
            <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-3xl font-bold tracking-tight">
                    {totalPriceLabel(service, minutes)}
                </span>
                <span className="text-sm text-muted-foreground">
                    {serviceSummary(service, minutes)} · indicativo
                </span>
            </div>

            <ServicePicker
                legend="Scegli il servizio"
                services={services}
                value={service.id}
                onChange={onServiceChange}
            />

            <div className="flex flex-col gap-1 rounded-lg bg-muted p-3.5">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                    Il tuo slot
                </span>
                {selectedStart ? (
                    <span className="text-base font-semibold tabular-nums">
                        {formatSlot(selectedStart, minutes / 60)}
                    </span>
                ) : (
                    <a
                        href="#prenota"
                        className="text-sm font-medium underline"
                    >
                        Scegli giorno e orario
                    </a>
                )}
            </div>

            {selectedStart ? (
                <Button
                    type="button"
                    className="h-11 px-6"
                    disabled={booking}
                    onClick={onBook}
                >
                    Prenota questo slot
                </Button>
            ) : (
                <Button asChild className="h-11 px-6">
                    <a href="#prenota">Scegli giorno e orario</a>
                </Button>
            )}
        </aside>
    );
}
