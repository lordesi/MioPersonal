import { useId } from 'react';
import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { useFieldValidation } from '@/hooks/use-field-validation';

type FormFieldProps = {
    label: string;
    /** Short help under the field, e.g. the password criteria. */
    hint?: ReactNode;
    /** From the server; wins over the message of the browser check. */
    error?: string;
    /** Something on the right of the label, e.g. "Password dimenticata?". */
    labelAside?: ReactNode;
    /** Fields with a character limit: "42/60" under the field, on the right. */
    counter?: { length: number; max: number };
    /** Receives the ids to put on the input. */
    children: (ids: { id: string; describedBy?: string }) => ReactNode;
};

/**
 * Label, input, hint and validation error, wired together for screen readers.
 * Empty required fields and wrong emails get an Italian message here instead
 * of the browser bubble.
 */
export default function FormField({
    label,
    hint,
    error: serverError,
    labelAside,
    counter,
    children,
}: FormFieldProps) {
    const id = useId();
    const browserError = useFieldValidation(id);
    const error = serverError ?? browserError;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy =
        [hint && hintId, error && errorId].filter(Boolean).join(' ') ||
        undefined;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
                <Label htmlFor={id}>{label}</Label>
                {labelAside}
            </div>
            {children({ id, describedBy })}
            {(hint || counter) && (
                <div className="flex items-start justify-between gap-3">
                    {hint ? (
                        <div
                            id={hintId}
                            className="text-xs text-muted-foreground"
                        >
                            {hint}
                        </div>
                    ) : (
                        <span />
                    )}
                    {counter && (
                        // Not a live region: screen readers would read it at every key.
                        <span className="flex-none text-xs text-muted-foreground tabular-nums">
                            {counter.length}/{counter.max}
                        </span>
                    )}
                </div>
            )}
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
