import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type NumberedSectionProps = Omit<ComponentProps<'section'>, 'title'> & {
    /** The step in the black circle: 1, 2, 3… or an icon. */
    step: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    /** Optional sections have a grey circle instead of a black one. */
    optional?: boolean;
    /** On the right of the title, e.g. "1 di 3". */
    action?: ReactNode;
};

/**
 * A white card with its number, title and description: the steps of
 * "Disponibilità e regole" and "Servizi e prezzi" (docs/design).
 */
export default function NumberedSection({
    step,
    title,
    description,
    optional = false,
    action,
    className,
    children,
    ...props
}: NumberedSectionProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className={cn(
                'flex flex-col gap-5 rounded-3xl border bg-card p-5 md:p-6',
                className,
            )}
            {...props}
        >
            <div className="flex gap-3.5">
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-8 flex-none items-center justify-center rounded-full text-sm font-bold tabular-nums [&>svg]:size-4',
                        optional
                            ? 'bg-secondary text-foreground'
                            : 'bg-foreground text-background',
                    )}
                >
                    {step}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                    <h2
                        id={titleId}
                        className="text-[19px] leading-6.5 font-bold tracking-[-0.02em]"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {action && <div className="flex-none self-start">{action}</div>}
            </div>
            {children}
        </section>
    );
}
