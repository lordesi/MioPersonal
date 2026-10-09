import { Head, Link, router } from '@inertiajs/react';
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
import { searchUrl } from '@/lib/search';
import type { SearchFilters } from '@/lib/search';
import { home } from '@/routes';
import type { TrainerSummary } from '@/types';

type SearchProps = {
    /** Trainers of the current page. */
    trainers: TrainerSummary[];
    /** Trainers matching the filters, on every page. */
    total: number;
    pagination: { currentPage: number; lastPage: number };
    filters: ActiveFilters;
    disciplines: SearchOption[];
    zones: SearchOption[];
};

export default function Search({
    trainers,
    total,
    pagination,
    filters,
    disciplines,
    zones,
}: SearchProps) {
    // TODO: save favorites on the server for logged-in clients.
    const [favorites, setFavorites] = useState<string[]>([]);

    /** Reloads the page with the new filters, back to page 1. */
    const visit = (next: SearchFilters) =>
        router.get(
            searchUrl(next),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const toggleFavorite = (href: string, pressed: boolean) =>
        setFavorites(
            pressed
                ? [...favorites, href]
                : favorites.filter((item) => item !== href),
        );

    const resetFilters = () => visit({ ordina: filters.ordina });

    return (
        <>
            <Head title="Personal trainer a Milano" />

            <div className="mx-auto flex w-full max-w-7xl flex-col md:gap-6 md:px-8 md:pt-8 md:pb-20">
                <Breadcrumb aria-label="Percorso" className="hidden md:block">
                    <BreadcrumbList className="gap-2 sm:gap-2">
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={home()}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        <BreadcrumbItem>Personal trainer</BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Milano</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col gap-1 px-4 pt-6 pb-4 md:p-0">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl md:leading-10">
                        Personal trainer a Milano
                    </h1>
                    <p className="text-sm text-muted-foreground tabular-nums md:text-base">
                        {total} trainer · profili approvati dal nostro team
                    </p>
                </div>

                <FilterBar
                    filters={filters}
                    disciplines={disciplines}
                    zones={zones}
                    onChange={(changes) => visit({ ...filters, ...changes })}
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
                                        favorite={{
                                            pressed: favorites.includes(
                                                trainer.href,
                                            ),
                                            onPressedChange: (pressed) =>
                                                toggleFavorite(
                                                    trainer.href,
                                                    pressed,
                                                ),
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                        <SearchPagination
                            {...pagination}
                            pageUrl={(pagina) =>
                                searchUrl({ ...filters, pagina })
                            }
                        />
                    </div>
                ) : (
                    <EmptyState
                        bordered
                        icon={SearchIcon}
                        title="Nessun trainer con questi filtri"
                        description="Prova a togliere un filtro o a scegliere un'altra zona. Stiamo aggiungendo nuovi trainer ogni settimana."
                        action={
                            <Button
                                type="button"
                                variant="outline"
                                className="max-md:h-11"
                                onClick={resetFilters}
                            >
                                Rimuovi filtri
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
