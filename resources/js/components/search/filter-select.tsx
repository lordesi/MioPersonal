import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Radix Select doesn't accept '' as a value, so "no filter" uses this one. */
const NONE = 'none';

type FilterSelectProps<T extends string> = {
    id: string;
    label: string;
    /** Text of the "no filter" choice, e.g. "Tutte le discipline". */
    noneLabel: string;
    options: { value: T; label: string }[];
    value: T | null;
    onChange: (value: T | null) => void;
    /** Thicker border while a value is chosen. Off for "Ordina per". */
    highlight?: boolean;
    className?: string;
};

/** A search filter with its label above, e.g. "Disponibilità". */
export default function FilterSelect<T extends string>({
    id,
    label,
    noneLabel,
    options,
    value,
    onChange,
    highlight = true,
    className,
}: FilterSelectProps<T>) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <Label htmlFor={id}>{label}</Label>
            <Select
                value={value ?? NONE}
                onValueChange={(next) =>
                    onChange(next === NONE ? null : (next as T))
                }
            >
                <SelectTrigger
                    id={id}
                    className={cn(
                        'w-full bg-background max-md:data-[size=default]:h-11',
                        highlight &&
                            value !== null &&
                            'border-foreground ring-1 ring-foreground',
                    )}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE}>{noneLabel}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
