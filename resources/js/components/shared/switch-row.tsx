import { useId } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SwitchRowProps = {
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
};

/** Setting with a title, an optional hint and an on/off switch. */
export default function SwitchRow({
    label,
    description,
    checked,
    onCheckedChange,
    disabled,
    className,
}: SwitchRowProps) {
    const descriptionId = useId();

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <span className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                {description && (
                    <span
                        id={descriptionId}
                        className="text-xs leading-4 text-muted-foreground"
                    >
                        {description}
                    </span>
                )}
            </span>
            <Switch
                aria-label={label}
                aria-describedby={description ? descriptionId : undefined}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className="data-[size=default]:h-6 data-[size=default]:w-10 [&>[data-slot=switch-thumb]]:size-5!"
            />
        </div>
    );
}
