import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import FilterBar, { SearchControls } from '@/components/search/filter-bar';
import type {
    ActiveFilters,
    SearchOption,
} from '@/components/search/filter-bar';
import SearchPagination from '@/components/search/search-pagination';
import TrainerCard from '@/components/trainer/trainer-card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { saveFavorite } from '@/hooks/use-favorite';
import { searchUrl } from '@/lib/search';
import type { SearchFilters } from '@/lib/search';
import { home, login } from '@/routes';
import type { TrainerSummary } from '@/types';

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
    valutazione: 'valutazione',
    domicilio: 'a domicilio',
    preferiti: 'solo preferiti',
};

/** "a, b e c". */
const joinNames = (names: string[]) =>
    new Intl.ListFormat('it', { type: 'conjunction' }).format(names);

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
    cities: SearchOption[];
};

/** Light links on the dark block. */
const crumbLink = 'text-primary-foreground/60 hover:text-primary-foreground';

export default function Search({
    city,
    trainers,
    total,
    pagination,
    filters,
    suggestions,
    disciplines,
    cities,
}: SearchProps) {
    const { auth } = usePage().props;
    // The hearts changed on this page; the others come from the server.
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    // Trainers and admins have no favorites: no heart for them.
    const canSave = !auth?.user || auth.user.role === 'client';

    const place = city ? `a ${city.name}` : 'in Italia';

    /** Reloads the page with the new filters, back to page 1. */
    const visit = (next: SearchFilters, nextCity = city?.slug ?? null) =>
        router.get(
            searchUrl(next, nextCity),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const changeFilters = (changes: SearchFilters, nextCity?: string | null) =>
        visit({ ...filters, ...changes }, nextCity);

    const toggleFavorite = (slug: string, pressed: boolean) => {
        if (!auth?.user) {
            router.visit(login());

            return;
        }

        setSaved((current) => ({ ...current, [slug]: pressed }));
        saveFavorite(slug, pressed, () =>
            setSaved((current) => ({ ...current, [slug]: !pressed })),
        );
    };

    // Back to all of Italy, keeping only the sort order.
    const resetFilters = () => visit({ ordina: filters.ordina }, null);

    /** The cards with the heart (for clients and guests). */
    const trainerGrid = (list: TrainerSummary[]) => (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-5">
            {list.map((trainer) => (
                <li key={trainer.href} className="flex">
                    <TrainerCard
                        trainer={trainer}
                        className="flex-1"
                        favorite={
                            canSave
                                ? {
                                      pressed:
                                          saved[trainer.slug] ??
                                          trainer.favorite ??
                                          false,
                                      onPressedChange: (pressed) =>
                                          toggleFavorite(trainer.slug, pressed),
                                  }
                                : undefined
                        }
                    />
                </li>
            ))}
        </ul>
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
            <Head title={`Personal trainer ${place}`} />

            <section
                aria-labelledby="search-title"
                className="bg-primary text-primary-foreground"
            >
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-5.5 px-4 pt-6 pb-10 md:px-8">
                    <Breadcrumb aria-label="Percorso">
                        <BreadcrumbList className="gap-2 text-[13px] leading-[18px] text-primary-foreground/60 sm:gap-2">
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className={crumbLink}>
                                    <Link href={home()}>Home</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                            {city ? (
                                <>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            asChild
                                            className={crumbLink}
                                        >
                                            <Link href={searchUrl()}>
                                                Personal trainer
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-primary-foreground">
                                            {city.name}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            ) : (
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-primary-foreground">
                                        Personal trainer
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex flex-col gap-1.5">
                        <h1
                            id="search-title"
                            className="text-[34px] leading-10 font-bold tracking-[-0.03em] md:text-[44px] md:leading-12"
                        >
                            Personal trainer {place}
                        </h1>
                        <p
                            aria-live="polite"
                            className="text-base text-primary-foreground/60 tabular-nums"
                        >
                            {total === 1
                                ? '1 trainer disponibile'
                                : `${total} trainer disponibili`}
                        </p>
                    </div>

                    <SearchControls
                        filters={filters}
                        disciplines={disciplines}
                        cities={cities}
                        city={city?.slug ?? null}
                        onChange={changeFilters}
                    />
                </div>
            </section>

            <div className="flex-1 bg-muted">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4.5 px-4 pt-6 pb-16 md:px-8">
                    <FilterBar
                        filters={filters}
                        disciplines={disciplines}
                        cities={cities}
                        city={city?.slug ?? null}
                        favorites={
                            canSave
                                ? {
                                      count: auth?.favoritesCount ?? 0,
                                      guest: !auth?.user,
                                  }
                                : undefined
                        }
                        onChange={changeFilters}
                        onReset={resetFilters}
                    />

                    {trainers.length > 0 ? (
                        <>
                            {trainerGrid(trainers)}
                            <SearchPagination
                                {...pagination}
                                pageUrl={(pagina) =>
                                    searchUrl(
                                        { ...filters, pagina },
                                        city?.slug,
                                    )
                                }
                            />
                        </>
                    ) : (
                        <>
                            {/* A short strip on top: the similar profiles stay in sight. */}
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
                                        Nessun trainer con questi filtri
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {emptyHint}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters}
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
                                        Profili simili
                                    </h2>
                                    {trainerGrid(suggestions.trainers)}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
