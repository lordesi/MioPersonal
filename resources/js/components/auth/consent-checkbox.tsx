import { useId } from 'react';
import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useFieldValidation } from '@/hooks/use-field-validation';

type ConsentCheckboxProps = {
    name: string;
    children: ReactNode;
    error?: string;
    required?: boolean;
    /** Controlled mode, for forms that keep their own state. */
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

/** Checkbox with a long label that can contain links (Terms, Privacy). */
export default function ConsentCheckbox({
    name,
    children,
    error: serverError,
    required,
    checked,
    onCheckedChange,
}: ConsentCheckboxProps) {
    const id = useId();
    const errorId = `${id}-error`;
    // "Spunta la casella per continuare." instead of the browser bubble.
    const browserError = useFieldValidation(id);
    const error = serverError ?? browserError;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-2.5 text-sm">
                <Checkbox
                    id={id}
                    name={name}
                    value="1"
                    required={required}
                    aria-invalid={!!serverError}
                    aria-describedby={error ? errorId : undefined}
                    className="mt-0.5"
                    {...(checked !== undefined && {
                        checked,
                        onCheckedChange: (value) =>
                            onCheckedChange?.(value === true),
                    })}
                />
                <label htmlFor={id}>{children}</label>
            </div>
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
