import { router } from '@inertiajs/react';
import type { VisitOptions } from '@inertiajs/core';
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
    'h-8 rounded-full px-3 text-[13px] leading-4.5 font-semibold text-muted-foreground first:rounded-full last:rounded-full hover:bg-transparent hover:text-foreground data-[state=on]:bg-brand data-[state=on]:text-black';

/**
 * "Fatta | Saltata" on a card of "Ultimi 7 giorni" and on a row of
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
                'inline-flex gap-0.5 rounded-full bg-card p-0.75',
                className,
            )}
        >
            <ToggleGroupItem value="done" className={ITEM}>
                Fatta
            </ToggleGroupItem>
            <ToggleGroupItem value="missed" className={ITEM}>
                Saltata
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
