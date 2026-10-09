import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import { bookings } from '@/routes/client';
import { show as contactPage } from '@/routes/contact';

const usefulLinks = [
    {
        title: 'Torna alla home',
        hint: 'Trova trainer, quiz e come funziona',
        href: home.url(),
    },
    {
        title: 'Cerca un trainer',
        hint: 'Per disciplina, zona e disponibilità',
        href: searchUrl(),
    },
    {
        title: 'Le mie prenotazioni',
        hint: 'Se avevi un link a una prenotazione',
        href: bookings.url(),
    },
    {
        title: 'Centro assistenza',
        hint: 'Scrivici se pensi che sia un errore',
        href: contactPage.url(),
    },
];

/** Shown by bootstrap/app.php for every 404 (unknown address, missing trainer…). */
export default function NotFound() {
    const submit = (event: FormEvent) => {
        event.preventDefault();
        // TODO: pass the text once the search accepts free text ("pilates Isola").
        router.get(searchUrl());
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
                        <div className="flex h-12 flex-1 items-center gap-2.5 rounded-lg border border-input bg-background px-3.5">
                            <Search
                                aria-hidden="true"
                                className="size-4.5 text-muted-foreground"
                            />
                            <input
                                id="not-found-search"
                                type="search"
                                placeholder="Disciplina o zona, es. pilates Isola"
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

NotFound.layout = { footer: 'compact' };
