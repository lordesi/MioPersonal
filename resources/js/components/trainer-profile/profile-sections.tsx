import { Award, House, Trees, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BuildingIcon } from '@/components/mp/icons';
import { cn } from '@/lib/utils';
import type { TrainerProfile, TrainingPlace } from '@/types';

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

/** The 4 places, always in this order: the missing ones are "Non disponibile". */
const placeOptions: {
    type: TrainingPlace['type'];
    title: string;
    icon: LucideIcon | typeof BuildingIcon;
}[] = [
    // Gyms of MioPersonal and private studios share the card.
    { type: 'studio', title: 'In palestra o studio', icon: BuildingIcon },
    { type: 'home', title: 'A domicilio', icon: House },
    { type: 'online', title: 'Online', icon: Video },
    { type: 'park', title: "All'aperto", icon: Trees },
];

/** "Dove alleno": 2×2 cards, turquoise when offered, dashed when not. */
export function PlacesGrid({
    places,
    online,
    trainerFirstName,
}: Pick<TrainerProfile, 'places' | 'online'> & { trainerFirstName: string }) {
    /** What the card says under the title; null = not offered. */
    const detail = (type: TrainingPlace['type']): string | null => {
        const rows = places.filter(
            (place) =>
                place.type === type ||
                (type === 'studio' && place.type === 'gym'),
        );

        if (rows.length === 0) {
            return null;
        }

        if (type === 'online') {
            return 'Il link arriva con la conferma';
        }

        // Every gym and studio: "FitLab, Via Roma 1, 20121 Milano".
        return rows
            .map((place) =>
                type === 'studio'
                    ? [place.title, place.detail].filter(Boolean).join(', ')
                    : place.detail,
            )
            .join(' · ');
    };

    return (
        <ProfileBlock
            id="places-title"
            title="Dove alleno"
            description={
                online === 'only'
                    ? `${trainerFirstName} allena solo online: puoi prenotare da qualsiasi città.`
                    : undefined
            }
        >
            <ul className="grid grid-cols-2 gap-2 md:gap-4">
                {placeOptions.map(({ type, title, icon: Icon }) => {
                    const text = detail(type);
                    const available = text !== null;

                    return (
                        <li
                            key={type}
                            className={cn(
                                'flex flex-col gap-2.5 rounded-[20px] p-4 md:flex-row md:items-center md:gap-4 md:p-5',
                                available
                                    ? 'border border-brand'
                                    : 'border border-dashed border-border text-muted-foreground',
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-full md:size-11 md:rounded-[14px]',
                                    available
                                        ? 'text-brand shadow-[inset_0_0_0_1px_var(--brand)]'
                                        : 'bg-muted',
                                )}
                            >
                                <Icon className="size-5" />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1 md:gap-0.5">
                                <span className="text-[15px] font-semibold md:text-[17px]">
                                    {title}
                                </span>
                                <span className="text-[13px] break-words text-muted-foreground md:text-sm">
                                    {text ?? 'Non disponibile'}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </ProfileBlock>
    );
}

/** "Certificazioni": one card each, the award in a turquoise ring. */
export function CertificationsList({
    certifications,
}: Pick<TrainerProfile, 'certifications'>) {
    return (
        <ProfileBlock id="certifications-title" title="Certificazioni">
            <ul className="flex flex-col gap-2 md:gap-3">
                {certifications.map((certification) => (
                    <li
                        key={`${certification.title}-${certification.issuer}`}
                        className="flex items-center gap-3 rounded-[26px] bg-card px-4 py-3.5 md:gap-4 md:rounded-[20px] md:border md:border-border md:bg-transparent md:p-5"
                    >
                        <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1px_var(--brand)] md:size-11 md:rounded-[14px]"
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
