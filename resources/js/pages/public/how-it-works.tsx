import { Head, Link } from '@inertiajs/react';
import { Building2, Dumbbell } from 'lucide-react';
import {
    IconBadge,
    LinkCard,
    PageBreadcrumb,
    brandFilledClassName,
    brandOutlineClassName,
    pageColumnClassName,
    pageTitleClassName,
    sectionTitleClassName,
} from '@/components/mp/page-bits';
import {
    searchKinds,
    searchKindUrl,
} from '@/components/search/search-kind-toggle';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import FaqList from '@/components/seo/faq-list';
import type { FaqItem } from '@/components/seo/faq-list';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
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
    course: 'I corsi della settimana delle palestre: giorno, orario, livello e posti. Per partecipare chiedi alla palestra.',
    event: 'Open day, workshop e allenamenti di gruppo: prenoti il posto in pochi secondi.',
};

const pros = [
    {
        title: 'Sei un personal trainer?',
        text: 'Profilo, agenda, richieste e clienti in un posto solo.',
        href: trainerRegister.url(),
        icon: Dumbbell,
    },
    {
        title: 'Hai una palestra?',
        text: 'Profilo, corsi, eventi, abbonamenti e i tuoi trainer.',
        href: gymRegister.url(),
        icon: Building2,
    },
];

/**
 * "Come funziona": what MioPersonal is, in plain words. The page people,
 * search engines and AI assistants read when they ask about it.
 */
export default function HowItWorks({ summary, faq }: HowItWorksProps) {
    return (
        <div
            className={cn(
                pageColumnClassName,
                'gap-10 pb-12 md:gap-16 md:pb-24',
            )}
        >
            <Head title="Come funziona MioPersonal" />

            <header className="flex flex-col gap-3 pt-2 md:gap-4 md:pt-6">
                <PageBreadcrumb current="Come funziona" />
                <h1 className={pageTitleClassName}>
                    Come funziona MioPersonal
                </h1>
                <p className="text-[17px] leading-6 text-muted-foreground md:max-w-170 md:text-xl md:leading-7.5">
                    {summary}
                </p>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-3">
                    <Link href={searchUrl()} className={brandFilledClassName}>
                        Cerca un personal trainer
                    </Link>
                    <Link
                        href={trainerRegister()}
                        className={cn(brandOutlineClassName, 'max-md:h-11')}
                    >
                        Sei un trainer?
                    </Link>
                </div>
            </header>

            <section
                aria-labelledby="explore-title"
                className="flex flex-col gap-3 md:gap-5"
            >
                <h2 id="explore-title" className={sectionTitleClassName}>
                    Cosa trovi su MioPersonal
                </h2>
                <ul className="grid grid-cols-2 gap-2 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] md:gap-4">
                    {searchKinds.map((kind) => (
                        <li key={kind.value}>
                            <Link
                                href={searchKindUrl(kind.value)}
                                className="flex h-full flex-col gap-2.5 rounded-[20px] border border-brand p-4 outline-none hover:bg-brand/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:gap-3 md:p-6"
                            >
                                <IconBadge icon={kind.icon} />
                                <span className="text-[15px] font-semibold md:text-xl md:leading-6.25 md:tracking-[-0.45px]">
                                    {kind.label}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground md:text-[15px] md:leading-5.25">
                                    {kindHints[kind.value]}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <FaqList items={faq} />

            <section
                aria-labelledby="pros-title"
                className="flex flex-col gap-3 md:gap-5"
            >
                <h2 id="pros-title" className={sectionTitleClassName}>
                    Per i professionisti
                </h2>
                <ul className="grid gap-2 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-4">
                    {pros.map((item) => (
                        <li key={item.title}>
                            <LinkCard
                                href={item.href}
                                icon={item.icon}
                                title={item.title}
                            >
                                {item.text}
                            </LinkCard>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
