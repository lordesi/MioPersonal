import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import {
    searchKinds,
    searchKindUrl,
} from '@/components/search/search-kind-toggle';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import FaqList from '@/components/seo/faq-list';
import type { FaqItem } from '@/components/seo/faq-list';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import { home } from '@/routes';
import { register as gymRegister } from '@/routes/gym';
import { register as trainerRegister } from '@/routes/trainer';

type HowItWorksProps = {
    /** "MioPersonal è la piattaforma italiana…" (App\Support\HowItWorks). */
    summary: string;
    /** The same answers as the FAQPage JSON-LD and /llms.txt. */
    faq: FaqItem[];
};

/** What each of the four searches is for. */
const kindHints: Record<SearchKind, string> = {
    trainer:
        'Personal trainer certificati: orari liberi, prezzi e recensioni, prenoti la seduta.',
    gym: 'Palestre con servizi, abbonamenti, promozioni e i trainer che ci lavorano.',
    course: 'I corsi della settimana delle palestre: giorno, orario e livello, in alcuni prenoti il posto.',
    event: 'Open day, workshop e allenamenti di gruppo: prenoti il posto in pochi secondi.',
};

const pros = [
    {
        title: 'Sei un personal trainer?',
        text: 'Profilo, agenda, richieste e clienti in un posto solo.',
        href: trainerRegister.url(),
    },
    {
        title: 'Hai una palestra?',
        text: 'Profilo, corsi, eventi, abbonamenti e i tuoi trainer.',
        href: gymRegister.url(),
    },
];

/**
 * "Come funziona": what MioPersonal is, in plain words. The page people,
 * search engines and AI assistants read when they ask about it.
 */
export default function HowItWorks({ summary, faq }: HowItWorksProps) {
    return (
        <div className="mx-auto flex w-full max-w-300 flex-col gap-8 px-4 pt-5 pb-10 md:gap-10 md:px-8 md:pt-10 md:pb-20">
            <Head title="Come funziona MioPersonal" />

            <div className="flex max-w-195 flex-col gap-6">
                <nav
                    aria-label="Percorso"
                    className="text-sm text-muted-foreground"
                >
                    <Link href={home()} className="hover:underline">
                        Home
                    </Link>{' '}
                    /{' '}
                    <span aria-current="page" className="text-foreground">
                        Come funziona
                    </span>
                </nav>

                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl leading-9 font-bold tracking-tighter md:text-[44px] md:leading-12">
                        Come funziona MioPersonal
                    </h1>
                    <p className="text-lg text-muted-foreground">{summary}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        asChild
                        className="h-11 rounded-xl px-5 font-semibold"
                    >
                        <Link href={searchUrl()}>
                            Cerca un personal trainer
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-xl px-5 font-semibold"
                    >
                        <Link href={trainerRegister()}>Sei un trainer?</Link>
                    </Button>
                </div>
            </div>

            <section
                aria-labelledby="explore-title"
                className="flex flex-col gap-4"
            >
                <h2
                    id="explore-title"
                    className="text-[22px] leading-7 font-bold tracking-[-0.02em]"
                >
                    Cosa trovi su MioPersonal
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {searchKinds.map((kind) => (
                        <li key={kind.value}>
                            <Link
                                href={searchKindUrl(kind.value)}
                                className="flex h-full flex-col gap-2 rounded-2xl border bg-card p-4 hover:border-foreground/30"
                            >
                                <kind.icon
                                    aria-hidden="true"
                                    className="size-5"
                                />
                                <span className="font-semibold">
                                    {kind.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {kindHints[kind.value]}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <FaqList items={faq} className="max-w-195" />

            <section
                aria-labelledby="pros-title"
                className="flex flex-col gap-4"
            >
                <h2
                    id="pros-title"
                    className="text-[22px] leading-7 font-bold tracking-[-0.02em]"
                >
                    Per i professionisti
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                    {pros.map((item) => (
                        <li key={item.title}>
                            <Link
                                href={item.href}
                                className="flex h-full items-center justify-between gap-4 rounded-2xl bg-primary p-5 text-primary-foreground hover:bg-primary/90"
                            >
                                <span className="flex flex-col gap-1">
                                    <span className="text-lg font-bold">
                                        {item.title}
                                    </span>
                                    <span className="text-sm text-primary-foreground/75">
                                        {item.text}
                                    </span>
                                </span>
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
