import { useId } from 'react';
import type { ReactNode } from 'react';

/** Pill of "Il tuo obiettivo", "Discipline" and "Su di te": black when chosen. */
export const pillClassName =
    'h-10 min-w-0 gap-1.5 rounded-full border bg-card px-3.5 text-sm font-medium text-foreground first:rounded-full last:rounded-full hover:bg-secondary hover:text-foreground data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90';

/** A question of "Completa il tuo profilo": its label, a hint on the right and the answers. */
export function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <span id={labelId} className="text-sm font-semibold">
                    {label}
                </span>
                {hint && (
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {hint}
                    </span>
                )}
            </div>
            {children(labelId)}
        </div>
    );
}
