import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = {
    value: T;
    label: string;
};

type SegmentedControlProps<T extends string> = {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    className?: string;
};

/**
 * Side-by-side options in a grey track, one always selected,
 * e.g. "Tutte / In presenza / Online" or "Settimana / Mese".
 */
export default function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className,
    ...aria
}: SegmentedControlProps<T>) {
    return (
        <div
            role="group"
            {...aria}
            className={cn(
                'flex h-11 gap-0.5 rounded-lg bg-muted p-0.75 md:h-10',
                className,
            )}
        >
            {options.map((option) => (
                <Toggle
                    key={option.value}
                    pressed={option.value === value}
                    onPressedChange={() => onChange(option.value)}
                    className="h-full flex-1 rounded-md px-3 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                >
                    {option.label}
                </Toggle>
            ))}
        </div>
    );
}
