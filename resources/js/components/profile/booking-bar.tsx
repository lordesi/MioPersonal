import { Button } from '@/components/ui/button';
import { totalPriceCents } from '@/lib/booking';
import { formatPrice, formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

type BookingBarProps = {
    service: TrainerService;
    hours: number;
    selectedStart: string | null;
    bookHref: string;
};

/** Price and booking button stuck to the bottom of the screen (below lg). */
export default function BookingBar({
    service,
    hours,
    selectedStart,
    bookHref,
}: BookingBarProps) {
    return (
        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t bg-background px-4 py-3 shadow-[0_-1px_3px_0] shadow-foreground/5 lg:hidden">
            <span className="flex flex-col tabular-nums">
                <span className="text-lg leading-6 font-bold tracking-tight">
                    {formatPrice(totalPriceCents(service, hours))}
                </span>
                <span className="text-xs text-muted-foreground">
                    {selectedStart
                        ? formatSlot(selectedStart, hours)
                        : 'Scegli giorno e orario'}
                </span>
            </span>
            <Button asChild className="ml-auto h-11 flex-1">
                <a href={selectedStart ? bookHref : '#prenota'}>
                    {selectedStart ? 'Prenota' : 'Scegli orario'}
                </a>
            </Button>
        </div>
    );
}
