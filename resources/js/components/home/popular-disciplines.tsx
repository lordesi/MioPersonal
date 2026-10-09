import { Link } from '@inertiajs/react';
import { searchUrl } from '@/lib/search';

// TODO: load the most searched disciplines from the database.
const disciplines = [
    { value: 'functional-training', label: 'Functional training' },
    { value: 'pesi-bodybuilding', label: 'Pesi e bodybuilding' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'crossfit', label: 'Crossfit' },
    { value: 'boxe', label: 'Boxe' },
];

/** Shortcut links to the search; the design shows them only on mobile. */
export default function PopularDisciplines() {
    return (
        <section
            aria-labelledby="popular-title"
            className="flex flex-col gap-3 pb-10 md:hidden"
        >
            <h2
                id="popular-title"
                className="px-4 text-sm font-medium text-muted-foreground"
            >
                Discipline popolari a Milano
            </h2>
            <div className="flex gap-2 overflow-x-auto px-4">
                {disciplines.map((discipline) => (
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
