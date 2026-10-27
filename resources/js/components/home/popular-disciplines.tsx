import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

/** How many disciplines the design shows, before "Tutte le discipline". */
const SHOWN = 7;

type PopularDisciplinesProps = {
    /**
     * From the catalog, in the team's order.
     * TODO: show the most searched ones once searches are counted.
     */
    disciplines: CatalogOption[];
};

/** "Cosa vuoi allenare?": one card per discipline, each a link to the search. */
export default function PopularDisciplines({
    disciplines,
}: PopularDisciplinesProps) {
    return (
        <section
            aria-labelledby="disciplines-title"
            className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pt-6 md:gap-6 md:px-8 md:pt-18"
        >
            <h2
                id="disciplines-title"
                className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
                Cosa vuoi allenare?
            </h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
                {disciplines.slice(0, SHOWN).map((discipline) => (
                    <li key={discipline.value} className="flex">
                        <DisciplineLink
                            href={searchUrl({ disciplina: [discipline.value] })}
                            name={discipline.label}
                        />
                    </li>
                ))}
                <li className="flex">
                    <DisciplineLink
                        href={searchUrl()}
                        name="Tutte le discipline"
                        highlighted
                    />
                </li>
            </ul>
        </section>
    );
}

function DisciplineLink({
    href,
    name,
    highlighted = false,
}: {
    href: string;
    name: string;
    /** Dark card: the last one, "Tutte le discipline". */
    highlighted?: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex min-h-18 flex-1 items-center justify-between gap-3 rounded-xl border px-4.5 py-3.5',
                highlighted
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-card text-foreground hover:bg-accent',
            )}
        >
            <span className="min-w-0 font-semibold">{name}</span>
            <ArrowRight aria-hidden="true" className="size-4.5 shrink-0" />
        </Link>
    );
}
