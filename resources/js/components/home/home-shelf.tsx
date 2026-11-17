import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type HomeShelfProps<T> = {
    /** Unique in the page. */
    id: string;
    title: string;
    link: { label: string; href: string };
    items: T[];
    itemKey: (item: T) => string;
    /** The card of one item. */
    children: (item: T) => ReactNode;
};

/**
 * A row of cards of the home: on phones it scrolls sideways (one card and
 * a bit of the next); from md up a grid of 4, the others behind "Vedi tutti".
 * Hidden when empty.
 */
export default function HomeShelf<T>({
    id,
    title,
    link,
    items,
    itemKey,
    children,
}: HomeShelfProps<T>) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={id}
            className="mx-auto flex w-full max-w-300 flex-col gap-2 pt-10 md:gap-5 md:px-8 md:pt-16"
        >
            <div className="flex items-center justify-between gap-4 px-4 md:px-0">
                <h2
                    id={id}
                    className="text-[22px] leading-7 font-bold tracking-[-0.26px] md:text-[28px] md:leading-8.5"
                >
                    {title}
                </h2>
                <Link
                    href={link.href}
                    className="flex min-h-11 shrink-0 items-center text-[15px] font-semibold whitespace-nowrap text-brand"
                >
                    {link.label}
                </Link>
            </div>
            <ul className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-4 md:grid md:snap-none md:grid-cols-4 md:gap-5 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden">
                {items.map((item) => (
                    <li
                        key={itemKey(item)}
                        className="flex w-[min(82%,340px)] shrink-0 snap-start md:w-auto md:nth-[n+5]:hidden [&>*]:flex-1"
                    >
                        {children(item)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
