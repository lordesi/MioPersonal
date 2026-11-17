import { Link } from '@inertiajs/react';
import {
    Award,
    ChevronLeft,
    ChevronRight,
    Heart,
    MapPin,
    Share,
    Star,
    Video,
} from 'lucide-react';
import { useRef, useState } from 'react';
import SocialIcon, { socialLabels } from '@/components/shared/social-icon';
import { useInitials } from '@/hooks/use-initials';
import { formatRating } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { TrainerProfile } from '@/types';

/** The round buttons on the photo of the phones: back, share, heart. */
const roundOnPhoto =
    'flex size-11 items-center justify-center rounded-full border border-white/35 text-foreground outline-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The pills on the photo of desktop: "‹ Trainer a Bergamo", "Condividi", "Salva". */
const pillOnPhoto =
    'flex h-11 items-center justify-center gap-2 rounded-full bg-background/55 text-[15px] font-semibold text-foreground shadow-[inset_0_0_0_1.5px_var(--foreground)] outline-none hover:bg-background/75 focus-visible:ring-[3px] focus-visible:ring-ring/50';

type ProfileHeroProps = {
    trainer: TrainerProfile;
    /** The search of the trainer's city: "‹ Trainer a Bergamo". */
    backHref: string;
    /** The heart: null for trainers, gyms and the team (they can't save). */
    favorite: { pressed: boolean; onChange: (pressed: boolean) => void } | null;
    onShare: () => void;
};

/**
 * The top of the trainer's profile (designs "Ibrido 2" / "Desktop · Profilo
 * trainer"): the photos side by side (dots on phones, arrows and "1 / 5" on
 * desktop), then the name, rating, where, experience and the chips.
 */
export default function ProfileHero({
    trainer,
    backHref,
    favorite,
    onShare,
}: ProfileHeroProps) {
    const getInitials = useInitials();
    const scroller = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    // The gallery, or else the profile photo, or else the initials.
    const slides =
        trainer.photos.length > 0
            ? trainer.photos
            : trainer.portraitUrl
              ? [{ caption: trainer.name, url: trainer.portraitUrl }]
              : [];

    const goTo = (next: number) => {
        const element = scroller.current;

        if (element) {
            element.scrollTo({
                left: next * element.clientWidth,
                behavior: 'smooth',
            });
        }
    };

    const [firstName, ...rest] = trainer.name.split(' ');
    const goals = trainingGoals.filter((goal) =>
        trainer.goals.includes(goal.value),
    );
    // Disciplines and goals in one row; "Postura" can be both: shown once.
    const tags = [
        ...new Set([
            ...trainer.disciplines,
            ...goals.map((goal) => goal.label),
        ]),
    ];
    const city = trainer.city ? `Trainer a ${trainer.city.name}` : 'Trainer';

    return (
        <section aria-labelledby="profile-name" className="relative md:h-150">
            {/* The photos: they scroll sideways, one at a time. */}
            <div
                aria-label={`Foto di ${trainer.name}`}
                className="relative h-120 overflow-hidden bg-muted md:absolute md:inset-0 md:h-auto"
            >
                {slides.length > 0 ? (
                    <div
                        ref={scroller}
                        onScroll={(event) => {
                            const element = event.currentTarget;
                            setIndex(
                                Math.round(
                                    element.scrollLeft / element.clientWidth,
                                ),
                            );
                        }}
                        className="flex size-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    >
                        {slides.map((slide, slideIndex) => (
                            <img
                                key={slide.url}
                                src={slide.url}
                                alt={slide.caption}
                                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                                fetchPriority={
                                    slideIndex === 0 ? 'high' : undefined
                                }
                                className="size-full shrink-0 snap-start object-cover"
                            />
                        ))}
                    </div>
                ) : (
                    <span
                        role="img"
                        aria-label={`Foto profilo di ${trainer.name}`}
                        className="flex size-full items-start justify-center bg-[radial-gradient(circle_at_70%_25%,#1f4a4b_0%,#171717_60%)] pt-[18%] text-[120px] leading-none font-bold tracking-[-0.045em] text-foreground/15 md:pt-32 md:text-[200px]"
                    >
                        {getInitials(trainer.name)}
                    </span>
                )}

                {/* Phones: the fade at the bottom, under the name. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-70 bg-[linear-gradient(180deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.85)_60%,#0a0a0a_100%)] md:hidden"
                />
                {/* Desktop: dark on top (the header) and at the bottom (the name). */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(10,10,10,0.6)_0%,rgba(10,10,10,0.15)_32%,rgba(10,10,10,0.88)_80%,#0a0a0a_100%)] md:block"
                />

                {/* Phones: back, share and heart on the photo. */}
                <div className="absolute inset-x-4 top-3 flex items-center justify-between md:hidden">
                    <Link
                        href={backHref}
                        aria-label="Torna ai risultati"
                        className={roundOnPhoto}
                    >
                        <ChevronLeft aria-hidden="true" className="size-6" />
                    </Link>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-label="Condividi il profilo"
                            onClick={onShare}
                            className={roundOnPhoto}
                        >
                            <Share aria-hidden="true" className="size-5" />
                        </button>
                        {favorite && (
                            <button
                                type="button"
                                aria-label="Salva nei preferiti"
                                aria-pressed={favorite.pressed}
                                onClick={() =>
                                    favorite.onChange(!favorite.pressed)
                                }
                                className={roundOnPhoto}
                            >
                                <Heart
                                    aria-hidden="true"
                                    className={cn(
                                        'size-5',
                                        favorite.pressed &&
                                            'fill-brand text-brand',
                                    )}
                                />
                            </button>
                        )}
                    </div>
                </div>

                {/* Phones: the dots over the fade. */}
                {slides.length > 1 && (
                    <div className="absolute inset-x-0 bottom-30.5 flex justify-center md:hidden">
                        {slides.map((slide, slideIndex) => (
                            <button
                                key={slide.url}
                                type="button"
                                aria-label={`Vai alla foto ${slideIndex + 1}`}
                                aria-current={slideIndex === index}
                                onClick={() => goTo(slideIndex)}
                                className="flex h-7 w-5.5 items-center justify-center"
                            >
                                <span
                                    className={cn(
                                        'block h-1.5 rounded-full transition-[width]',
                                        slideIndex === index
                                            ? 'w-4.5 bg-foreground'
                                            : 'w-1.5 bg-foreground/50',
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop: back to the city, share and save, under the header. */}
            <div className="absolute inset-x-0 top-27 z-10 hidden px-8 md:block">
                <div className="mx-auto flex max-w-284 items-center justify-between">
                    <Link
                        href={backHref}
                        className={cn(pillOnPhoto, 'pr-4.5 pl-3')}
                    >
                        <ChevronLeft aria-hidden="true" className="size-5" />
                        {city}
                    </Link>
                    <div className="flex gap-2.5">
                        <button
                            type="button"
                            onClick={onShare}
                            className={cn(pillOnPhoto, 'px-4.5')}
                        >
                            <Share aria-hidden="true" className="size-4.5" />
                            Condividi
                        </button>
                        {favorite && (
                            <button
                                type="button"
                                aria-pressed={favorite.pressed}
                                onClick={() =>
                                    favorite.onChange(!favorite.pressed)
                                }
                                className={cn(pillOnPhoto, 'px-4.5')}
                            >
                                <Heart
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4.5',
                                        favorite.pressed &&
                                            'fill-brand text-brand',
                                    )}
                                />
                                {favorite.pressed ? 'Salvato' : 'Salva'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Name and the rest: over the fade on phones, at the bottom of the photo on desktop. */}
            <div className="relative z-10 -mt-27.5 px-4 md:absolute md:inset-x-0 md:bottom-9 md:mt-0 md:px-8">
                <div className="mx-auto flex max-w-284 items-end justify-between gap-8">
                    <div className="flex min-w-0 flex-col gap-3 md:gap-3.5">
                        <h1
                            id="profile-name"
                            className="text-[28px] leading-8.5 font-bold tracking-[0.38px] md:text-[64px] md:leading-[1.05] md:font-light md:tracking-[-0.03em]"
                        >
                            {firstName}{' '}
                            <span className="md:font-bold">
                                {rest.join(' ')}
                            </span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] text-muted-foreground md:gap-x-4.5 md:text-base">
                            {trainer.rating !== null && (
                                <a
                                    href="#recensioni"
                                    className="flex items-center gap-1 font-semibold text-foreground md:gap-1.5"
                                >
                                    <Star
                                        aria-hidden="true"
                                        className="size-4.5 fill-brand text-brand"
                                    />
                                    {formatRating(trainer.rating)}{' '}
                                    <span className="font-normal text-muted-foreground underline md:no-underline">
                                        <span className="hidden md:inline">
                                            (
                                        </span>
                                        {trainer.reviewCount}{' '}
                                        {trainer.reviewCount === 1
                                            ? 'recensione'
                                            : 'recensioni'}
                                        <span className="hidden md:inline">
                                            )
                                        </span>
                                    </span>
                                </a>
                            )}
                            {trainer.online !== 'only' && (
                                <span className="flex items-center gap-1 md:gap-1.5">
                                    <MapPin
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                    {trainer.cities.join(', ')}
                                </span>
                            )}
                            {trainer.online && (
                                <span className="flex items-center gap-1 md:gap-1.5">
                                    <Video
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                    {trainer.online === 'only'
                                        ? 'Solo online'
                                        : 'Anche online'}
                                </span>
                            )}
                            <span className="flex items-center gap-1 md:gap-1.5">
                                <Award
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                                {trainer.experienceLabel}
                            </span>
                        </div>

                        {tags.length > 0 && (
                            <ul className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                                {tags.map((tag) => (
                                    <li
                                        key={tag}
                                        className="flex h-5.5 shrink-0 items-center rounded-full border border-field px-2 text-[11px] whitespace-nowrap md:h-7 md:px-3 md:text-[13px] md:font-semibold"
                                    >
                                        {tag}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {trainer.socials.length > 0 && (
                            <ul className="flex gap-1">
                                {trainer.socials.map((social) => (
                                    <li key={social.provider}>
                                        <a
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer me"
                                            aria-label={`${socialLabels[social.provider]} di ${trainer.name}: @${social.handle} (si apre in una nuova scheda)`}
                                            title={`${socialLabels[social.provider]} · @${social.handle}`}
                                            className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4.5"
                                        >
                                            <SocialIcon
                                                provider={social.provider}
                                            />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Desktop: the arrows and "1 / 5". */}
                    {slides.length > 1 && (
                        <div className="hidden shrink-0 items-center gap-3 md:flex">
                            <button
                                type="button"
                                aria-label="Foto precedente"
                                disabled={index === 0}
                                onClick={() => goTo(index - 1)}
                                className={cn(
                                    pillOnPhoto,
                                    'w-11 disabled:opacity-40',
                                )}
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                            <span className="min-w-11 text-center text-[15px] font-semibold tabular-nums">
                                {index + 1} / {slides.length}
                            </span>
                            <button
                                type="button"
                                aria-label="Foto successiva"
                                disabled={index === slides.length - 1}
                                onClick={() => goTo(index + 1)}
                                className={cn(
                                    pillOnPhoto,
                                    'w-11 disabled:opacity-40',
                                )}
                            >
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
