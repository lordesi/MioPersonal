import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    pillClassName,
    pillOff,
    pillOn,
} from '@/components/search/filter-options';
import type { MenuOption } from '@/components/search/options-menu';
import OptionsMenu from '@/components/search/options-menu';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type FilterPillProps<T extends string> = {
    /** "Giorno": on the button while nothing is chosen, and for screen readers. */
    label: string;
    /** The first choice, without the filter, e.g. "Tutti i giorni". */
    noneLabel: string;
    options: MenuOption<T>[];
    value: T | null;
    onChange: (value: T | null) => void;
    /** Long lists, e.g. the cities. */
    searchPlaceholder?: string;
    align?: 'start' | 'end';
    /** "Ordina": always light, with "Ordina: …" on it. */
    sort?: boolean;
    className?: string;
};

/**
 * A filter of the searches as a pill opening its list: dark when a value is
 * chosen, with the value on it. Shared by the courses' and events' searches.
 */
export function FilterPill<T extends string>({
    label,
    noneLabel,
    options,
    value,
    onChange,
    searchPlaceholder,
    align,
    sort = false,
    className,
}: FilterPillProps<T>) {
    const chosen = options.find((option) => option.value === value)?.label;
    const text = sort ? `${label}: ${chosen ?? noneLabel}` : (chosen ?? label);

    return (
        <OptionsMenu
            label={label}
            noneLabel={noneLabel}
            options={options}
            value={value}
            onChange={onChange}
            searchPlaceholder={searchPlaceholder}
            align={align}
            trigger={
                <button
                    type="button"
                    aria-label={`${label}: ${chosen ?? noneLabel}`}
                    className={cn(
                        pillClassName,
                        chosen && !sort ? pillOn : pillOff,
                        className,
                    )}
                >
                    {text}
                    <ChevronDown aria-hidden="true" className="size-4" />
                </button>
            }
        />
    );
}

/** An on/off filter as a pill, e.g. "Prenoti online". */
export function TogglePill({
    pressed,
    onPressedChange,
    children,
    className,
}: {
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Toggle
            pressed={pressed}
            onPressedChange={onPressedChange}
            className={cn(pillClassName, pressed ? pillOn : pillOff, className)}
        >
            {children}
        </Toggle>
    );
}
