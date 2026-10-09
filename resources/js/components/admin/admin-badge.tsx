import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variants = {
    /** Strong: "Approvato", "Nuovo", "Confermata". */
    solid: 'bg-primary text-primary-foreground',
    /** Neutral: "Modifiche richieste", "Svolta", "Attivo". */
    outline: 'border border-input',
    /** Waiting: "In revisione", "In attesa", "In corso". */
    dashed: 'border border-dashed border-foreground',
    /** Closed or off: "Rifiutato", "Decaduta", "Sospeso". */
    muted: 'bg-muted text-muted-foreground',
    /** Needs a look: "⚠ Contiene un numero di telefono". */
    warning: 'border-[1.5px] border-foreground',
} as const;

export type AdminBadgeVariant = keyof typeof variants;

/** Round status label of the admin tables and lists. */
export default function AdminBadge({
    variant = 'outline',
    children,
    className,
}: {
    variant?: AdminBadgeVariant;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-5.5 items-center gap-1 self-start rounded-full px-2 text-xs font-semibold whitespace-nowrap',
                variants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
