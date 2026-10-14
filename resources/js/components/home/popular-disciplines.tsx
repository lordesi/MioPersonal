import { Link } from '@inertiajs/react';
import { searchUrl } from '@/lib/search';
import type { CatalogOption } from '@/types';

/** How many shortcuts the design shows. */
const SHOWN = 6;

type PopularDisciplinesProps = {
    /**
     * From the catalog, in the team's order.
     * TODO: show the most searched ones once searches are counted.
     */
    disciplines: CatalogOption[];
};

/** Shortcut links to the search; the design shows them only on mobile. */
export default function PopularDisciplines({
    disciplines,
}: PopularDisciplinesProps) {
    return (
        <section
            aria-labelledby="popular-title"
            className="flex flex-col gap-3 pb-10 md:hidden"
        >
            <h2
                id="popular-title"
                className="px-4 text-sm font-medium text-muted-foreground"
            >
                Discipline popolari
            </h2>
            <div className="flex gap-2 overflow-x-auto px-4">
                {disciplines.slice(0, SHOWN).map((discipline) => (
                    <Link
                        key={discipline.value}
                        href={searchUrl({ disciplina: discipline.value })}
                        className="inline-flex h-10 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap"
                    >
                        {discipline.label}
                    </Link>
                ))}
            </div>
        </section>
    );
}
