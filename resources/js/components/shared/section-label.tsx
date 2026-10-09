import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionLabelProps = {
    children: ReactNode;
    as?: 'h2' | 'h3' | 'p' | 'span';
    id?: string;
    className?: string;
};

/**
 * Small uppercase label above a group ("Prossime", "Riepilogo", "Il tuo slot").
 * Write the text in normal case: the uppercase comes from CSS, so screen
 * readers don't spell it letter by letter.
 */
export default function SectionLabel({
    children,
    as: Tag = 'h2',
    id,
    className,
}: SectionLabelProps) {
    return (
        <Tag
            id={id}
            className={cn(
                'text-xs leading-4 font-semibold tracking-[0.08em] text-muted-foreground uppercase',
                className,
            )}
        >
            {children}
        </Tag>
    );
}
