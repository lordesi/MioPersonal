import { router } from '@inertiajs/react';
import { LayoutGrid, MapPin, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    availabilityOptions,
    modeItemClassName,
    modeTrackClassName,
} from '@/components/search/filter-bar';
import GymSearchBar from '@/components/search/gym-search-bar';
import SimpleSearchBar from '@/components/search/simple-search-bar';
import type { GymSearchChoices } from '@/components/search/gym-search-bar';
import SearchBar from '@/components/search/search-bar';
import type { CityChoice, SearchChoices } from '@/components/search/search-bar';
import { SearchKindToggle } from '@/components/search/search-kind-toggle';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { courseDayOptions, courseSearchUrl } from '@/lib/course';
import type { CourseDay } from '@/lib/course';
import { WHEN_OPTIONS } from '@/lib/events';
import { gymSearchUrl } from '@/lib/gym';
import { search as eventsSearch } from '@/routes/events';
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

const noGymChoices: GymSearchChoices = {
    servizi: [],
    city: null,
    prezzo: null,
};

const titles: Record<SearchKind, string> = {
    course: 'Pilates, yoga, spinning: trova il corso giusto.',
    event: 'Workshop e allenamenti di gruppo, vicino a te.',
    trainer: 'Trova il personal trainer giusto, vicino a te.',
    gym: 'Trova la palestra giusta, vicino a te.',
};

const hints: Record<SearchKind, string> = {
    trainer: 'Per guardare i profili non serve registrarsi',
    gym: 'Orari, abbonamenti, promozioni e i trainer che allenano lì',
    course: 'Gli orari della settimana delle palestre; per alcuni prenoti il posto qui',
    event: 'Prenoti il posto qui, paghi sul posto',
};

type HeroSearchProps = {
    /** From the catalog (App\Support\CatalogOptions). */
    disciplines: CatalogOption[];
    /** With their center: "Usa la mia posizione". */
    cities: CityChoice[];
    /** "Servizi" of the gyms (App\Enums\GymAmenity). */
    amenities: CatalogOption[];
    /** The kinds of events (App\Enums\GroupSessionType). */
    eventTypes: CatalogOption[];
};

/**
 * Dark home hero, right under the dark header: "Trainer | Palestre | Corsi |
 * Eventi", the headline, the search bar of the chosen kind and, for
 * trainers, the mode switch.
 */
export default function HeroSearch({
    disciplines,
    cities,
    amenities,
    eventTypes,
}: HeroSearchProps) {
    const [kind, setKind] = useState<SearchKind>('trainer');
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

    const searchGyms = ({ servizi, city, prezzo }: GymSearchChoices) =>
        router.get(gymSearchUrl({ servizi, prezzo }, city));

    const searchCourses = ({
        disciplina,
        city,
        giorno,
    }: Record<string, string | null>) =>
        router.get(
            courseSearchUrl(
                { disciplina, giorno: giorno as CourseDay | null },
                city,
            ),
        );

    const searchEvents = ({
        city,
        quando,
        tipo,
    }: Record<string, string | null>) =>
        router.get(
            eventsSearch.url(city ? { city } : undefined, {
                query: Object.fromEntries(
                    Object.entries({ quando, tipo }).filter(
                        ([, value]) => value,
                    ),
                ),
            }),
        );

    const cityField = {
        name: 'city',
        label: 'Dove',
        title: 'Scegli una città',
        noneLabel: 'Tutta Italia',
        options: cities,
        searchPlaceholder: 'Cerca una città',
    };

    const bars: Record<SearchKind, { label: string; bar: ReactNode }> = {
        trainer: {
            label: 'Cerca un personal trainer',
            bar: (
                <SearchBar
                    variant="hero"
                    disciplines={disciplines}
                    cities={cities}
                    availabilityOptions={availabilityOptions}
                    applied={noChoices}
                    onSearch={search}
                />
            ),
        },
        gym: {
            label: 'Cerca una palestra',
            bar: (
                <GymSearchBar
                    variant="hero"
                    amenities={amenities}
                    cities={cities}
                    applied={noGymChoices}
                    onSearch={searchGyms}
                />
            ),
        },
        course: {
            label: 'Cerca un corso',
            bar: (
                <SimpleSearchBar
                    key="course"
                    cities={cities}
                    onSearch={searchCourses}
                    fields={[
                        {
                            name: 'disciplina',
                            label: 'Cosa',
                            title: 'Quale corso cerchi?',
                            noneLabel: 'Tutti i corsi',
                            options: disciplines,
                            searchPlaceholder: 'Cerca una disciplina',
                        },
                        cityField,
                        {
                            name: 'giorno',
                            label: 'Quando',
                            title: 'Che giorno?',
                            noneLabel: 'Qualsiasi giorno',
                            options: courseDayOptions,
                        },
                    ]}
                />
            ),
        },
        event: {
            label: 'Cerca un evento',
            bar: (
                <SimpleSearchBar
                    key="event"
                    cities={cities}
                    onSearch={searchEvents}
                    fields={[
                        cityField,
                        {
                            name: 'quando',
                            label: 'Quando',
                            title: 'Quando?',
                            noneLabel: 'Tutte le date',
                            options: WHEN_OPTIONS,
                        },
                        {
                            name: 'tipo',
                            label: 'Tipo',
                            title: 'Che tipo di evento?',
                            noneLabel: 'Tutti i tipi',
                            options: eventTypes,
                        },
                    ]}
                />
            ),
        },
    };

    return (
        <section
            aria-labelledby="hero-title"
            className="bg-primary text-primary-foreground"
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-18">
                <div className="flex flex-col gap-6">
                    <SearchKindToggle value={kind} onChange={setKind} />
                    <h1
                        id="hero-title"
                        className="max-w-195 text-[34px] leading-[40px] font-bold tracking-[-0.03em] md:text-[56px] md:leading-[60px]"
                    >
                        {titles[kind]}
                    </h1>
                </div>

                <div className="flex flex-col gap-5">
                    <div role="search" aria-label={bars[kind].label}>
                        {bars[kind].bar}
                    </div>

                    <div className="flex flex-col items-center gap-3.5">
                        {kind === 'trainer' && (
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
                        )}
                        <p className="text-center text-[13px] leading-[18px] text-primary-foreground/70">
                            {hints[kind]}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
