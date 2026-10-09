import { Check } from 'lucide-react';
import ServicePicker from '@/components/profile/service-picker';
import { Button } from '@/components/ui/button';
import { serviceSummary, totalPriceCents } from '@/lib/booking';
import { formatPrice, formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

const guarantees = [
    'Scegli tu giorno, orario e durata',
    'Ti registri solo quando prenoti',
    'Contatti visibili dopo la conferma',
    'Nessun pagamento online',
];

type BookingAsideProps = {
    services: TrainerService[];
    service: TrainerService;
    onServiceChange: (serviceId: number) => void;
    hours: number;
    selectedStart: string | null;
    /** Where "Prenota questo slot" goes once a slot is chosen. */
    bookHref: string;
};

/** Desktop booking box next to the profile content. */
export default function BookingAside({
    services,
    service,
    onServiceChange,
    hours,
    selectedStart,
    bookHref,
}: BookingAsideProps) {
    return (
        <aside
            aria-label="Prenota una seduta"
            className="hidden flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm lg:sticky lg:top-6 lg:flex"
        >
            <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-3xl font-bold tracking-tight">
                    {formatPrice(totalPriceCents(service, hours))}
                </span>
                <span className="text-sm text-muted-foreground">
                    {serviceSummary(service, hours)} · indicativo
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
                        {formatSlot(selectedStart, hours)}
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

            <Button asChild className="h-11 px-6">
                <a href={selectedStart ? bookHref : '#prenota'}>
                    {selectedStart
                        ? 'Prenota questo slot'
                        : 'Scegli giorno e orario'}
                </a>
            </Button>

            <ul className="flex flex-col gap-2.5 border-t pt-4 text-sm text-muted-foreground">
                {guarantees.map((guarantee) => (
                    <li key={guarantee} className="flex gap-2.5">
                        <Check
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        {guarantee}
                    </li>
                ))}
            </ul>
        </aside>
    );
}
