import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardCarouselProps<T> = {
    /** The row's title ("Calisthenics a Milano"); left out = only the cards. */
    title?: string;
    /** Under the title, e.g. "4 trainer". */
    subtitle?: string;
    items: T[];
    itemKey: (item: T) => string | number;
    /** The card of one item. */
    children: (item: T) => ReactNode;
    className?: string;
};

/**
 * A row of cards that scrolls sideways (as the rows of Airbnb): on phones
 * small cards, two and a bit of the next one in sight; from md up four, then
 * five, with the arrows next to the title. Several rows go one under the
 * other.
 */
export default function CardCarousel<T>({
    title,
    subtitle,
    items,
    itemKey,
    children,
    className,
}: CardCarouselProps<T>) {
    const titleId = useId();
    const listRef = useRef<HTMLUListElement>(null);
    const [edges, setEdges] = useState({ start: true, end: true });

    // Which arrows can move: none at the start, none at the end.
    const measure = useCallback(() => {
        const list = listRef.current;

        if (!list) {
            return;
        }

        setEdges({
            start: list.scrollLeft <= 1,
            end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
        });
    }, []);

    useEffect(() => {
        measure();
        const list = listRef.current;

        if (!list || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(list);

        return () => observer.disconnect();
    }, [measure, items.length]);

    /** One "page" of cards to the left or to the right. */
    const move = (direction: -1 | 1) => {
        const list = listRef.current;

        list?.scrollBy({
            left: direction * list.clientWidth * 0.9,
            behavior: 'smooth',
        });
    };

    if (items.length === 0) {
        return null;
    }

    const arrow =
        'flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-35 disabled:hover:bg-card';
    const scrolls = !(edges.start && edges.end);

    return (
        <section
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Risultati'}
            className={cn('flex min-w-0 flex-col gap-3 md:gap-4', className)}
        >
            {(title || scrolls) && (
                <div className="flex min-h-9 items-center justify-between gap-4">
                    {title ? (
                        <div className="flex min-w-0 flex-col">
                            <h2
                                id={titleId}
                                className="truncate text-lg leading-6 font-bold tracking-[-0.02em] md:text-[22px] md:leading-7"
                            >
                                {title}
                            </h2>
                            {subtitle && (
                                <span className="text-[13px] text-muted-foreground md:text-sm">
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span />
                    )}
                    {scrolls && (
                        <div className="flex shrink-0 gap-2 max-md:hidden">
                            <button
                                type="button"
                                aria-label="Indietro"
                                disabled={edges.start}
                                onClick={() => move(-1)}
                                className={arrow}
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            </button>
                            <button
                                type="button"
                                aria-label="Avanti"
                                disabled={edges.end}
                                onClick={() => move(1)}
                                className={arrow}
                            >
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            </button>
                        </div>
                    )}
                </div>
            )}
            <ul
                ref={listRef}
                onScroll={measure}
                className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 md:mx-0 md:scroll-px-0 md:gap-5 md:px-0 [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item) => (
                    <li
                        key={itemKey(item)}
                        className="flex w-[calc((100%-1.5rem)/2.3)] max-w-50 shrink-0 snap-start sm:w-[calc((100%-2.25rem)/3.3)] md:w-[calc((100%-3.75rem)/4)] md:max-w-none lg:w-[calc((100%-5rem)/5)] [&>*]:flex-1"
                    >
                        {children(item)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
