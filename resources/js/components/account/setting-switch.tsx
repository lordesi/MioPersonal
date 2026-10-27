import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingSwitchProps = {
    label: string;
    /** The help text, or the value that gets shared (e.g. the phone). */
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    icon?: LucideIcon;
    /** Dark border while on, as "Contatti per i clienti" in the design. */
    highlightOn?: boolean;
    disabled?: boolean;
};

/**
 * A card-shaped row of "Impostazioni account" with an on/off switch. The
 * whole row is the label, so a click anywhere moves the switch.
 */
export default function SettingSwitch({
    label,
    description,
    checked,
    onCheckedChange,
    icon: Icon,
    highlightOn = false,
    disabled,
}: SettingSwitchProps) {
    const id = useId();

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-center gap-3.5 rounded-2xl border bg-card px-4 py-3.5',
                highlightOn && checked && 'border-foreground',
                disabled && 'cursor-default opacity-60',
            )}
        >
            {Icon && (
                <span
                    aria-hidden="true"
                    className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-muted"
                >
                    <Icon className="size-4" />
                </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-[15px] leading-5.5 font-semibold">
                    {label}
                </span>
                <span
                    id={`${id}-description`}
                    className="truncate text-[13px] leading-4.5 text-muted-foreground tabular-nums"
                >
                    {description}
                </span>
            </span>
            <Switch
                id={id}
                aria-describedby={`${id}-description`}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                // 48 × 28 like the design; px-0.5 keeps the thumb 2 px from both ends.
                className="px-0.5 data-[size=default]:h-7 data-[size=default]:w-12 [&>[data-slot=switch-thumb]]:size-5.5!"
            />
        </label>
    );
}
