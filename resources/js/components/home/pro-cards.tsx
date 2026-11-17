import { Link } from '@inertiajs/react';
import { register as gymRegister } from '@/routes/gym';
import { register as trainerRegister } from '@/routes/trainer';

const cards = [
    {
        title: 'Sei un personal trainer?',
        text: 'Profilo, agenda, richieste e clienti in un posto solo. Gratis.',
        action: 'Crea il tuo profilo',
        href: trainerRegister.url(),
        image: '/images/design/pro-trainer.webp',
        position: 'object-[50%_35%]',
    },
    {
        title: 'Hai una palestra?',
        text: 'Corsi, abbonamenti, promozioni e i trainer che allenano da te.',
        action: 'Registra la palestra',
        href: gymRegister.url(),
        image: '/images/design/pro-gym.webp',
        position: 'object-[50%_40%]',
    },
];

/** "Per i professionisti": the two sign-ups, on a photo each. */
export default function ProCards() {
    return (
        <section
            aria-labelledby="pro-title"
            className="mx-auto flex w-full max-w-300 flex-col gap-3 px-4 pt-10 pb-12 md:gap-5 md:px-8 md:pt-18 md:pb-20"
        >
            <h2
                id="pro-title"
                className="mb-1 text-[22px] leading-7 font-bold tracking-[-0.26px] md:mb-0 md:text-[28px] md:leading-8.5"
            >
                Per i professionisti
            </h2>
            <div className="grid gap-3 md:grid-cols-2 md:gap-5">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="relative flex min-h-65 flex-col justify-end overflow-hidden rounded-[26px] border border-white/10 p-5 md:min-h-95 md:p-8"
                    >
                        <img
                            src={card.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className={`absolute inset-0 size-full object-cover ${card.position}`}
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.1)_0%,rgba(10,10,10,0.55)_45%,rgba(10,10,10,0.94)_85%)]"
                        />
                        <div className="relative flex flex-col items-start gap-2">
                            <h3 className="text-xl leading-6.5 font-semibold tracking-[-0.45px] md:text-[26px] md:leading-8 md:font-bold">
                                {card.title}
                            </h3>
                            <p className="mb-2 max-w-105 text-[15px] leading-5 text-[#d6d6d6] md:mb-3 md:text-base md:leading-5.5">
                                {card.text}
                            </p>
                            <Link
                                href={card.href}
                                className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-[15px] font-semibold text-primary-foreground outline-none hover:brightness-105 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                {card.action}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
