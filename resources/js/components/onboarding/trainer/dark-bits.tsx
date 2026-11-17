import { Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import EuroInput from '@/components/trainer/services/euro-input';
import { Switch } from '@/components/ui/switch';
import { darkSwitchClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';

/*
 * The small pieces of the dark "Diventa trainer" (design "Diventa
 * trainer"): cards, the dashed "Aggiungi", the round price field, the
 * switch with its text. The fields are in onboarding/dark-fields.
 */

/** "1 di 5", "0 di 3" on the right of a title. */
export function Counter({ children }: { children: ReactNode }) {
    return (
        <span className="shrink-0 text-[13px] leading-4.5 text-muted-foreground tabular-nums">
            {children}
        </span>
    );
}

/** A dark card: #1c1c1c, round corners. */
export function DarkCard({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-[26px] bg-card p-4 md:rounded-[20px] md:p-5',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** A box with a dashed line: the optional extras ("Pacchetti"). */
export const dashedBoxClassName =
    'flex flex-col gap-3 rounded-[20px] border border-dashed border-border p-4 md:p-5';

/** "+ Aggiungi un tipo di seduta": a round dashed button. */
export function AddButton({
    children,
    className,
    ...props
}: Omit<ComponentProps<'button'>, 'type'>) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-field text-[15px] font-semibold outline-none hover:border-brand hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40',
                className,
            )}
        >
            <Plus aria-hidden="true" className="size-4.5" />
            {children}
        </button>
    );
}

/** The bin of a card, 44px to touch. */
export function DeleteButton({
    label,
    onClick,
    disabled,
    className,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                '-m-3 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40',
                className,
            )}
        >
            <Trash2 aria-hidden="true" className="size-5" />
        </button>
    );
}

/** A price in euros in a round field, "€" on the right. */
export function EuroField({
    className,
    ...props
}: ComponentProps<typeof EuroInput>) {
    return (
        <EuroInput
            {...props}
            className={cn(
                'h-13 rounded-full border-0 bg-transparent pr-2 pl-3 shadow-[inset_0_0_0_1px_var(--field)] focus-within:border-0 focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)] focus-within:ring-0 has-aria-invalid:shadow-[inset_0_0_0_1.5px_var(--destructive)] md:h-12.5 [&_input]:text-[17px] [&>span]:text-[17px]',
                className,
            )}
        />
    );
}

/** A title, a grey line under it and the switch on the right. */
export function SwitchRow({
    title,
    description,
    checked,
    onCheckedChange,
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
}) {
    const id = useId();

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <span className="flex flex-1 flex-col gap-0.5">
                <label
                    htmlFor={id}
                    className="text-[17px] leading-5.5 font-semibold"
                >
                    {title}
                </label>
                {description && (
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                className={darkSwitchClassName}
            />
        </div>
    );
}

/** A row of choices as chips (single or multiple, aria-pressed). */
export function ChipRow<T extends string | number>({
    label,
    options,
    isOn,
    onToggle,
    isDisabled,
    className,
}: {
    /** For screen readers, e.g. "Durate". */
    label: string;
    options: { value: T; label: string }[];
    isOn: (value: T) => boolean;
    onToggle: (value: T) => void;
    isDisabled?: (value: T) => boolean;
    className?: string;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className={cn('flex flex-wrap gap-2', className)}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={isOn(option.value)}
                    disabled={isDisabled?.(option.value)}
                    onClick={() => onToggle(option.value)}
                    className="chip disabled:opacity-40"
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
