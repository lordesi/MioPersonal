import type { PreviewRow } from '@/components/trainer/services/pricing';
import {
    stepListClassName,
    stepRowClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';

/**
 * The services as the profile will show them, one row each ("Così ti
 * vedono i clienti" in "Servizi e prezzi"), as the lists of "Diventa trainer".
 */
export function ServiceRows({
    rows,
    empty,
}: {
    rows: PreviewRow[];
    /** Shown while there is no row; without it, nothing is shown. */
    empty?: string;
}) {
    if (rows.length === 0) {
        return empty ? (
            <p className="text-[15px] text-muted-foreground">{empty}</p>
        ) : null;
    }

    return (
        <ul className={stepListClassName}>
            {rows.map((row) => (
                <li
                    key={row.key}
                    className={cn(
                        stepRowClassName,
                        'flex items-start justify-between gap-3',
                    )}
                >
                    <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[17px] leading-5.5 font-semibold break-words">
                                {row.name}
                            </span>
                            {row.badge && (
                                <span className="inline-flex h-5.5 items-center rounded-full px-2 text-[11px] font-bold text-brand tabular-nums shadow-[inset_0_0_0_1px_var(--brand)]">
                                    {row.badge}
                                </span>
                            )}
                        </span>
                        <span className="text-[13px] leading-4.5 break-words text-muted-foreground tabular-nums">
                            {row.meta}
                        </span>
                    </span>
                    <span className="flex-none text-[17px] leading-6 font-semibold tabular-nums">
                        {row.price}
                    </span>
                </li>
            ))}
        </ul>
    );
}
