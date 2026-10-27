import { router } from '@inertiajs/react';
import type { VisitOptions } from '@inertiajs/core';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatDayLong, formatTimeSpan } from '@/lib/format';
import { romeParts } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { noShow } from '@/routes/trainer/sessions';
import { destroy as unmarkNoShow } from '@/routes/trainer/sessions/no-show';
import type { TrainerPastSession } from '@/types';

type Outcome = 'done' | 'missed';

const ITEM =
    'h-9 gap-1.5 rounded-[9px] text-[13px] leading-4.5 font-medium text-muted-foreground first:rounded-[9px] last:rounded-[9px] hover:bg-card hover:text-foreground data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground';

/**
 * "Effettuata | Saltata" on a card of "Ultimi 7 giorni" and on a row of
 * "Sedute passate". A session is done by
 * itself: "Saltata" marks that the client didn't come, "Effettuata" takes it
 * back. One click undoes the other, so no confirmation. The server checks the
 * 7 days (Booking::NO_SHOW_DAYS) and sends the page back with `noShow` updated.
 */
export default function SessionOutcomeToggle({
    session,
    className,
}: {
    session: TrainerPastSession;
    /** E.g. the fixed width in the rows of "Sedute passate". */
    className?: string;
}) {
    const [processing, setProcessing] = useState(false);

    const options: VisitOptions = {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
        onError: (errors) => toast.error(errors.booking ?? 'Riprova tra poco.'),
    };

    const change = (outcome: string) => {
        // '' = a click on the option already chosen: nothing to change.
        if (outcome === 'missed' && !session.noShow) {
            router.post(noShow.url(session.id), {}, options);
        }

        if (outcome === 'done' && session.noShow) {
            router.delete(unmarkNoShow.url(session.id), options);
        }
    };

    const day = formatDayLong(romeParts(session.start).date).toLowerCase();

    return (
        <ToggleGroup
            type="single"
            value={(session.noShow ? 'missed' : 'done') satisfies Outcome}
            onValueChange={change}
            disabled={processing || !session.canChangeNoShow}
            aria-label={`Esito seduta di ${day}, ${formatTimeSpan(session.start, session.hours)}`}
            className={cn(
                'grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1',
                className,
            )}
        >
            <ToggleGroupItem value="done" className={ITEM}>
                <Check aria-hidden="true" className="size-3.5" />
                Effettuata
            </ToggleGroupItem>
            <ToggleGroupItem value="missed" className={ITEM}>
                <X aria-hidden="true" className="size-3.5" />
                Saltata
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
