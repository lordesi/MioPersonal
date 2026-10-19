import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import FilterBar from '@/components/search/filter-bar';
import type {
    ActiveFilters,
    SearchOption,
} from '@/components/search/filter-bar';
import SearchPagination from '@/components/search/search-pagination';
import EmptyState from '@/components/states/empty-state';
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

type SearchProps = {
    /** The city in the URL; null = all of Italy. */
    city: { slug: string; name: string } | null;
    /** Trainers of the current page. */
    trainers: TrainerSummary[];
    /** Trainers matching the filters, on every page. */
    total: number;
    pagination: { currentPage: number; lastPage: number };
    filters: ActiveFilters;
    disciplines: SearchOption[];
    cities: SearchOption[];
};

export default function Search({
    city,
    trainers,
    total,
    pagination,
    filters,
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

    return (
        <>
            <Head title={`Personal trainer ${place}`} />

            <div className="mx-auto flex w-full max-w-7xl flex-col md:gap-6 md:px-8 md:pt-8 md:pb-20">
                <Breadcrumb aria-label="Percorso" className="hidden md:block">
                    <BreadcrumbList className="gap-2 sm:gap-2">
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={home()}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {city ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={searchUrl()}>
                                            Personal trainer
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{city.name}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Personal trainer
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col gap-1 px-4 pt-6 pb-4 md:p-0">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl md:leading-10">
                        Personal trainer {place}
                    </h1>
                    <p className="text-sm text-muted-foreground tabular-nums md:text-base">
                        {total > 0
                            ? `Risultato: ${total} trainer`
                            : 'Non risultano trainer con queste caratteristiche, prova a cambiare i filtri'}
                    </p>
                </div>

                <FilterBar
                    filters={filters}
                    disciplines={disciplines}
                    cities={cities}
                    city={city?.slug ?? null}
                    onChange={(changes, nextCity) =>
                        visit({ ...filters, ...changes }, nextCity)
                    }
                    onReset={resetFilters}
                />

                {trainers.length > 0 ? (
                    <div className="flex flex-col pb-8 md:pb-0">
                        <ul className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] md:gap-6 md:p-0">
                            {trainers.map((trainer) => (
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
                                                      onPressedChange: (
                                                          pressed,
                                                      ) =>
                                                          toggleFavorite(
                                                              trainer.slug,
                                                              pressed,
                                                          ),
                                                  }
                                                : undefined
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                        <SearchPagination
                            {...pagination}
                            pageUrl={(pagina) =>
                                searchUrl({ ...filters, pagina }, city?.slug)
                            }
                        />
                    </div>
                ) : (
                    <EmptyState
                        bordered
                        icon={SearchIcon}
                        title="Nessun trainer con questi filtri"
                        action={
                            <Button
                                type="button"
                                variant="outline"
                                className="max-md:h-11"
                                onClick={resetFilters}
                            >
                                Cancella i filtri
                            </Button>
                        }
                        className="m-4 md:m-0"
                    />
                )}
            </div>
        </>
    );
}

Search.layout = { section: 'search' };
