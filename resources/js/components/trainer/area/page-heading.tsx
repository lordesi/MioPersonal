import type { ReactNode } from 'react';

type PageHeadingProps = {
    title: string;
    description?: ReactNode;
    /** Optional control on the right, e.g. a button or a search box. */
    action?: ReactNode;
};

/** Title row shared by the pages of the trainer area. */
export default function PageHeading({
    title,
    description,
    action,
}: PageHeadingProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
                <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
