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
    errorNumberClassName,
    eyebrowClassName,
    pageColumnClassName,
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
                    'max-w-180 gap-4 pb-14 md:pb-20',
                )}
            >
                <div
                    aria-hidden="true"
                    className={cn(errorNumberClassName, 'pt-6 md:pt-16')}
                >
                    404
                </div>
                <p className={eyebrowClassName}>Errore 404</p>
                <h1 className="text-[34px] leading-[1.08] font-light tracking-[-0.04em] md:text-5xl">
                    Questa pagina <br className="md:hidden" />
                    <b className="font-bold">non esiste (più).</b>
                </h1>
                <p className="text-[17px] leading-[1.4] text-muted-foreground">
                    Forse il link è sbagliato, oppure il profilo del trainer non
                    è più online. Ricominciamo da qui.
                </p>
                <form
                    role="search"
                    aria-label="Cerca un trainer"
                    onSubmit={submit}
                    className="flex flex-col gap-4"
                >
                    <label className="flex h-14 items-center gap-3 rounded-full border border-border bg-card px-5 focus-within:border-brand">
                        <Search
                            aria-hidden="true"
                            className="size-5 shrink-0 text-brand"
                        />
                        <input
                            name="q"
                            type="search"
                            aria-label="Cerca disciplina o città"
                            placeholder="Disciplina o città, es. pilates Milano"
                            className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground"
                        />
                    </label>
                    <button
                        type="submit"
                        className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand px-5.5 text-[17px] font-bold text-black shadow-[0_8px_24px_rgba(66,215,217,0.28)] outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <Search
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={2.4}
                        />
                        Cerca
                    </button>
                </form>

                <nav aria-label="Pagine utili" className="flex flex-col gap-4">
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
