import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

/** How many disciplines the design shows, before "Tutte le discipline". */
const SHOWN = 7;

/**
 * The line under each discipline, by slug. Here and not in the database
 * because only the home shows it; a discipline missing here has no line.
 */
const descriptions: Record<string, string> = {
    functional: 'Forza e resistenza per la vita di tutti i giorni',
    'pesi-e-bodybuilding': 'Forza e massa muscolare',
    pilates: 'Postura, core e mobilità',
    yoga: 'Flessibilità e respirazione',
    crossfit: 'Allenamenti intensi e sempre diversi',
    'preparazione-atletica': 'Allenamento mirato per il tuo sport',
    boxe: 'Tecnica, cardio e coordinazione',
    calisthenics: 'Allenamento a corpo libero',
    postura: 'Schiena, equilibrio e mobilità',
    running: 'Corsa, fiato e resistenza',
};

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
            <div className="flex flex-col gap-1.5">
                <h2
                    id="disciplines-title"
                    className="text-2xl font-semibold tracking-tight md:text-3xl"
                >
                    Cosa vuoi allenare?
                </h2>
                <p className="text-muted-foreground">
                    Parti da una disciplina: ti mostriamo subito i trainer che
                    la insegnano.
                </p>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
                {disciplines.slice(0, SHOWN).map((discipline) => (
                    <li key={discipline.value} className="flex">
                        <DisciplineLink
                            href={searchUrl({ disciplina: [discipline.value] })}
                            name={discipline.label}
                            description={descriptions[discipline.value]}
                        />
                    </li>
                ))}
                <li className="flex">
                    <DisciplineLink
                        href={searchUrl()}
                        name="Tutte le discipline"
                        description="Sfoglia tutti i trainer"
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
    description,
    highlighted = false,
}: {
    href: string;
    name: string;
    description?: string;
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
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold">{name}</span>
                {description && (
                    <span
                        className={cn(
                            'text-[13px] leading-[18px]',
                            highlighted
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground',
                        )}
                    >
                        {description}
                    </span>
                )}
            </span>
            <ArrowRight aria-hidden="true" className="size-4.5 shrink-0" />
        </Link>
    );
}
