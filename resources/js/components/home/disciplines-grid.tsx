import { Link } from '@inertiajs/react';
import { searchUrl } from '@/lib/search';
import type { CatalogOption } from '@/types';

/** One stroke icon per discipline of the catalog (DisciplineSeeder), as in the design. */
const icons: Record<string, string> = {
    functional: 'M22 12h-4l-3 9L9 3l-3 9H2',
    pilates:
        'M11 5a1 1 0 1 0 2 0 1 1 0 0 0-2 0 M9 20l3-6 3 6 M6 8l6 2 6-2 M12 10v4',
    yoga: 'M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
    'pesi-e-bodybuilding':
        'M6.5 6.5l11 11 M21 21l-1-1 M3 3l1 1 M18 22l4-4 M2 6l4-4 M3 10l7-7 M14 21l7-7',
    crossfit:
        'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    boxe: 'M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0 M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0 M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
    'preparazione-atletica': 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
    postura: 'M12 2v20 M8 6h8 M7 10h10 M8 14h8 M9 18h6',
    calisthenics: 'M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6',
    running: 'M10 2h4 M12 14l3-3 M4 14a8 8 0 1 0 16 0 8 8 0 0 0-16 0',
};

/** A discipline the team adds later: the "functional" line. */
const fallbackIcon = icons.functional;

/** The long names, shortened as in the design so they fit the box. */
const shortLabels: Record<string, string> = {
    'pesi-e-bodybuilding': 'Pesi',
    'preparazione-atletica': 'Prep. atletica',
};

/** "Tutte le discipline": each one opens the trainer search with it. */
export default function DisciplinesGrid({
    disciplines,
}: {
    disciplines: CatalogOption[];
}) {
    if (disciplines.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="disciplines-title"
            className="mx-auto flex w-full max-w-300 flex-col gap-4 px-4 pt-10 md:gap-5 md:px-8 md:pt-16"
        >
            <h2
                id="disciplines-title"
                className="text-[22px] leading-7 font-bold tracking-[-0.26px] md:text-[28px] md:leading-8.5"
            >
                Tutte le discipline
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {disciplines.map((discipline) => (
                    <li key={discipline.value} className="flex">
                        <Link
                            href={searchUrl({ disciplina: [discipline.value] })}
                            aria-label={
                                shortLabels[discipline.value]
                                    ? discipline.label
                                    : undefined
                            }
                            className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-brand px-4.5 text-[15px] font-semibold tracking-[-0.23px] outline-none hover:bg-brand-soft focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-5 shrink-0 text-brand"
                            >
                                <path
                                    d={icons[discipline.value] ?? fallbackIcon}
                                />
                            </svg>
                            <span className="truncate">
                                {shortLabels[discipline.value] ??
                                    discipline.label}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
