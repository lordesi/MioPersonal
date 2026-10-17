import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * "Nessuna seduta in programma": the empty box of the client home and of
 * "Le mie prenotazioni", with the link to the search.
 */
export default function NoUpcomingSessions({ bookUrl }: { bookUrl: string }) {
    return (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-input px-4 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <strong className="text-lg">Nessuna seduta in programma</strong>
            <span className="max-w-90 text-sm text-muted-foreground">
                Scegli un trainer, un giorno e un orario: la tua prossima seduta
                comparirà qui.
            </span>
            <Button asChild className="h-11 rounded-lg px-4.5">
                <Link href={bookUrl}>Cerca un trainer</Link>
            </Button>
        </div>
    );
}
