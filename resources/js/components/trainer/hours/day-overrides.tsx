import { router } from '@inertiajs/react';
import { CalendarOff, Clock, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import { dayRanges } from '@/components/trainer/hours/availability-summary';
import { Button } from '@/components/ui/button';
import { sessionsLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayRange,
    formatWeekdayShort,
    formatDayNumber,
} from '@/lib/format';
import type { TrainerDayOverrideBlock } from '@/types';

/**
 * The days with other hours or closed, from today on, with "Ripristina orari
 * di base" (TrainerAvailabilityController::destroyOverride).
 */
export default function DayOverrides({
    blocks,
}: {
    blocks: TrainerDayOverrideBlock[];
}) {
    const [restoring, setRestoring] = useState<string | null>(null);

    if (blocks.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nessuna modifica: in tutti i prossimi giorni valgono gli orari
                di base.
            </p>
        );
    }

    const restore = (block: TrainerDayOverrideBlock) =>
        router.delete(TrainerAvailabilityController.destroyOverride.url(), {
            data: { from: block.from, to: block.to },
            preserveScroll: true,
            onStart: () => setRestoring(block.from),
            onFinish: () => setRestoring(null),
        });

    return (
        <ul className="flex flex-col gap-2.5">
            {blocks.map((block) => {
                const when =
                    block.from === block.to
                        ? formatDayLong(block.from)
                        : formatDayRange(block.from, block.to);
                const Icon = block.closed ? CalendarOff : Clock;

                return (
                    <li
                        key={block.from}
                        className="flex flex-col gap-2.5 rounded-2xl border bg-card p-4"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <span className="flex min-w-0 items-start gap-3">
                                <span className="flex size-9 flex-none items-center justify-center rounded-full bg-secondary">
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="font-semibold">
                                        {when}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {block.closed
                                            ? 'Chiuso'
                                            : 'Orari diversi'}
                                        {block.note && ` · ${block.note}`}
                                    </span>
                                </span>
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={restoring === block.from}
                                onClick={() => restore(block)}
                                className="h-9 rounded-[10px] px-3 text-[13px]"
                            >
                                Ripristina orari di base
                            </Button>
                        </div>

                        {!block.closed && (
                            <ul className="flex flex-col gap-1 pl-12 text-sm tabular-nums">
                                {block.days.map((day) => (
                                    <li key={day.date} className="flex gap-2">
                                        <span className="w-14 flex-none text-muted-foreground">
                                            {formatWeekdayShort(day.date)}{' '}
                                            {formatDayNumber(day.date)}
                                        </span>
                                        <span>
                                            {day.hours.length === 0
                                                ? 'Chiuso'
                                                : dayRanges(day.hours)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {block.bookings > 0 && (
                            <p className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-[13px]">
                                <TriangleAlert
                                    aria-hidden="true"
                                    className="mt-0.5 size-3.5 flex-none"
                                />
                                Hai già {sessionsLabel(block.bookings)} in
                                questi giorni:{' '}
                                {block.bookings === 1
                                    ? 'resta valida'
                                    : 'restano valide'}
                                . Se non puoi esserci, avvisa il cliente.
                            </p>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
