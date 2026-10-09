import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AdminPanelProps = {
    title?: string;
    /** Small grey text on the right of the title, e.g. "Ultimi 14 giorni". */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
};

/** White box with an optional title, the building block of the admin pages. */
export default function AdminPanel({
    title,
    aside,
    children,
    className,
}: AdminPanelProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={title ? titleId : undefined}
            className={cn(
                'flex flex-col gap-3 rounded-[14px] border bg-card p-5',
                className,
            )}
        >
            {(title || aside) && (
                <div className="flex items-baseline justify-between gap-3">
                    {title && (
                        <h2 id={titleId} className="font-semibold">
                            {title}
                        </h2>
                    )}
                    {aside && (
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                            {aside}
                        </span>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}
