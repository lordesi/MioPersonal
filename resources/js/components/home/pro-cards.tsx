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
        // Sharp and dark like the rest of the home: the athlete on the right, under the light.
        image: '/images/design/login-desktop.webp',
        position: 'object-[22%_50%] md:object-[62%_50%]',
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

/**
 * "Per i professionisti": the sign-ups switched on, on a photo each. One
 * alone on desktop (design "Home · desktop"): a wide card, the text on the
 * left and the photo fading in on the right.
 */
export default function ProCards() {
    const shown = withFeatures(cards, useFeatures());
    const wide = shown.length === 1;

    return (
        <section
            aria-labelledby="pro-title"
            className="mx-auto flex w-full max-w-300 flex-col gap-3.5 px-4 pt-11 pb-14 md:gap-5 md:px-8 md:pt-18 md:pb-20"
        >
            <h2
                id="pro-title"
                className="text-[22px] leading-7 font-bold tracking-[-0.02em] md:text-[30px] md:leading-9"
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
                        className={cn(
                            'relative flex h-75 flex-col justify-end overflow-hidden rounded-[32px] border border-border bg-card p-5 md:h-95 md:p-8',
                            wide &&
                                'md:h-87 md:justify-center md:rounded-[36px] md:border-0 md:px-14',
                        )}
                    >
                        <img
                            src={card.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className={cn(
                                'absolute inset-0 size-full object-cover',
                                card.position,
                                wide &&
                                    'md:right-0 md:left-auto md:w-[min(640px,55%)] md:mask-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.6)_30%,#000000_60%)]',
                            )}
                        />
                        <div
                            aria-hidden="true"
                            className={cn(
                                'absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.92)_100%)]',
                                wide && 'md:hidden',
                            )}
                        />
                        <div
                            className={cn(
                                'relative flex flex-col items-start gap-2',
                                wide && 'md:max-w-125 md:gap-3',
                            )}
                        >
                            <h3
                                className={cn(
                                    'text-2xl leading-7 font-bold tracking-[-0.02em] md:text-[28px] md:leading-8.5',
                                    wide &&
                                        'md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]',
                                )}
                            >
                                {card.title}
                            </h3>
                            <p
                                className={cn(
                                    'mb-1.5 max-w-105 text-[15px] leading-[1.4] text-subtle-foreground md:mb-3 md:text-base',
                                    wide &&
                                        'md:max-w-115 md:text-lg md:leading-[1.45]',
                                )}
                            >
                                {card.text}
                            </p>
                            <Link
                                prefetch={hoverPrefetch}
                                href={card.href}
                                className={cn(
                                    'inline-flex h-11.5 items-center rounded-full bg-brand px-5 text-base font-bold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring',
                                    wide && 'md:h-13 md:px-6.5 md:text-[17px]',
                                )}
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
