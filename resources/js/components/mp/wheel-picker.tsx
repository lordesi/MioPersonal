import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/** Height of one row of the wheel, in px: five rows are in view. */
const ROW = 36;
const VISIBLE = 5;

export type WheelOption = { value: string; label: string };

type WheelPickerProps = {
    /** "Dalle", "Inizio": above the wheel and for screen readers. */
    label: string;
    options: WheelOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
};

/**
 * The iOS-style wheel of the designs ("Nuova fascia", "Scegli l’ora"): the
 * rows snap, the one in the grey band in the middle is chosen. Arrow keys,
 * Home/End and a click on a row work too.
 */
export default function WheelPicker({
    label,
    options,
    value,
    onChange,
    className,
}: WheelPickerProps) {
    const labelId = useId();
    const list = useRef<HTMLDivElement>(null);
    const settle = useRef<number | undefined>(undefined);
    const index = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    );

    const placed = useRef(false);
    // Only a scroll the user started is a choice: the wheel also moves by
    // itself (a new value, or the snap kept on its row when the options change).
    const touched = useRef(false);
    const first = options[0]?.value;

    // The chosen row in the band: at once when the wheel appears, then with
    // a glide when the value or the options change.
    useEffect(() => {
        const element = list.current;

        if (element && element.scrollTop !== index * ROW) {
            element.scrollTo({
                top: index * ROW,
                behavior: placed.current ? 'smooth' : 'instant',
            });
        }

        placed.current = true;
    }, [index, first]);

    useEffect(() => () => window.clearTimeout(settle.current), []);

    const choose = (next: number) => {
        const option = options[Math.min(Math.max(next, 0), options.length - 1)];

        if (option && option.value !== value) {
            onChange(option.value);
        }
    };

    const touch = () => {
        touched.current = true;
    };

    // When the wheel stops after the user moved it, the row in the band is the choice.
    const onScroll = () => {
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => {
            if (!list.current || !touched.current) {
                return;
            }

            touched.current = false;
            choose(Math.round(list.current.scrollTop / ROW));
        }, 120);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        const moves: Record<string, number> = {
            ArrowUp: index - 1,
            ArrowDown: index + 1,
            PageUp: index - 4,
            PageDown: index + 4,
            Home: 0,
            End: options.length - 1,
        };

        if (event.key in moves) {
            event.preventDefault();
            choose(moves[event.key]);
        }
    };

    return (
        <div
            className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1.5',
                className,
            )}
        >
            <span
                id={labelId}
                className="text-[13px] font-semibold tracking-[0.4px] text-muted-foreground uppercase"
            >
                {label}
            </span>
            <div className="relative w-full">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 rounded-[10px] bg-white/10"
                    style={{ top: ROW * 2, height: ROW }}
                />
                <div
                    ref={list}
                    role="listbox"
                    tabIndex={0}
                    aria-labelledby={labelId}
                    aria-activedescendant={`${labelId}-${index}`}
                    onScroll={onScroll}
                    onWheel={touch}
                    onTouchStart={touch}
                    onPointerDown={touch}
                    onKeyDown={onKeyDown}
                    className="relative snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-[10px] outline-none [overflow-anchor:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
                    style={{
                        height: ROW * VISIBLE,
                        paddingBlock: ROW * 2,
                        maskImage:
                            'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
                    }}
                >
                    {options.map((option, position) => {
                        const distance = Math.abs(position - index);

                        return (
                            <div
                                key={option.value}
                                id={`${labelId}-${position}`}
                                role="option"
                                aria-selected={position === index}
                                onClick={() => choose(position)}
                                className={cn(
                                    'flex cursor-pointer snap-center items-center justify-center tabular-nums select-none',
                                    distance === 0
                                        ? 'text-[22px] font-semibold text-foreground'
                                        : distance === 1
                                          ? 'text-[19px] text-muted-foreground'
                                          : 'text-[17px] text-[#585858]',
                                )}
                                style={{ height: ROW }}
                            >
                                {option.label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/** "HH:MM" every `step` minutes from `from` to `to` (both in minutes, `to` included). */
export function timeOptions(
    from: number,
    to: number,
    step: number,
): WheelOption[] {
    const options: WheelOption[] = [];

    for (let minutes = from; minutes <= to; minutes += step) {
        const label = minutesLabel(minutes);
        options.push({ value: label, label });
    }

    return options;
}

/** 450 → "07:30"; 1440 → "24:00". */
export function minutesLabel(minutes: number): string {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "07:30" → 450. */
export function labelMinutes(label: string): number {
    const [hours, minutes] = label.split(':').map(Number);

    return hours * 60 + minutes;
}
