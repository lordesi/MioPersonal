import { Building2, House, Trees, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ProfileSection from '@/components/profile/profile-section';
import { cn } from '@/lib/utils';
import type { TrainerProfile, TrainingPlace } from '@/types';

/** The 4 options, always shown in this order: the missing ones are "Non disponibile". */
const options: {
    type: TrainingPlace['type'];
    title: string;
    icon: LucideIcon;
}[] = [
    { type: 'online', title: 'Online', icon: Video },
    { type: 'studio', title: 'Studio o palestra', icon: Building2 },
    { type: 'home', title: 'A domicilio', icon: House },
    { type: 'park', title: "All'aperto", icon: Trees },
];

type TrainingPlacesProps = Pick<TrainerProfile, 'places' | 'online'> & {
    trainerFirstName: string;
};

/** "Dove alleno": online, studio, at home and outdoors, side by side. */
export default function TrainingPlaces({
    places,
    online,
    trainerFirstName,
}: TrainingPlacesProps) {
    // Only who trains online alone gets a line under the title.
    const description =
        online === 'only'
            ? `${trainerFirstName} allena solo online: puoi prenotare da qualsiasi città.`
            : undefined;

    /** What the card says under the title; null = not offered. */
    const detail = (type: TrainingPlace['type']): string | null => {
        const rows = places.filter((place) => place.type === type);

        if (rows.length === 0) {
            return null;
        }

        if (type === 'online') {
            return 'Il link arriva con la conferma';
        }

        // Every studio: "Studio Fit, Milano, via Roma 1".
        return rows
            .map((place) =>
                type === 'studio'
                    ? [place.title, place.detail].filter(Boolean).join(', ')
                    : place.detail,
            )
            .join(' · ');
    };

    return (
        <ProfileSection
            titleId="places-title"
            title="Dove alleno"
            description={description}
        >
            <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {options.map(({ type, title, icon: Icon }) => {
                    const text = detail(type);
                    const available = text !== null;

                    return (
                        <li
                            key={type}
                            className={cn(
                                'flex flex-col gap-3.5 rounded-[18px] border p-4',
                                available
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-dashed border-ring/60 bg-muted/50 text-muted-foreground',
                            )}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        'flex size-9.5 items-center justify-center rounded-xl',
                                        available
                                            ? 'bg-primary-foreground/10'
                                            : 'bg-muted',
                                    )}
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                </span>
                                {available && (
                                    <span className="inline-flex h-5.5 items-center rounded-full bg-primary-foreground px-2 text-[11px] leading-3.5 font-bold text-primary">
                                        Disponibile
                                    </span>
                                )}
                            </span>
                            <span className="flex min-w-0 flex-col gap-0.5 break-words">
                                <span className="text-[15px] leading-[22px] font-semibold">
                                    {title}
                                </span>
                                <span
                                    className={cn(
                                        'text-[13px] leading-[18px]',
                                        available
                                            ? 'text-primary-foreground/60'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {text ?? 'Non disponibile'}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </ProfileSection>
    );
}
