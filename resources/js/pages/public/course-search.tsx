import { Head, router } from '@inertiajs/react';
import { Search as SearchIcon, Ticket } from 'lucide-react';
import { CourseGrid } from '@/components/gym/course-card';
import ActiveFilters from '@/components/search/active-filters';
import type { ActiveChip } from '@/components/search/active-filters';
import { FilterPill, TogglePill } from '@/components/search/filter-pill';
import FilterSheet from '@/components/search/filter-sheet';
import SearchPageHeader from '@/components/search/search-page-header';
import SearchPagination from '@/components/search/search-pagination';
import { Button } from '@/components/ui/button';
import type { CourseDay, CourseSearchFilters, CourseTime } from '@/lib/course';
import {
    courseDayOptions,
    courseSearchUrl,
    courseTimeOptions,
} from '@/lib/course';
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
    online: '1' | null;
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

/** The pills that the "Filtri" panel replaces on phones. */
const desktopOnly = 'hidden md:inline-flex';

const labelOf = (
    options: { value: string; label: string }[],
    value: string | null,
) => options.find((option) => option.value === value)?.label;

/** "Corsi a Milano": the weekly courses of the gyms, /corsi/milano. */
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
    const place = city ? `a ${city.name}` : 'in Italia';

    const visit = (next: CourseSearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            courseSearchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const change = (changes: CourseSearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    const reset = () => visit({}, null);

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

    addChip('citta', city?.name, () => change({}, null));
    addChip('disciplina', labelOf(disciplines, filters.disciplina), () =>
        change({ disciplina: null }),
    );
    addChip('giorno', labelOf(courseDayOptions, filters.giorno), () =>
        change({ giorno: null }),
    );
    addChip('fascia', labelOf(courseTimeOptions, filters.fascia), () =>
        change({ fascia: null }),
    );
    addChip('livello', labelOf(levels, filters.livello), () =>
        change({ livello: null }),
    );
    addChip('online', filters.online ? 'Prenoti online' : undefined, () =>
        change({ online: null }),
    );

    return (
        <>
            <Head title={seo.title} />

            <SearchPageHeader
                kind="course"
                city={city}
                title={`Corsi in palestra ${place}`}
                count={total === 1 ? '1 corso' : `${total} corsi`}
                intro="Pilates, yoga, spinning, functional e altro: gli orari della settimana delle palestre di MioPersonal. Dove vedi “Prenoti online” prenoti il posto qui."
            />

            <div className="flex-1 bg-muted">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4.5 px-4 pt-6 pb-16 md:px-8">
                    <div className="flex flex-col gap-4.5">
                        {/* On phones the pills scroll sideways, in one row. */}
                        <div
                            role="group"
                            aria-label="Filtri"
                            className="-mx-4 flex [scrollbar-width:none] items-center gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
                        >
                            <FilterPill
                                label="Città"
                                noneLabel="Tutta Italia"
                                options={cities}
                                value={city?.slug ?? null}
                                onChange={(next) => change({}, next)}
                                searchPlaceholder="Cerca una città"
                            />
                            {/* Phones: the other filters in one panel. */}
                            <FilterSheet
                                total={total}
                                noun={{ one: 'corso', many: 'corsi' }}
                                onClear={() => visit({})}
                                fields={[
                                    {
                                        kind: 'choice',
                                        id: 'sheet-discipline',
                                        title: 'Disciplina',
                                        noneLabel: 'Tutte',
                                        options: disciplines,
                                        value: filters.disciplina,
                                        onChange: (disciplina) =>
                                            change({ disciplina }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-day',
                                        title: 'Giorno',
                                        noneLabel: 'Tutti',
                                        options: courseDayOptions,
                                        value: filters.giorno,
                                        onChange: (giorno) =>
                                            change({
                                                giorno: giorno as CourseDay | null,
                                            }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-time',
                                        title: 'Orario',
                                        noneLabel: 'Qualsiasi',
                                        options: courseTimeOptions,
                                        value: filters.fascia,
                                        onChange: (fascia) =>
                                            change({
                                                fascia: fascia as CourseTime | null,
                                            }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-level',
                                        title: 'Livello',
                                        noneLabel: 'Tutti',
                                        options: levels,
                                        value: filters.livello,
                                        onChange: (livello) =>
                                            change({ livello }),
                                    },
                                    {
                                        kind: 'toggle',
                                        id: 'sheet-online',
                                        title: 'Prenoti online',
                                        checked: filters.online !== null,
                                        onChange: (on) =>
                                            change({ online: on ? '1' : null }),
                                    },
                                ]}
                            />
                            <FilterPill
                                label="Disciplina"
                                noneLabel="Tutte le discipline"
                                options={disciplines}
                                value={filters.disciplina}
                                onChange={(disciplina) =>
                                    change({ disciplina })
                                }
                                searchPlaceholder="Cerca una disciplina"
                                className={desktopOnly}
                            />
                            <FilterPill
                                label="Giorno"
                                noneLabel="Tutti i giorni"
                                options={courseDayOptions}
                                value={filters.giorno}
                                onChange={(giorno) => change({ giorno })}
                                className={desktopOnly}
                            />
                            <FilterPill
                                label="Orario"
                                noneLabel="A qualsiasi ora"
                                options={courseTimeOptions}
                                value={filters.fascia}
                                onChange={(fascia) => change({ fascia })}
                                className={desktopOnly}
                            />
                            <FilterPill
                                label="Livello"
                                noneLabel="Tutti i livelli"
                                options={levels}
                                value={filters.livello}
                                onChange={(livello) => change({ livello })}
                                className={desktopOnly}
                            />
                            <TogglePill
                                pressed={filters.online !== null}
                                onPressedChange={(pressed) =>
                                    change({ online: pressed ? '1' : null })
                                }
                                className={desktopOnly}
                            >
                                <Ticket aria-hidden="true" className="size-4" />
                                Prenoti online
                            </TogglePill>
                        </div>
                        <ActiveFilters chips={chips} onClearAll={reset} />
                    </div>

                    {courses.length > 0 ? (
                        <>
                            <CourseGrid courses={courses} />
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
                                        {chips.length > 0
                                            ? 'Nessun corso con questi filtri'
                                            : `Nessun corso ${place} per ora`}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {suggestions.length > 0
                                            ? `Ecco gli altri corsi ${place}.`
                                            : 'Prova a togliere un filtro o ad allargare la zona.'}
                                    </p>
                                </div>
                                {chips.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={reset}
                                        className="h-10 rounded-xl px-4 font-semibold"
                                    >
                                        Cancella i filtri
                                    </Button>
                                )}
                            </div>

                            {suggestions.length > 0 && (
                                <section
                                    aria-labelledby="suggestions-title"
                                    className="flex flex-col gap-3.5"
                                >
                                    <h2
                                        id="suggestions-title"
                                        className="text-lg leading-6.5 font-semibold"
                                    >
                                        Altri corsi {place}
                                    </h2>
                                    <CourseGrid courses={suggestions} />
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
