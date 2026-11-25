import { Award } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TrainerProfile } from '@/types';

/** A section of the profile: 22px title on phones, 28px on desktop. */
export function ProfileBlock({
    id,
    anchor,
    title,
    description,
    children,
    className,
}: {
    /** The title's id. */
    id: string;
    /** The section's id, for the links: "#abbonamenti". */
    anchor?: string;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            id={anchor}
            aria-labelledby={id}
            className={cn(
                'flex scroll-mt-6 flex-col gap-3 md:gap-4',
                className,
            )}
        >
            <h2
                id={id}
                className="text-[22px] leading-7 font-bold md:text-[28px] md:leading-8.5"
            >
                {title}
            </h2>
            {description && (
                <p className="-mt-1 text-[15px] text-muted-foreground">
                    {description}
                </p>
            )}
            {children}
        </section>
    );
}

/** "Certificazioni": the award in a turquoise circle, the title and who issued it. */
export function CertificationsList({
    certifications,
}: Pick<TrainerProfile, 'certifications'>) {
    return (
        <ProfileBlock id="certifications-title" title="Certificazioni">
            <ul className="flex flex-col gap-3 md:gap-4">
                {certifications.map((certification) => (
                    <li
                        key={`${certification.title}-${certification.issuer}`}
                        className="flex items-center gap-3 md:gap-4"
                    >
                        <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-black md:size-11 md:rounded-[14px]"
                        >
                            <Award className="size-5" />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-[17px] font-semibold">
                                {certification.title}
                            </span>
                            {certification.issuer && (
                                <span className="text-[13px] text-muted-foreground md:text-sm">
                                    {certification.issuer}
                                </span>
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </ProfileBlock>
    );
}
