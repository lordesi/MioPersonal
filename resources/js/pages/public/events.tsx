import { Head, router } from '@inertiajs/react';
import { Search as SearchIcon } from 'lucide-react';
import { EventGrid } from '@/components/events/event-card';
import ActiveFilters from '@/components/search/active-filters';
import type { ActiveChip } from '@/components/search/active-filters';
import { FilterPill } from '@/components/search/filter-pill';
import FilterSheet from '@/components/search/filter-sheet';
import SearchPageHeader from '@/components/search/search-page-header';
import { Button } from '@/components/ui/button';
import { WHEN_OPTIONS } from '@/lib/events';
import { search } from '@/routes/events';
import type { CatalogOption, GroupSessionSummary, SeoData } from '@/types';

type Filters = {
    quando: string | null;
    tipo: string | null;
    disciplina: string | null;
};

type EventsProps = {
    seo: SeoData;
    city: { slug: string; name: string } | null;
    events: GroupSessionSummary[];
    total: number;
    filters: Filters;
    types: CatalogOption[];
    disciplines: CatalogOption[];
    cities: CatalogOption[];
};

/** The pills that the "Filtri" panel replaces on phones. */
const desktopOnly = 'hidden md:inline-flex';

const labelOf = (options: readonly CatalogOption[], value: string | null) =>
    options.find((option) => option.value === value)?.label;

/** "Eventi": the next events of trainers and gyms, in Italy or in a city. */
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
    const place = city ? `a ${city.name}` : 'in Italia';
    const whenOptions = WHEN_OPTIONS as readonly CatalogOption[];

    const visit = (
        changes: Partial<Filters>,
        nextCity = city?.slug ?? null,
    ) => {
        const next = { ...filters, ...changes };
        const query = Object.fromEntries(
            Object.entries(next).filter(([, value]) => value),
        );

        router.get(
            search.url(nextCity ? { city: nextCity } : {}, { query }),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const reset = () =>
        visit({ quando: null, tipo: null, disciplina: null }, null);

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

    addChip('citta', city?.name, () => visit({}, null));
    addChip('quando', labelOf(whenOptions, filters.quando), () =>
        visit({ quando: null }),
    );
    addChip('tipo', labelOf(types, filters.tipo), () => visit({ tipo: null }));
    addChip('disciplina', labelOf(disciplines, filters.disciplina), () =>
        visit({ disciplina: null }),
    );

    return (
        <>
            <Head title={seo.title} />

            <SearchPageHeader
                kind="event"
                city={city}
                title={`Eventi ${place}`}
                count={total === 1 ? '1 evento' : `${total} eventi`}
                intro="Workshop, open day e allenamenti di gruppo dei personal trainer e delle palestre di MioPersonal. Prenoti il posto qui, paghi sul posto."
            />

            <div className="flex-1 bg-muted">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4.5 px-4 pt-6 pb-16 md:px-8">
                    <div className="flex flex-col gap-4.5">
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
                                onChange={(next) => visit({}, next)}
                                searchPlaceholder="Cerca una città"
                            />
                            {/* Phones: the other filters in one panel. */}
                            <FilterSheet
                                total={total}
                                noun={{ one: 'evento', many: 'eventi' }}
                                onClear={() =>
                                    visit({
                                        quando: null,
                                        tipo: null,
                                        disciplina: null,
                                    })
                                }
                                fields={[
                                    {
                                        kind: 'choice',
                                        id: 'sheet-when',
                                        title: 'Quando',
                                        noneLabel: 'Tutte le date',
                                        options: [...whenOptions],
                                        value: filters.quando,
                                        onChange: (quando) => visit({ quando }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-type',
                                        title: 'Tipo',
                                        noneLabel: 'Tutti',
                                        options: types,
                                        value: filters.tipo,
                                        onChange: (tipo) => visit({ tipo }),
                                    },
                                    {
                                        kind: 'choice',
                                        id: 'sheet-discipline',
                                        title: 'Disciplina',
                                        noneLabel: 'Tutte',
                                        options: disciplines,
                                        value: filters.disciplina,
                                        onChange: (disciplina) =>
                                            visit({ disciplina }),
                                    },
                                ]}
                            />
                            <FilterPill
                                label="Quando"
                                noneLabel="Tutte le date"
                                options={[...whenOptions]}
                                value={filters.quando}
                                onChange={(quando) => visit({ quando })}
                                className={desktopOnly}
                            />
                            <FilterPill
                                label="Tipo"
                                noneLabel="Tutti i tipi"
                                options={types}
                                value={filters.tipo}
                                onChange={(tipo) => visit({ tipo })}
                                className={desktopOnly}
                            />
                            <FilterPill
                                label="Disciplina"
                                noneLabel="Tutte le discipline"
                                options={disciplines}
                                value={filters.disciplina}
                                onChange={(disciplina) => visit({ disciplina })}
                                searchPlaceholder="Cerca una disciplina"
                                className={desktopOnly}
                            />
                        </div>
                        <ActiveFilters chips={chips} onClearAll={reset} />
                    </div>

                    {events.length > 0 ? (
                        <EventGrid events={events} />
                    ) : (
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
                                        ? 'Nessun evento con questi filtri'
                                        : `Nessun evento in programma ${place} per ora`}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Prova a togliere un filtro o ad allargare la
                                    zona.
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
                    )}
                </div>
            </div>
        </>
    );
}
