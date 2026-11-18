import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type PanelProps = Omit<ComponentProps<'section'>, 'title'> & {
    /** Heading of the card; it also names the section for screen readers. */
    title?: ReactNode;
    /** 'lg' for the main cards (Agenda), 'md' for the side ones. */
    titleSize?: 'md' | 'lg';
    /** Optional link or button on the right of the title. */
    action?: ReactNode;
};

/**
 * The card of the client and gym areas (docs/design): border, 20 px
 * corners. In the trainer area it is the dark card of "Diventa trainer".
 */
export default function Panel({
    title,
    titleSize = 'md',
    action,
    className,
    children,
    ...props
}: PanelProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={title ? titleId : undefined}
            className={cn(
                'flex flex-col gap-4 rounded-[20px] border bg-card p-5 md:p-6',
                // The trainer area: a card of "Diventa trainer", no outline.
                'in-[.trainer-area]:rounded-[26px] in-[.trainer-area]:border-0 md:in-[.trainer-area]:rounded-[20px] md:in-[.trainer-area]:bg-transparent md:in-[.trainer-area]:shadow-[inset_0_0_0_1px_var(--border)]',
                className,
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between gap-3">
                    {title && (
                        <h2
                            id={titleId}
                            className={cn(
                                'font-semibold',
                                titleSize === 'lg'
                                    ? 'text-xl tracking-[-0.02em]'
                                    : 'text-[17px] leading-6 in-[.trainer-area]:text-xl in-[.trainer-area]:tracking-[-0.45px]',
                            )}
                        >
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
