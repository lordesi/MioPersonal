import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils';

type ProfileSectionProps = {
    /** For aria-labelledby: the id of the title. */
    titleId: string;
    title: string;
    /** Under the title, e.g. "Alessandro allena solo online…". */
    description?: ReactNode;
    /** Next to the title, on the right (e.g. the duration). */
    aside?: ReactNode;
    /** For the links to the section (#prenota, #recensioni). */
    id?: string;
    /** "Mostra meno" scrolls back to the top of the reviews. */
    ref?: Ref<HTMLElement>;
    children: ReactNode;
    className?: string;
};

/** A white card of the profile: "Chi sono", "Scegli uno slot", "Recensioni"… */
export default function ProfileSection({
    titleId,
    title,
    description,
    aside,
    id,
    ref,
    children,
    className,
}: ProfileSectionProps) {
    return (
        <section
            ref={ref}
            id={id}
            aria-labelledby={titleId}
            className={cn(
                'flex scroll-mt-6 flex-col gap-4 rounded-3xl border bg-card p-4 md:gap-4.5 md:p-6',
                className,
            )}
        >
            <div className="flex flex-wrap items-end justify-between gap-2.5">
                <div className="flex flex-col gap-0.5">
                    <h2
                        id={titleId}
                        className="text-[22px] leading-7 font-bold tracking-[-0.02em]"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {aside}
            </div>
            {children}
        </section>
    );
}
