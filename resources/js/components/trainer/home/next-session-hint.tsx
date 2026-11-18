import { ArrowRight } from 'lucide-react';
import { romeParts } from '@/lib/calendar';
import { formatDayRelative, formatTime } from '@/lib/format';
import type { TrainerSession } from '@/types';

/**
 * "Prossima seduta" when it is not on the chosen day: one line that brings
 * to its day, where it opens with all its actions.
 */
export default function NextSessionHint({
    session,
    onPick,
}: {
    session: TrainerSession;
    onPick: (date: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onPick(romeParts(session.start).date)}
            className="flex items-center gap-3 rounded-full bg-[#121212] py-2.5 pr-3 pl-4 text-left shadow-[inset_0_0_0_1px_#2c2c2c] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <span
                className="size-2 shrink-0 rounded-full bg-brand"
                aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-[15px]">
                <span className="text-muted-foreground">Prossima seduta: </span>
                <span className="font-semibold">
                    {formatDayRelative(session.start)},{' '}
                    {formatTime(session.start)}
                </span>
                <span className="text-muted-foreground">
                    {' '}
                    · {session.clientName}
                </span>
            </span>
            <ArrowRight
                aria-hidden="true"
                className="size-4.5 shrink-0 text-brand"
            />
        </button>
    );
}
