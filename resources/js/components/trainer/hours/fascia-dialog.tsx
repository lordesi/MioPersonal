import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { darkOverlayClassName } from '@/components/mp/dark-dialog';
import WheelPicker, {
    labelMinutes,
    timeOptions,
} from '@/components/mp/wheel-picker';
import { formatHours } from '@/lib/format';
import type { HourRange } from '@/lib/hours';
import { FIRST_MINUTE, LAST_MINUTE, STEP, timeLabel } from '@/lib/hours';
import { cn } from '@/lib/utils';

export const WEEKDAYS = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];

const LETTERS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** "Dalle": every half hour, 06:00–23:30. */
const START_OPTIONS = timeOptions(FIRST_MINUTE, LAST_MINUTE - STEP, STEP);

/** The range being added (index null) or changed, and the day it was opened from. */
export type FasciaEditing = {
    day: number;
    index: number | null;
    range: HourRange;
};

/**
 * "Nuova fascia" (design "Trainer · Fascia · nuovo"): the days, the wheels
 * "Dalle" and "Alle", the length, "Annulla" and "Aggiungi fascia". A sheet
 * from the bottom on phones, a window in the middle on desktop. A range
 * already there ("Modifica fascia") changes only its own day.
 */
export default function FasciaDialog({
    editing,
    disabledDays = [],
    onClose,
    onSave,
}: {
    editing: FasciaEditing;
    /** Days that can't change (already past, in "Per settimana"). */
    disabledDays?: number[];
    onClose: () => void;
    onSave: (range: HourRange, days: number[]) => void;
}) {
    const [range, setRange] = useState(editing.range);
    const [days, setDays] = useState([editing.day]);
    const adding = editing.index === null;
    const endOptions = timeOptions(range.start + STEP, LAST_MINUTE, STEP);

    return (
        <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(darkOverlayClassName, 'bg-black/60')}
                />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="theme-dark fixed inset-x-0 bottom-0 z-50 flex flex-col gap-5.5 rounded-t-[28px] bg-card px-4 pt-2.5 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-foreground shadow-[0_-20px_60px_rgba(0,0,0,0.6)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:top-1/2 md:bottom-auto md:left-1/2 md:w-110 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:p-6 md:shadow-[0_30px_80px_rgba(0,0,0,0.7)] md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95"
                >
                    <span
                        aria-hidden="true"
                        className="h-1.25 w-10 self-center rounded-full bg-[#3a3d42] md:hidden"
                    />
                    <div className="flex items-center justify-between">
                        <DialogPrimitive.Title className="text-[22px] font-bold tracking-[-0.02em]">
                            {adding ? 'Nuova fascia' : 'Modifica fascia'}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close
                            aria-label="Chiudi"
                            className="flex size-9 items-center justify-center rounded-full bg-[#1c1e21] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <X aria-hidden="true" className="size-4.5" />
                        </DialogPrimitive.Close>
                    </div>

                    {adding && (
                        <div className="flex flex-col gap-2.5">
                            <span className="text-[13px] font-semibold text-muted-foreground">
                                GIORNI
                            </span>
                            <div className="grid grid-cols-7 gap-1.5">
                                {LETTERS.map((letter, day) => {
                                    const on = days.includes(day);

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            aria-label={WEEKDAYS[day]}
                                            aria-pressed={on}
                                            disabled={disabledDays.includes(
                                                day,
                                            )}
                                            onClick={() =>
                                                setDays(
                                                    on
                                                        ? days.filter(
                                                              (other) =>
                                                                  other !== day,
                                                          )
                                                        : [...days, day],
                                                )
                                            }
                                            className={cn(
                                                'h-11 w-full rounded-xl text-[15px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-35',
                                                on
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-[#1c1e21] text-foreground',
                                            )}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <WheelPicker
                            label="Dalle"
                            options={START_OPTIONS}
                            value={timeLabel(range.start)}
                            onChange={(value) => {
                                const start = labelMinutes(value);
                                setRange({
                                    start,
                                    end: Math.min(
                                        start + (range.end - range.start),
                                        LAST_MINUTE,
                                    ),
                                });
                            }}
                        />
                        <span
                            aria-hidden="true"
                            className="mt-[94px] text-[22px] text-muted-foreground"
                        >
                            –
                        </span>
                        <WheelPicker
                            label="Alle"
                            options={endOptions}
                            value={timeLabel(range.end)}
                            onChange={(value) =>
                                setRange({ ...range, end: labelMinutes(value) })
                            }
                        />
                    </div>

                    <p className="text-center text-[15px] font-semibold text-brand">
                        {formatHours((range.end - range.start) / 60)}
                    </p>

                    <div className="flex gap-2 pt-1">
                        <DialogPrimitive.Close className="h-12 rounded-full px-5 text-base font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                            Annulla
                        </DialogPrimitive.Close>
                        <button
                            type="button"
                            disabled={days.length === 0}
                            onClick={() => onSave(range, days)}
                            className="h-12 flex-1 rounded-full bg-primary text-base font-bold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                        >
                            {adding ? 'Aggiungi fascia' : 'Salva fascia'}
                        </button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
