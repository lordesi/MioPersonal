import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Dumbbell,
    LifeBuoy,
    Search,
    Ticket,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    LinkCard,
    brandFilledClassName,
    errorNumberClassName,
    eyebrowClassName,
    pageColumnClassName,
    pageTitleClassName,
} from '@/components/mp/page-bits';
import { courseSearchUrl } from '@/lib/course';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { search as eventsSearch } from '@/routes/events';
import { show as contactPage } from '@/routes/contact';

/** The four searches (the ones switched on), then "La mia area" for whoever is logged in. */
const exploreLinks: {
    title: string;
    hint: string;
    href: string;
    icon: LucideIcon;
    feature?: FeatureName;
}[] = [
    {
        title: 'Cerca un personal trainer',
        hint: 'Per disciplina, città e disponibilità',
        href: searchUrl(),
        icon: Dumbbell,
    },
    {
        title: 'Cerca una palestra',
        hint: 'Servizi, abbonamenti e promozioni',
        href: gymSearchUrl(),
        icon: Building2,
        feature: 'gyms',
    },
    {
        title: 'Corsi in palestra',
        hint: 'Gli orari della settimana',
        href: courseSearchUrl(),
        icon: CalendarDays,
        feature: 'courses',
    },
    {
        title: 'Eventi',
        hint: 'Workshop, open day, allenamenti di gruppo',
        href: eventsSearch.url(),
        icon: Ticket,
        feature: 'events',
    },
];

/** Shown by bootstrap/app.php for every 404 (unknown address, missing trainer…). */
export default function NotFound() {
    // Missing on Laravel's own error responses.
    const user = usePage().props.auth?.user;
    const features = useFeatures();
    const usefulLinks = [
        ...withFeatures(exploreLinks, features),
        user
            ? {
                  title: 'La mia area',
                  hint: 'Prenotazioni, profilo e impostazioni',
                  href: dashboard.url(),
                  icon: User,
              }
            : {
                  title: 'Centro assistenza',
                  hint: 'Scrivici se pensi che sia un errore',
                  href: contactPage.url(),
                  icon: LifeBuoy,
              },
    ];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // The search turns "pilates roma" into its filters (TrainerSearchController::freeTextUrl).
        const value = new FormData(event.currentTarget).get('q');
        const text = typeof value === 'string' ? value.trim() : '';
        router.get(searchUrl(), text === '' ? {} : { q: text });
    };

    return (
        <>
            <Head title="Pagina non trovata" />

            <div
                className={cn(
                    pageColumnClassName,
                    'grid flex-1 items-center gap-10 pb-16 md:pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16',
                )}
            >
                <div className="flex flex-col gap-5 md:gap-6">
                    <div aria-hidden="true" className={errorNumberClassName}>
                        404
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className={eyebrowClassName}>Errore 404</p>
                        <h1 className={pageTitleClassName}>
                            Questa pagina non esiste (più).
                        </h1>
                        <p className="text-[17px] text-muted-foreground md:text-xl md:leading-7">
                            Forse il link è sbagliato, oppure il profilo del
                            trainer non è più online. Ricominciamo da qui.
                        </p>
                    </div>
                    <form
                        role="search"
                        aria-label="Cerca un trainer"
                        onSubmit={submit}
                        className="flex flex-col gap-2.5 sm:flex-row"
                    >
                        <label htmlFor="not-found-search" className="sr-only">
                            Cerca un trainer
                        </label>
                        {/* flex-1 only in a row: in the column of phones it would squash the height. */}
                        <div className="flex h-12.5 items-center gap-2.5 rounded-full px-4.5 shadow-[inset_0_0_0_1px_var(--field)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)] sm:flex-1">
                            <Search
                                aria-hidden="true"
                                className="size-5 text-muted-foreground"
                            />
                            <input
                                id="not-found-search"
                                name="q"
                                type="search"
                                placeholder="Disciplina o città, es. pilates Roma"
                                className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <button type="submit" className={brandFilledClassName}>
                            Cerca
                        </button>
                    </form>
                </div>

                <nav
                    aria-label="Pagine utili"
                    className="flex flex-col gap-2.5 md:gap-3"
                >
                    <p className={eyebrowClassName}>Prova da qui</p>
                    {usefulLinks.map((link) => (
                        <LinkCard
                            key={link.title}
                            href={link.href}
                            icon={link.icon}
                            title={link.title}
                        >
                            {link.hint}
                        </LinkCard>
                    ))}
                </nav>
            </div>
        </>
    );
}
