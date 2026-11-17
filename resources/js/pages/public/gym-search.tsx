import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { gymCard } from '@/components/mp/cards';
import GymFiltersSheet, {
    countGymFilters,
} from '@/components/mp/gym-filters-sheet';
import SaveableCard from '@/components/mp/saveable-card';
import {
    EmptyResults,
    ResultsGrid,
    ResultsHeader,
    SortMenu,
    SuggestionsSection,
} from '@/components/mp/search-results';
import SearchTop from '@/components/mp/search-top';
import type { WhatWhereResult } from '@/components/mp/what-where-search';
import SearchPagination from '@/components/search/search-pagination';
import type { GymPriceRange, GymSearchFilters } from '@/lib/gym';
import { gymSearchUrl, gymSortOptions } from '@/lib/gym';
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

/** "Ordina": no value in the URL = "In evidenza", the server's own order. */
const sortOptions = [
    { value: 'evidenza', label: 'In evidenza' },
    ...gymSortOptions,
] as const;

/**
 * "Palestre a Milano" (/palestre/milano, or /palestre for all of Italy), in
 * the dark design of the trainer search: "Cosa" is a service or words of
 * the gym's name.
 */
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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const isClient = auth?.user?.role === 'client';

    const place = city ? `a ${city.name}` : 'in Italia';
    const { nome, ordina, ...sheetFilters } = filters;

    /** Reloads the page with the new filters, back to page 1. */
    const visit = (next: GymSearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            gymSearchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    /** `nextCity` left out = same city. */
    const change = (changes: GymSearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    // Back to all of Italy, keeping only the sort order.
    const reset = () => visit({ ordina }, null);

    /** "Cosa · Dove · Cerca": a service, or words of the name. */
    const search = ({ what, words, city: nextCity }: WhatWhereResult) =>
        change({ servizi: what ? [what] : [], nome: words }, nextCity);

    // "Cosa" shows the one service chosen, or the name searched.
    const initialWhat =
        filters.servizi.length === 1
            ? {
                  text:
                      amenities.find(
                          (amenity) => amenity.value === filters.servizi[0],
                      )?.label ?? '',
                  value: filters.servizi[0],
              }
            : { text: nome ?? '', value: null };

    /** The cards with the heart (for clients and guests). */
    const grid = (list: GymSummary[]) => (
        <ResultsGrid items={list} itemKey={(gym) => gym.href}>
            {(gym) => (
                <SaveableCard
                    {...gymCard(gym)}
                    slug={gym.slug}
                    favoriteKind="gym"
                    saved={gym.favorite ?? false}
                />
            )}
        </ResultsGrid>
    );

    return (
        <>
            <Head title={seo.title} />

            <SearchTop
                kind="gym"
                city={city}
                what={{
                    label: 'Cerca palestre',
                    placeholder: 'Servizio o nome della palestra',
                    mobilePlaceholder: 'Nome, servizio o città',
                    options: amenities,
                }}
                cities={cities}
                initialWhat={initialWhat}
                searchKey={`${nome}-${city?.slug}-${filters.servizi.join()}`}
                onSearch={search}
                onCity={(slug) => change({}, slug)}
                filterCount={countGymFilters(sheetFilters)}
                onOpenFilters={() => setFiltersOpen(true)}
            />

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-4 px-4 pt-4 pb-16 md:gap-6 md:px-8 md:pt-6">
                <ResultsHeader
                    title={
                        total === 1
                            ? `1 palestra ${place}`
                            : `${total} palestre ${place}`
                    }
                    sort={
                        <SortMenu
                            options={sortOptions}
                            value={ordina ?? 'evidenza'}
                            onChange={(value) =>
                                change({
                                    ordina: value === 'evidenza' ? null : value,
                                })
                            }
                        />
                    }
                />

                {gyms.length > 0 ? (
                    <>
                        {grid(gyms)}
                        <SearchPagination
                            {...pagination}
                            mergeProp="gyms"
                            moreLabel="Carica altre palestre"
                            label="Pagine delle palestre"
                            pageUrl={(pagina) =>
                                gymSearchUrl({ ...filters, pagina }, city?.slug)
                            }
                        />
                    </>
                ) : (
                    <>
                        <EmptyResults
                            title="Nessuna palestra con questi filtri"
                            hint={
                                suggestions?.step === 'city'
                                    ? `Nessuna palestra ${place} ha tutti i servizi scelti: ecco le altre palestre ${place}.`
                                    : suggestions
                                      ? 'Queste palestre sono simili, ma senza nome, budget e promozioni.'
                                      : 'Prova a togliere un filtro o ad allargare la zona.'
                            }
                            onReset={reset}
                        />
                        {suggestions && (
                            <SuggestionsSection
                                id="suggestions-title"
                                title="Palestre simili"
                            >
                                {grid(suggestions.gyms)}
                            </SuggestionsSection>
                        )}
                    </>
                )}
            </div>

            <GymFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={sheetFilters}
                amenities={amenities}
                showFavorites={isClient}
                onApply={(next) => visit({ ...next, nome, ordina })}
            />
        </>
    );
}
