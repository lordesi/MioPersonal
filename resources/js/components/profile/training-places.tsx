import { Building2, House, Trees, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TrainingPlace } from '@/types';

const icons: Record<TrainingPlace['type'], LucideIcon> = {
    studio: Building2,
    home: House,
    park: Trees,
    online: Video,
};

/** "Dove ci alleniamo": cards on desktop, one bordered list on mobile. */
export default function TrainingPlaces({
    places,
}: {
    places: TrainingPlace[];
}) {
    return (
        <section aria-labelledby="places-title" className="flex flex-col gap-3">
            <h2
                id="places-title"
                className="text-xl font-semibold tracking-tight md:text-2xl"
            >
                Dove ci alleniamo
            </h2>
            <ul className="overflow-hidden rounded-xl border md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] md:gap-3 md:overflow-visible md:rounded-none md:border-0">
                {places.map((place) => {
                    const Icon = icons[place.type];

                    return (
                        <li
                            key={place.type}
                            className="flex items-center gap-3 border-t px-4 py-3.5 first:border-t-0 md:items-start md:rounded-xl md:border md:p-4 md:first:border-t"
                        >
                            <span className="flex shrink-0 items-center justify-center md:size-10 md:rounded-lg md:bg-secondary">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <span className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold">
                                    {place.title}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {place.detail}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
