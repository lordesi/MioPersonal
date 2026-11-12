import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, Dumbbell } from 'lucide-react';
import { register as gymRegister } from '@/routes/gym';
import { register as trainerRegister } from '@/routes/trainer';

const cards = [
    {
        title: 'Sei un personal trainer?',
        text: 'Profilo, agenda, richieste e clienti in un posto solo. Gratis.',
        action: 'Crea il tuo profilo',
        href: trainerRegister.url(),
        icon: Dumbbell,
    },
    {
        title: 'Hai una palestra?',
        text: 'Corsi, abbonamenti, promozioni e i trainer che allenano da te.',
        action: 'Registra la palestra',
        href: gymRegister.url(),
        icon: Building2,
    },
];

/** The last band of the home: the two ways in for professionals. */
export default function ProBand() {
    return (
        <section
            aria-labelledby="pro-title"
            className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-12 md:gap-6 md:px-8 md:pb-20"
        >
            <h2
                id="pro-title"
                className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
                Per i professionisti
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 md:gap-5">
                {cards.map((card) => (
                    <li key={card.title} className="flex">
                        <Link
                            href={card.href}
                            className="group flex flex-1 flex-col gap-3 rounded-[20px] bg-primary p-5 text-primary-foreground md:p-7"
                        >
                            <card.icon aria-hidden="true" className="size-6" />
                            <span className="text-xl font-semibold">
                                {card.title}
                            </span>
                            <span className="text-[15px] text-primary-foreground/75">
                                {card.text}
                            </span>
                            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold group-hover:underline">
                                {card.action}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
