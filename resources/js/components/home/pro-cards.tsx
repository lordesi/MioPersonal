import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { register as gymRegister } from '@/routes/gym';
import { register as trainerRegister } from '@/routes/trainer';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { hoverPrefetch } from '@/lib/prefetch';

const cards: {
    title: string;
    text: string;
    action: string;
    href: string;
    image: string;
    position: string;
    feature?: FeatureName;
}[] = [
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
        feature: 'gyms',
    },
];

/** "Per i professionisti": the sign-ups switched on, on a photo each. */
export default function ProCards() {
    const shown = withFeatures(cards, useFeatures());

    return (
        <section
            aria-labelledby="pro-title"
            className="mx-auto flex w-full max-w-300 flex-col gap-3.5 px-4 pt-11 pb-14 md:gap-5 md:px-8 md:pt-18 md:pb-20"
        >
            <h2
                id="pro-title"
                className="text-[22px] leading-7 font-bold tracking-[-0.02em] md:text-[28px] md:leading-8.5"
            >
                Per i professionisti
            </h2>
            <div
                className={cn(
                    'grid gap-3 md:gap-5',
                    shown.length > 1 && 'md:grid-cols-2',
                )}
            >
                {shown.map((card) => (
                    <div
                        key={card.title}
                        className="relative flex h-75 flex-col justify-end overflow-hidden rounded-[32px] border border-border bg-card p-5 md:h-95 md:p-8"
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
                            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.92)_100%)]"
                        />
                        <div className="relative flex flex-col items-start gap-2">
                            <h3 className="text-2xl leading-7 font-bold tracking-[-0.02em] md:text-[28px] md:leading-8.5">
                                {card.title}
                            </h3>
                            <p className="mb-1.5 max-w-105 text-[15px] leading-[1.4] text-subtle-foreground md:mb-3 md:text-base">
                                {card.text}
                            </p>
                            <Link
                                prefetch={hoverPrefetch}
                                href={card.href}
                                className="inline-flex h-11.5 items-center rounded-full bg-brand px-5 text-base font-bold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring"
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
