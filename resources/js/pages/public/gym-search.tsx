import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, Heart, Search as SearchIcon, Tag } from 'lucide-react';
import { useState } from 'react';
import GymCard from '@/components/gym/gym-card';
import ActiveFilters from '@/components/search/active-filters';
import type { ActiveChip } from '@/components/search/active-filters';
import {
    pillClassName,
    pillOff,
    pillOn,
} from '@/components/search/filter-options';
import { FilterPill } from '@/components/search/filter-pill';
import FilterSheet from '@/components/search/filter-sheet';
import GymSearchBar from '@/components/search/gym-search-bar';
import NameSearch from '@/components/search/name-search';
import OptionsMenu from '@/components/search/options-menu';
import SearchPageHeader from '@/components/search/search-page-header';
import SearchPagination from '@/components/search/search-pagination';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { saveFavorite } from '@/hooks/use-favorite';
import type { GymPriceRange, GymSearchFilters } from '@/lib/gym';
import { gymPriceOptions, gymSearchUrl, gymSortOptions } from '@/lib/gym';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import type {
    CatalogOption,
    CityWithCoordinates,
    GymSummary,
    SeoData,
} from '@/types';

/** Every filter of the page: null (or [] for the services) = not set. */
type Filters = {
    nome: string | null;
    servizi: string[];
    prezzo: GymPriceRange | null;
    promo: '1' | null;
    preferiti: '1' | null;
    ordina: 'prezzo' | 'trainer' | null;
};

/** No gym matches: fewer-filters = without name, budget and promo; city = all of the city. */
type Suggestions = {
    step: 'fewer-filters' | 'city';
    gyms: GymSummary[];
};

type GymSearchProps = {
    city: { slug: string; name: string } | null;
    gyms: GymSummary[];
    total: number;
    pagination: { currentPage: number; lastPage: number };
    filters: Filters;
    suggestions: Suggestions | null;
    amenities: CatalogOption[];
    cities: CityWithCoordinates[];
    seo: SeoData;
};

/** The pills that the "Filtri" panel replaces on phones. */
const desktopOnly = 'hidden md:inline-flex';

function labelOf<T>(
    options: readonly { value: T; label: string }[],
    value: T | null,
): string | undefined {
    return options.find((option) => option.value === value)?.label;
}

/** "Palestre a Milano": /palestre/milano, or /palestre for all of Italy. */
export default function GymSearch({
    city,
    gyms,
    total,
    pagination,
    filters,
    suggestions,
    amenities,
    cities,
    seo,
}: GymSearchProps) {
    const { auth } = usePage().props;
    // The hearts changed on this page; the others come from the server.
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    // Trainers, gyms and admins have no favorites: no heart for them.
    const canSave = !auth?.user || auth.user.role === 'client';

    const place = city ? `a ${city.name}` : 'in Italia';

    const toggleFavorite = (slug: string, pressed: boolean) => {
        if (!auth?.user) {
            router.visit(login());

            return;
        }

        setSaved((current) => ({ ...current, [slug]: pressed }));
        saveFavorite(
            slug,
            pressed,
            () => setSaved((current) => ({ ...current, [slug]: !pressed })),
            'gym',
        );
    };

    const visit = (next: GymSearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            gymSearchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const change = (changes: GymSearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    const reset = () => visit({ ordina: filters.ordina }, null);

    const priceLabel = labelOf(gymPriceOptions, filters.prezzo);
    const sortLabel = labelOf(gymSortOptions, filters.ordina) ?? 'In evidenza';
    const amenityLabels = filters.servizi.map((value) =>
        labelOf(amenities, value),
    );
    const amenityLabel =
        amenityLabels.length > 1
            ? `${amenityLabels[0]} +${amenityLabels.length - 1}`
            : amenityLabels[0];

    const chips: ActiveChip[] = [];
    const addChip = (
        name: string,
        label: string | undefined,
        onClear: () => void,
    ) => {
        if (label) {
            chips.push({ name, label, onClear });
        }
    };

    addChip('nome', filters.nome ? `Nome: “${filters.nome}”` : undefined, () =>
        change({ nome: null }),
    );
    filters.servizi.forEach((value) =>
        addChip(`servizi-${value}`, labelOf(amenities, value), () =>
            change({
                servizi: filters.servizi.filter((item) => item !== value),
            }),
        ),
    );
    addChip('citta', city?.name, () => change({}, null));
    addChip('prezzo', priceLabel, () => change({ prezzo: null }));
    addChip('promo', filters.promo ? 'Con promozioni' : undefined, () =>
        change({ promo: null }),
    );
    addChip('preferiti', filters.preferiti ? 'Solo preferiti' : undefined, () =>
        change({ preferiti: null }),
    );

    /** The cards with the heart (for clients and guests). */
    const grid = (list: GymSummary[]) => (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
            {list.map((gym) => (
                <li key={gym.href} className="flex">
                    <GymCard
                        gym={gym}
                        className="flex-1"
                        favorite={
                            canSave
                                ? {
                                      pressed:
                                          saved[gym.slug] ??
                                          gym.favorite ??
                                          false,
                                      onPressedChange: (pressed) =>
                                          toggleFavorite(gym.slug, pressed),
                                  }
                                : undefined
                        }
                    />
                </li>
            ))}
        </ul>
    );

    return (
        <>
            <Head title={seo.title} />

            <SearchPageHeader
                kind="gym"
                city={city}
                title={`Palestre ${place}`}
                count={total === 1 ? '1 palestra' : `${total} palestre`}
            >
                {/* Phones: city and "Filtri" above the results instead. */}
                <div
                    role="search"
                    aria-label="Cerca una palestra"
                    className="hidden max-w-245 md:block"
                >
                    <GymSearchBar
                        variant="hero"
                        key={`${filters.servizi.join(',')}|${city?.slug}|${filters.prezzo}`}
                        amenities={amenities}
                        cities={cities}
                        applied={{
                            servizi: filters.servizi,
                            city: city?.slug ?? null,
                            prezzo: filters.prezzo,
                        }}
                        onSearch={({ servizi, prezzo, city: nextCity }) =>
                            change({ servizi, prezzo }, nextCity)
                        }
                    />
                </div>
            </SearchPageHeader>

            <div className="flex-1 bg-muted">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4.5 px-4 pt-6 pb-16 md:px-8">
                    <div className="flex flex-col gap-4.5">
                        <div
                            role="group"
                            aria-label="Filtri"
                            className="flex flex-wrap items-center gap-2.5"
                        >
                            <NameSearch
                                applied={filters.nome}
                                onSearch={(nome) => change({ nome })}
                                className="w-full sm:w-60"
                            />
                            <FilterPill
                                label="Città"
                                noneLabel="Tutta Italia"
                                options={cities}
                                value={city?.slug ?? null}
                                onChange={(next) => change({}, next)}
                                searchPlaceholder="Cerca una città"
                                className="md:hidden"
                            />
                            <FilterSheet
                                total={total}
                                noun={{ one: 'palestra', many: 'palestre' }}
                                onClear={() =>
                                    change({
                                        servizi: [],
                                        prezzo: null,
                                        promo: null,
                                        preferiti: null,
                                    })
                                }
                                fields={[
                                    {
                                        kind: 'multi',
                                        id: 'sheet-amenities',
                                        title: 'Servizi',
                                        options: amenities,
                                        value: filters.servizi,
                                        onChange: (servizi) =>
                                            change({ servizi }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-price',
                                        title: 'Budget mensile',
                                        noneLabel: 'Qualsiasi',
                                        options: gymPriceOptions,
                                        value: filters.prezzo,
                                        onChange: (prezzo) =>
                                            change({
                                                prezzo: prezzo as GymPriceRange | null,
                                            }),
                                    },
                                    {
                                        kind: 'toggle',
                                        id: 'sheet-promo',
                                        title: 'Con promozioni',
                                        checked: filters.promo !== null,
                                        onChange: (on) =>
                                            change({ promo: on ? '1' : null }),
                                    },
                                    ...(canSave
                                        ? [
                                              {
                                                  kind: 'toggle' as const,
                                                  id: 'sheet-favorites',
                                                  title: `Solo preferiti (${auth?.favoriteCounts?.gyms ?? 0})`,
                                                  checked:
                                                      filters.preferiti !==
                                                      null,
                                                  onChange: (on: boolean) =>
                                                      auth?.user
                                                          ? change({
                                                                preferiti: on
                                                                    ? '1'
                                                                    : null,
                                                            })
                                                          : router.visit(
                                                                login(),
                                                            ),
                                              },
                                          ]
                                        : []),
                                ]}
                            />
                            <OptionsMenu
                                label="Servizi"
                                noneLabel="Tutti i servizi"
                                options={amenities}
                                multiple
                                value={filters.servizi}
                                onChange={(servizi) => change({ servizi })}
                                searchPlaceholder="Cerca un servizio"
                                trigger={
                                    <button
                                        type="button"
                                        aria-label={`Servizi: ${amenityLabel ?? 'tutti'}`}
                                        className={cn(
                                            pillClassName,
                                            amenityLabel ? pillOn : pillOff,
                                            desktopOnly,
                                        )}
                                    >
                                        {amenityLabel ?? 'Servizi'}
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </button>
                                }
                            />
                            <OptionsMenu
                                label="Budget mensile"
                                noneLabel="Qualsiasi prezzo"
                                options={gymPriceOptions}
                                value={filters.prezzo}
                                onChange={(prezzo) => change({ prezzo })}
                                trigger={
                                    <button
                                        type="button"
                                        aria-label={`Budget mensile: ${priceLabel ?? 'qualsiasi'}`}
                                        className={cn(
                                            pillClassName,
                                            priceLabel ? pillOn : pillOff,
                                            desktopOnly,
                                        )}
                                    >
                                        {priceLabel ?? 'Budget'}
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </button>
                                }
                            />
                            <Toggle
                                pressed={filters.promo !== null}
                                onPressedChange={(pressed) =>
                                    change({ promo: pressed ? '1' : null })
                                }
                                className={cn(
                                    pillClassName,
                                    filters.promo ? pillOn : pillOff,
                                    desktopOnly,
                                )}
                            >
                                <Tag aria-hidden="true" className="size-4" />
                                Con promozioni
                            </Toggle>
                            {canSave && (
                                <Toggle
                                    pressed={filters.preferiti !== null}
                                    onPressedChange={(on) =>
                                        auth?.user
                                            ? change({
                                                  preferiti: on ? '1' : null,
                                              })
                                            : router.visit(login())
                                    }
                                    className={cn(
                                        pillClassName,
                                        pillOff,
                                        desktopOnly,
                                        'group data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90',
                                    )}
                                >
                                    <Heart
                                        aria-hidden="true"
                                        className="size-3.5 fill-current"
                                    />
                                    Preferiti
                                    <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-bold text-foreground tabular-nums group-data-[state=on]:bg-primary-foreground group-data-[state=on]:text-primary">
                                        {auth?.favoriteCounts?.gyms ?? 0}
                                    </span>
                                </Toggle>
                            )}
                            <OptionsMenu
                                label="Ordina"
                                noneLabel="In evidenza"
                                options={gymSortOptions}
                                value={filters.ordina}
                                onChange={(ordina) => change({ ordina })}
                                align="end"
                                trigger={
                                    <button
                                        type="button"
                                        aria-label={`Ordina: ${sortLabel}`}
                                        className={cn(
                                            pillClassName,
                                            pillOff,
                                            'ml-auto',
                                        )}
                                    >
                                        Ordina: {sortLabel}
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </button>
                                }
                            />
                        </div>
                        <ActiveFilters chips={chips} onClearAll={reset} />
                    </div>

                    {gyms.length > 0 ? (
                        <>
                            {grid(gyms)}
                            <SearchPagination
                                {...pagination}
                                label="Pagine delle palestre"
                                moreLabel="Carica altre palestre"
                                pageUrl={(pagina) =>
                                    gymSearchUrl(
                                        { ...filters, pagina },
                                        city?.slug,
                                    )
                                }
                            />
                        </>
                    ) : (
                        <>
                            <div
                                role="status"
                                className="flex flex-wrap items-center gap-3.5 rounded-2xl border bg-card px-4 py-3.5 sm:px-5"
                            >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <SearchIcon
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                                    <h2 className="text-base leading-6 font-semibold">
                                        Nessuna palestra con questi filtri
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {suggestions?.step === 'city'
                                            ? `Nessuna palestra ${place} ha tutti i servizi scelti: ecco le altre palestre ${place}.`
                                            : suggestions
                                              ? 'Queste palestre sono simili, ma senza nome, budget e promozioni.'
                                              : 'Prova a togliere un filtro o ad allargare la zona.'}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={reset}
                                    className="h-10 rounded-xl px-4 font-semibold"
                                >
                                    Cancella i filtri
                                </Button>
                            </div>

                            {suggestions && (
                                <section
                                    aria-labelledby="suggestions-title"
                                    className="flex flex-col gap-3.5"
                                >
                                    <h2
                                        id="suggestions-title"
                                        className="text-lg leading-6.5 font-semibold"
                                    >
                                        Palestre simili
                                    </h2>
                                    {grid(suggestions.gyms)}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
