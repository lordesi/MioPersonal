import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { dashboard } from '@/routes';
import { search as eventsSearch } from '@/routes/events';
import { show as contactPage } from '@/routes/contact';

/** The four searches, then "La mia area" for whoever is logged in. */
const exploreLinks = [
    {
        title: 'Cerca un personal trainer',
        hint: 'Per disciplina, città e disponibilità',
        href: searchUrl(),
    },
    {
        title: 'Cerca una palestra',
        hint: 'Servizi, abbonamenti e promozioni',
        href: gymSearchUrl(),
    },
    {
        title: 'Corsi in palestra',
        hint: 'Gli orari della settimana',
        href: courseSearchUrl(),
    },
    {
        title: 'Eventi',
        hint: 'Workshop, open day, allenamenti di gruppo',
        href: eventsSearch.url(),
    },
];

/** Shown by bootstrap/app.php for every 404 (unknown address, missing trainer…). */
export default function NotFound() {
    // Missing on Laravel's own error responses.
    const user = usePage().props.auth?.user;
    const usefulLinks = [
        ...exploreLinks,
        user
            ? {
                  title: 'La mia area',
                  hint: 'Prenotazioni, profilo e impostazioni',
                  href: dashboard.url(),
              }
            : {
                  title: 'Centro assistenza',
                  hint: 'Scrivici se pensi che sia un errore',
                  href: contactPage.url(),
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

            <div className="mx-auto grid w-full max-w-300 flex-1 items-center gap-8 px-4 pt-8 pb-10 md:px-8 md:pt-18 md:pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
                <div className="flex flex-col gap-5 md:gap-6">
                    <div
                        aria-hidden="true"
                        className="text-[120px] leading-26 font-extrabold tracking-[-0.06em] tabular-nums md:text-[220px] md:leading-45"
                    >
                        404
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <SectionLabel as="p">Errore 404</SectionLabel>
                        <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-[40px] md:leading-11">
                            Questa pagina non esiste (più).
                        </h1>
                        <p className="text-base text-muted-foreground md:text-lg md:leading-7">
                            Forse il link è sbagliato, oppure il profilo del
                            trainer non è più online. Ricominciamo da qui.
                        </p>
                    </div>
                    <form
                        role="search"
                        aria-label="Cerca un trainer"
                        onSubmit={submit}
                        className="flex flex-col gap-2 sm:flex-row"
                    >
                        <label htmlFor="not-found-search" className="sr-only">
                            Cerca un trainer
                        </label>
                        {/* flex-1 only in a row: in the column of phones it would squash the h-12. */}
                        <div className="flex h-12 items-center gap-2.5 rounded-lg border border-input bg-background px-3.5 sm:flex-1">
                            <Search
                                aria-hidden="true"
                                className="size-4.5 text-muted-foreground"
                            />
                            <input
                                id="not-found-search"
                                name="q"
                                type="search"
                                placeholder="Disciplina o città, es. pilates Roma"
                                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-12 rounded-lg px-5.5 text-[15px] font-semibold"
                        >
                            Cerca
                        </Button>
                    </form>
                </div>

                <nav
                    aria-label="Pagine utili"
                    className="flex flex-col gap-2.5"
                >
                    <SectionLabel as="p">Prova da qui</SectionLabel>
                    {usefulLinks.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 hover:bg-accent"
                        >
                            <span className="flex flex-1 flex-col">
                                <span className="text-[15px] font-semibold">
                                    {link.title}
                                </span>
                                <span className="text-[13px] text-muted-foreground">
                                    {link.hint}
                                </span>
                            </span>
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}
