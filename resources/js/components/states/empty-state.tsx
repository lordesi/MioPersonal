import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description?: string;
    /** Always offer a way out, e.g. a "Rimuovi filtri" button. */
    action?: ReactNode;
    /** 'error' is announced immediately to screen readers. */
    tone?: 'default' | 'error';
    /** Dashed border, as in the empty search results. */
    bordered?: boolean;
    headingLevel?: 'h2' | 'h3';
    className?: string;
};

/** Empty or error state: icon, title, short explanation and one action. */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    tone = 'default',
    bordered = false,
    headingLevel: Heading = 'h2',
    className,
}: EmptyStateProps) {
    return (
        <div
            role={tone === 'error' ? 'alert' : undefined}
            className={cn(
                'flex flex-col items-center gap-3 text-center',
                bordered
                    ? 'rounded-xl border border-dashed px-5 py-12 md:px-6 md:py-16'
                    : 'px-2 py-4',
                className,
            )}
        >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon aria-hidden="true" className="size-5" />
            </span>
            <Heading className="text-xl font-semibold tracking-tight">
                {title}
            </Heading>
            {description && (
                <p className="max-w-105 text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
