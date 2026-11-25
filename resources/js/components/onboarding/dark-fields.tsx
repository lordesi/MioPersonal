import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { timeOptions } from '@/components/onboarding/gym/draft';
import { cn } from '@/lib/utils';

/*
 * The pieces of the dark sign-ups ("Registra la palestra", "Diventa
 * trainer"): the fields of the design system (56px, grey outline, turquoise
 * while typing).
 */

/** A field: 56px, on the card color. */
export const pillFieldClassName =
    'h-14 w-full min-w-0 rounded-[14px] border border-input bg-card px-4 text-[17px] text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-0 aria-invalid:border-destructive disabled:opacity-100 md:h-14 md:text-[17px]';

/** A box with an icon and an input inside (the outline is on the box). */
export const pillBoxClassName =
    'flex h-14 items-center gap-2.5 rounded-[14px] border border-input bg-card px-4 text-foreground focus-within:border-brand has-[[aria-invalid=true]]:border-destructive';

/** The input inside a pillBox. */
export const pillInnerClassName =
    'h-11 w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] text-foreground outline-none placeholder:text-muted-foreground';

export const fieldLabelClassName =
    'text-[15px] leading-5 font-semibold tracking-[-0.23px]';

/** "facoltativo" next to a label or a title. */
export function Optional({ children = 'facoltativo' }: { children?: string }) {
    return (
        <span className="text-[13px] font-normal tracking-normal text-muted-foreground">
            {children}
        </span>
    );
}

/** A block of a step: "Il referente", "Dove si trova", "Orari di apertura". */
export function Section({
    title,
    description,
    aside,
    hideTitle = false,
    children,
    className,
}: {
    title: ReactNode;
    /** Only for screen readers (the design shows the fields alone). */
    hideTitle?: boolean;
    description?: ReactNode;
    /** On the right of the title, e.g. "2 scelti". */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    const id = useId();

    return (
        <section
            aria-labelledby={id}
            className={cn('flex flex-col gap-3', className)}
        >
            <div
                className={cn(
                    'flex flex-col gap-1 md:gap-0.5',
                    hideTitle && 'sr-only',
                )}
            >
                <div className="flex items-baseline justify-between gap-3">
                    <h2
                        id={id}
                        className="text-[17px] leading-5.5 font-semibold tracking-[-0.01em]"
                    >
                        {title}
                    </h2>
                    {aside}
                </div>
                {description && (
                    <p className="text-[13px] leading-4.5 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

/** A label, the control and its error. */
export function Field({
    label,
    error,
    children,
    className,
    labelClassName,
}: {
    label: ReactNode;
    error?: string;
    children: (ids: { id: string; describedBy?: string }) => ReactNode;
    className?: string;
    labelClassName?: string;
}) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className={cn('flex min-w-0 flex-col gap-2', className)}>
            <label
                htmlFor={id}
                className={cn(fieldLabelClassName, labelClassName)}
            >
                {label}
            </label>
            {children({ id, describedBy: error ? errorId : undefined })}
            <DarkError id={errorId} message={error} />
        </div>
    );
}

/** An error under a field, readable on black (InputError is red-600). */
export function DarkError({ id, message }: { id?: string; message?: string }) {
    return (
        <InputError
            id={id}
            message={message}
            className="text-[13px] leading-4.5 text-destructive"
        />
    );
}

/** An hour (every half hour unless `options` says otherwise): a native select, round, with an arrow. */
export function TimeSelect({
    value,
    onChange,
    label,
    from,
    options = timeOptions,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    /** Only the times after this one. */
    from?: string;
    /** The times to choose from, "HH:MM". */
    options?: string[];
    className?: string;
}) {
    return (
        <div className={cn('relative flex items-center', className)}>
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full min-w-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent pr-8.5 pl-4.5 text-[17px] font-semibold text-foreground tabular-nums shadow-[inset_0_0_0_1px_var(--field)] outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--brand)] md:h-11 md:text-[15px]"
            >
                {options
                    .filter((time) => from === undefined || time > from)
                    .map((time) => (
                        <option key={time} value={time}>
                            {time}
                        </option>
                    ))}
            </select>
            <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 size-4.5 text-muted-foreground"
            />
        </div>
    );
}
