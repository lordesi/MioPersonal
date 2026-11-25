import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FiltersSheet, { countFilters } from '@/components/mp/filters-sheet';
import {
    EmptyResults,
    ResultsGrid,
    ResultsHeader,
    SortMenu,
    SuggestionsSection,
} from '@/components/mp/search-results';
import { FiltersButton } from '@/components/mp/search-top';
import TrainerCard from '@/components/mp/trainer-card';
import SearchPagination from '@/components/search/search-pagination';
import TrainerSearchBar from '@/components/search/trainer-search-bar';
import type { SearchDraft } from '@/components/search/trainer-search-bar';
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
 * The trainer search (designs "Ricerca A" and "Ricerca desktop"): the search
 * "Cosa · Dove · Modalità", "Filtri" and the categories on top, then the
 * cards.
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

    /** "Cerca" of the search panel: what, where and how. */
    const search = (draft: SearchDraft) =>
        changeFilters(
            {
                disciplina: draft.disciplina,
                obiettivo: draft.obiettivo,
                nome: draft.nome,
                modalita: draft.modalita,
            },
            draft.city?.slug ?? null,
        );

    /** The cards with the heart (for clients and guests). */
    const trainerGrid = (list: TrainerSummary[]) => (
        <ResultsGrid items={list} itemKey={(trainer) => trainer.href}>
            {(trainer) => <TrainerCard trainer={trainer} />}
        </ResultsGrid>
    );

    const filtersButton = (className: string) => (
        <FiltersButton
            count={countFilters(sheetFilters)}
            onClick={() => setFiltersOpen(true)}
            className={className}
        />
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

            <TrainerSearchBar
                // A new search (or "Cancella i filtri") starts the panel again.
                key={`${nome}-${city?.slug}-${filters.disciplina.join()}-${filters.obiettivo.join()}-${filters.modalita}`}
                value={{
                    disciplina: filters.disciplina,
                    obiettivo: filters.obiettivo,
                    nome,
                    city,
                    modalita: filters.modalita,
                }}
                disciplines={disciplines}
                cities={cities}
                onSearch={search}
                filters={filtersButton('size-14 border border-border bg-card')}
            />

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-4 px-4 pt-5 pb-16 md:gap-6 md:px-8 md:pt-8">
                <ResultsHeader
                    title={
                        total === 1
                            ? `1 personal trainer ${place}`
                            : `${total} personal trainer ${place}`
                    }
                    sort={
                        <div className="flex items-center gap-2">
                            {filtersButton(
                                'h-11 px-4.5 shadow-[inset_0_0_0_1px_var(--field)] hover:bg-foreground/10 max-md:hidden',
                            )}
                            <SortMenu
                                options={sortOptions}
                                value={ordina ?? 'pertinenza'}
                                onChange={(value) =>
                                    changeFilters({
                                        ordina:
                                            value === 'pertinenza'
                                                ? null
                                                : value,
                                    })
                                }
                            />
                        </div>
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
