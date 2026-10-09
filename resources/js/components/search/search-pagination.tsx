import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SearchPaginationProps = {
    currentPage: number;
    lastPage: number;
    /** URL of a page, keeping the current filters. */
    pageUrl: (page: number) => string;
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
}: SearchPaginationProps) {
    if (lastPage <= 1) {
        return null;
    }

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < lastPage;
    const step = 'flex h-9 items-center gap-1 rounded-lg px-3';

    return (
        <>
            <nav
                aria-label="Pagine dei risultati"
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

            {hasNext && (
                // TODO: add the next trainers below the current ones (Inertia
                // merge props) instead of opening the next page.
                <Button
                    asChild
                    variant="outline"
                    className="mx-4 mt-2 h-11 md:hidden"
                >
                    <Link href={pageUrl(currentPage + 1)}>
                        Carica altri trainer
                    </Link>
                </Button>
            )}
        </>
    );
}
