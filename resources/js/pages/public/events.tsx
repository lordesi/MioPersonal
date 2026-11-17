import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { eventCard } from '@/components/mp/cards';
import EventFiltersSheet, {
    countEventFilters,
} from '@/components/mp/event-filters-sheet';
import type { EventSheetFilters } from '@/components/mp/event-filters-sheet';
import ProfileCard from '@/components/mp/profile-card';
import {
    EmptyResults,
    ResultsGrid,
    ResultsHeader,
} from '@/components/mp/search-results';
import SearchTop from '@/components/mp/search-top';
import type { WhatWhereResult } from '@/components/mp/what-where-search';
import { search } from '@/routes/events';
import type {
    CatalogOption,
    CityWithCoordinates,
    GroupSessionSummary,
    SeoData,
} from '@/types';

type EventsProps = {
    seo: SeoData;
    city: { slug: string; name: string } | null;
    events: GroupSessionSummary[];
    total: number;
    filters: EventSheetFilters;
    types: CatalogOption[];
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
};

/**
 * "Eventi": the next events of trainers and gyms, in Italy or in a city
 * (with the online ones), soonest first. The dark design of the courses'
 * search: "Cosa" is a discipline, "Filtri" holds when and type.
 */
export default function Events({
    seo,
    city,
    events,
    total,
    filters,
    types,
    disciplines,
    cities,
}: EventsProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const place = city ? `a ${city.name}` : 'in Italia';
    const filterCount = countEventFilters(filters);

    /** Reloads the page with these filters; `nextCity` left out = same city. */
    const visit = (
        next: EventSheetFilters,
        nextCity: string | null = city?.slug ?? null,
    ) => {
        const query = Object.fromEntries(
            Object.entries(next).filter(([, value]) => value),
        );

        router.get(
            search.url(nextCity ? { city: nextCity } : {}, { query }),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const change = (
        changes: Partial<EventSheetFilters>,
        nextCity?: string | null,
    ) => visit({ ...filters, ...changes }, nextCity);

    /** "Cosa · Dove · Cerca": a discipline (events have no name search). */
    const searchFor = ({ what, city: nextCity }: WhatWhereResult) =>
        change({ disciplina: what }, nextCity);

    const initialWhat = {
        text:
            disciplines.find(
                (discipline) => discipline.value === filters.disciplina,
            )?.label ?? '',
        value: filters.disciplina,
    };

    // A city or any filter: "con questi filtri", and something to cancel.
    const filtered = filterCount > 0 || city !== null;

    return (
        <>
            <Head title={seo.title} />

            <SearchTop
                kind="event"
                city={city}
                what={{
                    label: 'Cerca eventi',
                    placeholder: 'Disciplina dell’evento',
                    mobilePlaceholder: 'Disciplina o città',
                    options: disciplines,
                }}
                cities={cities}
                initialWhat={initialWhat}
                searchKey={`${city?.slug}-${filters.disciplina}`}
                onSearch={searchFor}
                onCity={(slug) => change({}, slug)}
                filterCount={filterCount}
                onOpenFilters={() => setFiltersOpen(true)}
            />

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-4 px-4 pt-4 pb-16 md:gap-6 md:px-8 md:pt-6">
                <ResultsHeader
                    title={
                        total === 1
                            ? `1 evento ${place}`
                            : `${total} eventi ${place}`
                    }
                />
                <p className="-mt-2 text-[15px] leading-5.25 text-muted-foreground md:-mt-4">
                    Workshop, open day e allenamenti di gruppo dei personal
                    trainer e delle palestre di MioPersonal. Prenoti il posto
                    qui, paghi sul posto.
                </p>

                {events.length > 0 ? (
                    <ResultsGrid items={events} itemKey={(event) => event.slug}>
                        {(event) => <ProfileCard {...eventCard(event)} />}
                    </ResultsGrid>
                ) : (
                    <EmptyResults
                        title={
                            filterCount > 0
                                ? 'Nessun evento con questi filtri'
                                : `Nessun evento in programma ${place} per ora`
                        }
                        hint="Prova a togliere un filtro o ad allargare la zona."
                        onReset={
                            filtered
                                ? () =>
                                      visit(
                                          {
                                              quando: null,
                                              tipo: null,
                                              disciplina: null,
                                          },
                                          null,
                                      )
                                : undefined
                        }
                    />
                )}
            </div>

            <EventFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                types={types}
                disciplines={disciplines}
                onApply={(next) => visit(next)}
            />
        </>
    );
}
