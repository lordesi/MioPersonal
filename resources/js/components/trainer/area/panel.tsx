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
 * The white card of the trainer area (docs/design): border, 20 px corners.
 * Every page puts its content in one or more of these.
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
                                    : 'text-[17px] leading-6',
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
