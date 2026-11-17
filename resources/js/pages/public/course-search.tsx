import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { courseCard } from '@/components/mp/cards';
import CourseFiltersSheet, {
    countCourseFilters,
} from '@/components/mp/course-filters-sheet';
import ProfileCard from '@/components/mp/profile-card';
import {
    EmptyResults,
    ResultsGrid,
    ResultsHeader,
    SuggestionsSection,
} from '@/components/mp/search-results';
import SearchTop from '@/components/mp/search-top';
import type { WhatWhereResult } from '@/components/mp/what-where-search';
import SearchPagination from '@/components/search/search-pagination';
import type { CourseDay, CourseSearchFilters, CourseTime } from '@/lib/course';
import { courseSearchUrl } from '@/lib/course';
import type {
    CatalogOption,
    CityWithCoordinates,
    CourseSummary,
    SeoData,
} from '@/types';

type Filters = {
    disciplina: string | null;
    giorno: CourseDay | null;
    fascia: CourseTime | null;
    livello: string | null;
};

type CourseSearchProps = {
    city: { slug: string; name: string } | null;
    courses: CourseSummary[];
    total: number;
    pagination: { currentPage: number; lastPage: number };
    filters: Filters;
    /** Nothing matches the filters: the other courses here. */
    suggestions: CourseSummary[];
    disciplines: CatalogOption[];
    levels: CatalogOption[];
    cities: CityWithCoordinates[];
    seo: SeoData;
};

/**
 * "Corsi a Milano": the weekly courses of the gyms (/corsi/milano), in the
 * dark design of the trainer search. "Cosa" is a discipline; there is no
 * sort, the server shows the courses with more lessons first.
 */
export default function CourseSearch({
    city,
    courses,
    total,
    pagination,
    filters,
    suggestions,
    disciplines,
    levels,
    cities,
    seo,
}: CourseSearchProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const place = city ? `a ${city.name}` : 'in Italia';
    const filterCount = countCourseFilters(filters);

    /** Reloads the page with the new filters, back to page 1. */
    const visit = (next: CourseSearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            courseSearchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    /** `nextCity` left out = same city. */
    const change = (changes: CourseSearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    /** "Cosa · Dove · Cerca": a discipline (courses have no name search). */
    const search = ({ what, city: nextCity }: WhatWhereResult) =>
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

    const grid = (list: CourseSummary[]) => (
        <ResultsGrid items={list} itemKey={(course) => course.id}>
            {(course) => <ProfileCard {...courseCard(course)} />}
        </ResultsGrid>
    );

    return (
        <>
            <Head title={seo.title} />

            <SearchTop
                kind="course"
                city={city}
                what={{
                    label: 'Cerca corsi',
                    placeholder: 'Disciplina del corso',
                    mobilePlaceholder: 'Disciplina o città',
                    options: disciplines,
                }}
                cities={cities}
                initialWhat={initialWhat}
                searchKey={`${city?.slug}-${filters.disciplina}`}
                onSearch={search}
                onCity={(slug) => change({}, slug)}
                filterCount={filterCount}
                onOpenFilters={() => setFiltersOpen(true)}
            />

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-4 px-4 pt-4 pb-16 md:gap-6 md:px-8 md:pt-6">
                <ResultsHeader
                    title={
                        total === 1
                            ? `1 corso in palestra ${place}`
                            : `${total} corsi in palestra ${place}`
                    }
                />

                {courses.length > 0 ? (
                    <>
                        {grid(courses)}
                        <SearchPagination
                            {...pagination}
                            label="Pagine dei corsi"
                            moreLabel="Carica altri corsi"
                            mergeProp="courses"
                            pageUrl={(pagina) =>
                                courseSearchUrl(
                                    { ...filters, pagina },
                                    city?.slug,
                                )
                            }
                        />
                    </>
                ) : (
                    <>
                        <EmptyResults
                            title={
                                filtered
                                    ? 'Nessun corso con questi filtri'
                                    : `Nessun corso ${place} per ora`
                            }
                            hint={
                                suggestions.length > 0
                                    ? `Ecco gli altri corsi ${place}.`
                                    : 'Prova a togliere un filtro o ad allargare la zona.'
                            }
                            onReset={
                                filtered ? () => visit({}, null) : undefined
                            }
                        />
                        {suggestions.length > 0 && (
                            <SuggestionsSection
                                id="suggestions-title"
                                title={`Altri corsi ${place}`}
                            >
                                {grid(suggestions)}
                            </SuggestionsSection>
                        )}
                    </>
                )}
            </div>

            <CourseFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                disciplines={disciplines}
                levels={levels}
                onApply={(next) => visit(next)}
            />
        </>
    );
}
