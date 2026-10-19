import type { ReactNode } from 'react';

type PageHeadingProps = {
    title: string;
    /** Small line above the title, e.g. the date in "Panoramica". */
    eyebrow?: ReactNode;
    description?: ReactNode;
    /** Optional controls on the right, e.g. buttons or a search box. */
    action?: ReactNode;
};

/** Title row shared by the pages of the trainer area. */
export default function PageHeading({
    title,
    eyebrow,
    description,
    action,
}: PageHeadingProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
                {eyebrow && (
                    <span className="text-sm font-medium text-muted-foreground">
                        {eyebrow}
                    </span>
                )}
                <h1 className="text-[28px] leading-8.5 font-bold tracking-[-0.03em] md:text-[34px] md:leading-10">
                    {title}
                </h1>
                {description && (
                    <p className="text-[15px] leading-5.5 text-muted-foreground tabular-nums">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
