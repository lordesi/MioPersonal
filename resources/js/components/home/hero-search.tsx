import { router } from '@inertiajs/react';
import { LayoutGrid, MapPin, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
    availabilityOptions,
    modeItemClassName,
    modeTrackClassName,
} from '@/components/search/filter-bar';
import SearchBar from '@/components/search/search-bar';
import type { SearchChoices } from '@/components/search/search-bar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type Mode = 'tutte' | 'presenza' | 'online';

const modes: { value: Mode; label: string; icon: LucideIcon }[] = [
    { value: 'tutte', label: 'Tutte', icon: LayoutGrid },
    { value: 'presenza', label: 'In presenza', icon: MapPin },
    { value: 'online', label: 'Online', icon: Video },
];

/** Nothing chosen yet: "Tutte le discipline", "Tutta Italia", "Qualsiasi giorno". */
const noChoices: SearchChoices = {
    disciplina: [],
    city: null,
    disponibilita: null,
};

type HeroSearchProps = {
    /** From the catalog (App\Support\CatalogOptions). */
    disciplines: CatalogOption[];
    cities: CatalogOption[];
};

/**
 * Dark home hero, right under the dark header: headline, the
 * "Cosa · Dove · Quando" bar and the mode switch.
 */
export default function HeroSearch({ disciplines, cities }: HeroSearchProps) {
    const [mode, setMode] = useState<Mode>('tutte');

    const search = ({ disciplina, city, disponibilita }: SearchChoices) =>
        router.get(
            searchUrl(
                {
                    disciplina,
                    disponibilita,
                    modalita: mode === 'tutte' ? null : mode,
                },
                city,
            ),
        );

    return (
        <section
            aria-labelledby="hero-title"
            className="bg-primary text-primary-foreground"
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-18">
                <h1
                    id="hero-title"
                    className="max-w-195 text-[38px] leading-[42px] font-bold tracking-[-0.03em] md:text-[56px] md:leading-[60px]"
                >
                    Trova il personal trainer giusto, vicino a te.
                </h1>

                <div className="flex flex-col gap-5">
                    <div role="search" aria-label="Cerca un personal trainer">
                        <SearchBar
                            variant="hero"
                            disciplines={disciplines}
                            cities={cities}
                            availabilityOptions={availabilityOptions}
                            applied={noChoices}
                            onSearch={search}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-3.5">
                        <ToggleGroup
                            type="single"
                            aria-label="Modalità"
                            value={mode}
                            // Clicking the chosen option again gives '': keep it.
                            onValueChange={(value) =>
                                value && setMode(value as Mode)
                            }
                            className={cn(modeTrackClassName, 'max-w-150')}
                        >
                            {modes.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    className={cn(
                                        modeItemClassName,
                                        'h-11 px-4 text-[15px]',
                                    )}
                                >
                                    <option.icon aria-hidden="true" />
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                        <p className="text-center text-[13px] leading-[18px] text-primary-foreground/70">
                            Gratis per chi si allena · per guardare i profili
                            non serve registrarsi
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
