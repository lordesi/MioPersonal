import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
    /** For screen readers: "Cosa cerchi". */
    label: string;
    options: readonly Option<T>[];
    value: T;
    onValueChange: (value: T) => void;
    /**
     * white: the chosen one is white with dark text (search).
     * brand: the chosen one has a turquoise outline and text (forms, e.g. "Sei" of Contatti).
     */
    tone?: 'white' | 'brand';
    className?: string;
};

/**
 * One choice among a few, side by side in a round track (design system
 * "SegmentedControl", white variant): the chosen one is white with dark
 * text, or (brand) outlined in turquoise. A radio group: the arrows move the choice, like the native radios.
 */
export default function SegmentedControl<T extends string>({
    label,
    options,
    value,
    onValueChange,
    tone = 'white',
    className,
}: SegmentedControlProps<T>) {
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);

    const move = (event: KeyboardEvent, index: number) => {
        const step = {
            ArrowRight: 1,
            ArrowDown: 1,
            ArrowLeft: -1,
            ArrowUp: -1,
        }[event.key];

        if (step === undefined) {
            return;
        }

        event.preventDefault();
        const next = (index + step + options.length) % options.length;
        onValueChange(options[next].value);
        buttons.current[next]?.focus();
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'flex w-full gap-0.5 rounded-full',
                tone === 'white'
                    ? 'p-1 shadow-[inset_0_0_0_1px_var(--field)]'
                    : 'p-0.5 shadow-[inset_0_0_0_1px_var(--border)]',
                className,
            )}
        >
            {options.map((option, index) => {
                const checked = option.value === value;

                return (
                    <button
                        key={option.value}
                        ref={(element) => {
                            buttons.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onValueChange(option.value)}
                        onKeyDown={(event) => move(event, index)}
                        className={cn(
                            'min-w-0 flex-1 truncate rounded-full px-3 text-[15px] text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            tone === 'white'
                                ? 'min-h-9 font-semibold aria-checked:bg-foreground aria-checked:text-background aria-checked:shadow-[0_2px_6px_0_rgba(0,0,0,0.3)]'
                                : 'min-h-10 font-normal aria-checked:font-semibold aria-checked:text-brand aria-checked:shadow-[inset_0_0_0_1.5px_var(--brand)]',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
