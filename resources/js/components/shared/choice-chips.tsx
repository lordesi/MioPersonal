import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

/** Pill look, also for single chips outside a group (e.g. "Viene a domicilio"). */
export const chipClassName =
    'h-9 rounded-full border border-input bg-background px-3.5 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90';

export type ChoiceOption<T extends string> = {
    value: T;
    label: string;
};

type BaseProps<T extends string> = {
    options: ChoiceOption<T>[];
    'aria-label'?: string;
    'aria-labelledby'?: string;
    className?: string;
};

type SingleProps<T extends string> = BaseProps<T> & {
    multiple?: false;
    value: T | null;
    onChange: (value: T) => void;
};

type MultipleProps<T extends string> = BaseProps<T> & {
    multiple: true;
    value: T[];
    onChange: (value: T[]) => void;
};

/**
 * Row of pill buttons with aria-pressed, e.g. "Modalità", "Discipline".
 * Single choice by default; pass `multiple` to allow more than one.
 */
export default function ChoiceChips<T extends string>(
    props: SingleProps<T> | MultipleProps<T>,
) {
    const { options, className } = props;

    const isSelected = (value: T) =>
        props.multiple ? props.value.includes(value) : props.value === value;

    const toggle = (value: T) => {
        if (!props.multiple) {
            props.onChange(value);

            return;
        }

        props.onChange(
            props.value.includes(value)
                ? props.value.filter((v) => v !== value)
                : [...props.value, value],
        );
    };

    return (
        <div
            role="group"
            aria-label={props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            className={cn('flex flex-wrap gap-2', className)}
        >
            {options.map((option) => (
                <Toggle
                    key={option.value}
                    pressed={isSelected(option.value)}
                    onPressedChange={() => toggle(option.value)}
                    className={chipClassName}
                >
                    {option.label}
                </Toggle>
            ))}
        </div>
    );
}
