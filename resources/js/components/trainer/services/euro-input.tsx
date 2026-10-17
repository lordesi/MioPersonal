import { useState } from 'react';
import type { ComponentProps } from 'react';
import { MAX_PRICE_CENTS } from '@/components/onboarding/trainer/draft';
import { cn } from '@/lib/utils';

type EuroInputProps = Omit<
    ComponentProps<'input'>,
    'value' | 'onChange' | 'type'
> & {
    /** Whole cents; null = empty. */
    value: number | null;
    onChange: (cents: number | null) => void;
};

/** "45,5" or "45.50" → 4550; null for an empty field or text that isn't a price. */
function toCents(text: string): number | null {
    if (!/^\d+([.,]\d{0,2})?$/.test(text)) {
        return null;
    }

    return Math.round(Number(text.replace(',', '.')) * 100);
}

/** 4500 → "45", 4550 → "45,50". */
function toText(cents: number | null): string {
    if (cents === null) {
        return '';
    }

    return cents % 100 === 0
        ? String(cents / 100)
        : (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * A price in euros with "€" on the right: euros on screen, whole cents in
 * the state (as every price of the site). Up to 2 decimals and 10.000 €:
 * other text is not typed.
 */
export default function EuroInput({
    value,
    onChange,
    className,
    ...props
}: EuroInputProps) {
    // What is typed, e.g. "45," while the decimals are written.
    const [text, setText] = useState(() => toText(value));
    // A new value from outside (e.g. after saving) replaces what was typed.
    const shown = toCents(text) === value ? text : toText(value);

    return (
        <div
            className={cn(
                'flex h-10 items-center rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-aria-invalid:border-destructive',
                className,
            )}
        >
            <input
                {...props}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={props.placeholder ?? '0'}
                className="h-full w-full min-w-0 bg-transparent pr-1 pl-3 text-right text-base tabular-nums outline-none placeholder:text-muted-foreground"
                value={shown}
                onChange={(event) => {
                    const next = event.target.value.trim();

                    if (next === '') {
                        setText('');
                        onChange(null);

                        return;
                    }

                    const cents = toCents(next);

                    if (cents !== null && cents <= MAX_PRICE_CENTS) {
                        setText(next);
                        onChange(cents);
                    }
                }}
            />
            <span
                aria-hidden="true"
                className="pr-3 pl-0.5 text-sm text-muted-foreground"
            >
                €
            </span>
        </div>
    );
}
