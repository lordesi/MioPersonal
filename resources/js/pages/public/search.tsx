import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { trainerCard } from '@/components/mp/cards';
import FiltersSheet, { countFilters } from '@/components/mp/filters-sheet';
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
import { searchUrl } from '@/lib/search';
import type { ActiveFilters, SearchFilters, SearchOption } from '@/lib/search';
import type { CityWithCoordinates, SeoData, TrainerSummary } from '@/types';

/**
 * No trainer matches every filter: similar profiles, found leaving out
 * more and more filters (TrainerSearchController::suggestions).
 * some = at least one of the chosen disciplines and goals;
 * fewer-filters = also without name, price, availability, rating…;
 * city = every trainer of the city.
 */
type Suggestions = {
    step: 'some' | 'fewer-filters' | 'city';
    trainers: TrainerSummary[];
};

/** The filters the "fewer-filters" suggestions leave out, as in the sentence. */
const minorFilterNames: Partial<Record<keyof ActiveFilters, string>> = {
    nome: 'nome',
    prezzo: 'prezzo',
    disponibilita: 'disponibilità',
    data: 'data',
    fascia: 'fascia oraria',
    valutazione: 'valutazione',
    domicilio: 'a domicilio',
    preferiti: 'solo preferiti',
};

/** "a, b e c". */
const joinNames = (names: string[]) =>
    new Intl.ListFormat('it', { type: 'conjunction' }).format(names);

/** "Ordina": "pertinenza" = no sort in the URL, the server's own order. */
const sortOptions: {
    value: NonNullable<ActiveFilters['ordina']> | 'pertinenza';
    label: string;
}[] = [
    { value: 'pertinenza', label: 'Pertinenza' },
    { value: 'slot', label: 'Primo slot' },
    { value: 'prezzo', label: 'Prezzo' },
    { value: 'valutazione', label: 'Valutazione' },
];

type SearchProps = {
    /** The city in the URL; null = all of Italy. */
    city: { slug: string; name: string } | null;
    /** Trainers of the current page. */
    trainers: TrainerSummary[];
    /** Trainers matching the filters, on every page. */
    total: number;
    pagination: { currentPage: number; lastPage: number };
    filters: ActiveFilters;
    /** Only when nothing matches; null if not even these. */
    suggestions: Suggestions | null;
    disciplines: SearchOption[];
    /** With their center, for "Usa la mia posizione". */
    cities: CityWithCoordinates[];
    seo: SeoData;
};

/**
 * The trainer search of the dark design: the four searches, "Cosa · Dove"
 * and "Filtri" on top, then the cards.
 */
export default function Search({
    city,
    trainers,
    total,
    pagination,
    filters,
    suggestions,
    disciplines,
    cities,
    seo,
}: SearchProps) {
    const { auth } = usePage().props;
    const [filtersOpen, setFiltersOpen] = useState(false);
    const isClient = auth?.user?.role === 'client';

    const place = city ? `a ${city.name}` : 'in Italia';
    const { nome, ordina, ...sheetFilters } = filters;

    /** Reloads the page with the new filters, back to page 1. */
    const visit = (next: SearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            searchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    /** `nextCity` left out = same city. */
    const changeFilters = (changes: SearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    // Back to all of Italy, keeping only the sort order.
    const resetFilters = () => visit({ ordina }, null);

    /** "Cosa · Dove · Cerca": a discipline, or words of the name. */
    const search = ({ what, words, city: nextCity }: WhatWhereResult) =>
        changeFilters(
            { disciplina: what ? [what] : [], nome: words },
            nextCity,
        );

    const disciplineLabel = (slug: string) =>
        disciplines.find((discipline) => discipline.value === slug)?.label;
    // "Cosa" shows the one discipline chosen, or the name searched.
    const initialWhat =
        filters.disciplina.length === 1
            ? {
                  text: disciplineLabel(filters.disciplina[0]) ?? '',
                  value: filters.disciplina[0],
              }
            : { text: nome ?? '', value: null };

    /** The cards with the heart (for clients and guests). */
    const trainerGrid = (list: TrainerSummary[]) => (
        <ResultsGrid items={list} itemKey={(trainer) => trainer.href}>
            {(trainer) => (
                <SaveableCard
                    {...trainerCard(trainer)}
                    slug={trainer.slug}
                    favoriteKind="trainer"
                    saved={trainer.favorite ?? false}
                />
            )}
        </ResultsGrid>
    );

    /** Under "Nessun trainer…": why the profiles below are there. */
    const emptyHint = (() => {
        switch (suggestions?.step) {
            case 'some':
                return `Nessuno fa tutto quello che hai scelto ${place}: questi profili ne fanno almeno una parte.`;
            case 'fewer-filters': {
                const left = Object.entries(minorFilterNames)
                    .filter(([name]) => filters[name as keyof ActiveFilters])
                    .map(([, name]) => name as string);

                return `Questi profili sono simili, ma senza ${left.length === 1 ? 'il filtro' : 'i filtri'} ${joinNames(left)}.`;
            }
            case 'city':
                return `Nessuno ${place} fa quello che hai scelto: ecco gli altri trainer ${place}.`;
            default:
                return 'Prova a togliere un filtro o ad allargare la zona.';
        }
    })();

    return (
        <>
            <Head title={seo.title} />

            <SearchTop
                kind="trainer"
                city={city}
                what={{
                    label: 'Cerca personal trainer',
                    placeholder: 'Disciplina o nome del trainer',
                    mobilePlaceholder: 'Nome, disciplina o città',
                    options: disciplines,
                }}
                cities={cities}
                initialWhat={initialWhat}
                searchKey={`${nome}-${city?.slug}-${filters.disciplina.join()}`}
                onSearch={search}
                onCity={(slug) => changeFilters({}, slug)}
                filterCount={countFilters(sheetFilters)}
                onOpenFilters={() => setFiltersOpen(true)}
            />

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-4 px-4 pt-4 pb-16 md:gap-6 md:px-8 md:pt-6">
                <ResultsHeader
                    title={
                        total === 1
                            ? `1 personal trainer ${place}`
                            : `${total} personal trainer ${place}`
                    }
                    sort={
                        <SortMenu
                            options={sortOptions}
                            value={ordina ?? 'pertinenza'}
                            onChange={(value) =>
                                changeFilters({
                                    ordina:
                                        value === 'pertinenza' ? null : value,
                                })
                            }
                        />
                    }
                />

                {trainers.length > 0 ? (
                    <>
                        {trainerGrid(trainers)}
                        <SearchPagination
                            {...pagination}
                            mergeProp="trainers"
                            pageUrl={(pagina) =>
                                searchUrl({ ...filters, pagina }, city?.slug)
                            }
                        />
                    </>
                ) : (
                    <>
                        <EmptyResults
                            title="Nessun trainer con questi filtri"
                            hint={emptyHint}
                            onReset={resetFilters}
                        />
                        {suggestions && (
                            <SuggestionsSection
                                id="suggestions-title"
                                title="Profili simili"
                            >
                                {trainerGrid(suggestions.trainers)}
                            </SuggestionsSection>
                        )}
                    </>
                )}
            </div>

            <FiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={sheetFilters}
                disciplines={disciplines}
                showFavorites={isClient}
                onApply={(next) => visit({ ...next, nome, ordina })}
            />
        </>
    );
}
