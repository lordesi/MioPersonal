import { Button } from '@/components/ui/button';
import { totalPriceLabel } from '@/lib/booking';
import { formatSlot } from '@/lib/format';
import type { TrainerService } from '@/types';

type BookingBarProps = {
    service: TrainerService;
    /** Chosen duration of the session. */
    minutes: number;
    selectedStart: string | null;
    /** "Prenota", once a slot is chosen. */
    onBook: () => void;
    /** The request is being sent. */
    booking: boolean;
};

/** Price and booking button stuck to the bottom of the screen (below lg). */
export default function BookingBar({
    service,
    minutes,
    selectedStart,
    onBook,
    booking,
}: BookingBarProps) {
    return (
        <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t bg-background px-4 py-3 shadow-[0_-1px_3px_0] shadow-foreground/5 lg:hidden">
            <span className="flex flex-col tabular-nums">
                <span className="text-lg leading-6 font-bold tracking-tight">
                    {totalPriceLabel(service, minutes)}
                </span>
                <span className="text-xs text-muted-foreground">
                    {selectedStart
                        ? formatSlot(selectedStart, minutes / 60)
                        : 'Scegli giorno e orario'}
                </span>
            </span>
            {selectedStart ? (
                <Button
                    type="button"
                    className="ml-auto h-11 flex-1"
                    disabled={booking}
                    onClick={onBook}
                >
                    Prenota
                </Button>
            ) : (
                <Button asChild className="ml-auto h-11 flex-1">
                    <a href="#prenota">Scegli orario</a>
                </Button>
            )}
        </div>
    );
}
