import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type SearchPaginationProps = {
    currentPage: number;
    lastPage: number;
    /** URL of a page, keeping the current filters. */
    pageUrl: (page: number) => string;
    /** Accessible name of the page links. */
    label?: string;
    /** The mobile button that opens the next page. */
    moreLabel?: string;
    /**
     * The list prop the server merges (Inertia::merge): on phones the next
     * page goes below the current one. Without it the button opens the page.
     */
    mergeProp?: string;
};

/** Pages around the current one, with "…" for the gaps: 1 2 3 … 9 */
function visiblePages(current: number, last: number): (number | 'gap')[] {
    const pages: (number | 'gap')[] = [];

    for (let page = 1; page <= last; page++) {
        const nearCurrent = Math.abs(page - current) <= 1;

        if (page === 1 || page === last || nearCurrent || last <= 5) {
            pages.push(page);
        } else if (pages.at(-1) !== 'gap') {
            pages.push('gap');
        }
    }

    return pages;
}

/** Numbered pages on desktop, "Carica altri trainer" on mobile. Hidden with one page. */
export default function SearchPagination({
    currentPage,
    lastPage,
    pageUrl,
    label = 'Pagine dei risultati',
    moreLabel = 'Carica altri trainer',
    mergeProp,
}: SearchPaginationProps) {
    const [loading, setLoading] = useState(false);

    if (lastPage <= 1) {
        return null;
    }

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < lastPage;
    const step = 'flex h-9 items-center gap-1 rounded-lg px-3';

    return (
        <>
            <nav
                aria-label={label}
                className="hidden justify-center pt-4 md:flex"
            >
                <ul className="flex items-center gap-1 text-sm font-medium tabular-nums">
                    <li>
                        {hasPrevious ? (
                            <Link
                                href={pageUrl(currentPage - 1)}
                                className={step}
                            >
                                <ChevronLeft aria-hidden="true" />
                                Precedente
                            </Link>
                        ) : (
                            <span
                                aria-disabled="true"
                                className={cn(step, 'text-muted-foreground')}
                            >
                                <ChevronLeft aria-hidden="true" />
                                Precedente
                            </span>
                        )}
                    </li>
                    {visiblePages(currentPage, lastPage).map((page, index) =>
                        page === 'gap' ? (
                            <li
                                key={`gap-${index}`}
                                aria-hidden="true"
                                className="flex size-9 items-center justify-center text-muted-foreground"
                            >
                                …
                            </li>
                        ) : (
                            <li key={page}>
                                <Link
                                    href={pageUrl(page)}
                                    aria-current={
                                        page === currentPage
                                            ? 'page'
                                            : undefined
                                    }
                                    className="flex size-9 items-center justify-center rounded-lg aria-[current=page]:border aria-[current=page]:border-input aria-[current=page]:bg-background aria-[current=page]:shadow-xs"
                                >
                                    {page}
                                </Link>
                            </li>
                        ),
                    )}
                    <li>
                        {hasNext ? (
                            <Link
                                href={pageUrl(currentPage + 1)}
                                className={step}
                            >
                                Successiva
                                <ChevronRight aria-hidden="true" />
                            </Link>
                        ) : (
                            <span
                                aria-disabled="true"
                                className={cn(step, 'text-muted-foreground')}
                            >
                                Successiva
                                <ChevronRight aria-hidden="true" />
                            </span>
                        )}
                    </li>
                </ul>
            </nav>

            {hasNext &&
                (mergeProp ? (
                    // The next page is added below the current one (the
                    // server sends `mergeProp` with Inertia::merge).
                    <Button
                        type="button"
                        variant="outline"
                        className="mx-4 mt-2 h-11 md:hidden"
                        disabled={loading}
                        onClick={() =>
                            router.get(
                                pageUrl(currentPage + 1),
                                {},
                                {
                                    only: [mergeProp, 'pagination'],
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                    onStart: () => setLoading(true),
                                    onFinish: () => setLoading(false),
                                },
                            )
                        }
                    >
                        {loading && <Spinner />}
                        {moreLabel}
                    </Button>
                ) : (
                    <Button
                        asChild
                        variant="outline"
                        className="mx-4 mt-2 h-11 md:hidden"
                    >
                        <Link href={pageUrl(currentPage + 1)}>{moreLabel}</Link>
                    </Button>
                ))}
        </>
    );
}
