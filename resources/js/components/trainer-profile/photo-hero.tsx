import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Heart, Share } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The round buttons on the photo of the phones: back, share, heart. */
const roundOnPhoto =
    'flex size-11 items-center justify-center rounded-full border border-white/35 text-foreground outline-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The pills on the photo of desktop: "‹ Trainer a Bergamo", "Condividi", "Salva". */
export const pillOnPhoto =
    'flex h-11 items-center justify-center gap-2 rounded-full bg-background/55 text-[15px] font-semibold text-foreground shadow-[inset_0_0_0_1.5px_var(--foreground)] outline-none hover:bg-background/75 focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The big name on the photo: bold on phones, light 64px on desktop. */
export const heroTitleClassName =
    'text-[28px] leading-8.5 font-bold tracking-[0.38px] break-words md:text-[64px] md:leading-[1.05] md:font-light md:tracking-[-0.03em]';

/** The grey line under the name: rating, where, how long. */
export const heroFactsClassName =
    'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] text-muted-foreground md:gap-x-4.5 md:text-base';

/** A chip under the name: "Pilates", "Workshop". */
export const heroChipClassName =
    'flex h-5.5 shrink-0 items-center rounded-full border border-field px-2 text-[11px] whitespace-nowrap md:h-7 md:px-3 md:text-[13px] md:font-semibold';

/** "Marco Rossi" → "Marco <b>Rossi</b>": the first word light on desktop. */
export function SplitName({ name }: { name: string }) {
    const [first, ...rest] = name.split(' ');

    return (
        <>
            {first} <span className="md:font-bold">{rest.join(' ')}</span>
        </>
    );
}

type PhotoHeroProps = {
    /** The id of the h1 inside children. */
    titleId: string;
    /** "Foto di Marco Rossi". */
    photosLabel: string;
    slides: { caption: string; url: string }[];
    /** Without photos: the initials, an icon… on the turquoise shade. */
    placeholder: ReactNode;
    backHref: string;
    /** Phones: the label of the round arrow. */
    backLabel: string;
    /** Desktop: the pill, e.g. "Trainer a Bergamo". */
    backText: string;
    /** Null: no share button (a preview). */
    onShare: (() => void) | null;
    shareLabel: string;
    /** The heart: null for who can't save. */
    favorite: { pressed: boolean; onChange: (pressed: boolean) => void } | null;
    /** The name and what is under it. */
    children: ReactNode;
};

/**
 * The top of the public profiles (designs "Ibrido 2" / "Desktop · Profilo
 * trainer"): the photos side by side (dots on phones, arrows and "1 / 5" on
 * desktop), back/share/heart on them, then the name at the bottom.
 */
export default function PhotoHero({
    titleId,
    photosLabel,
    slides,
    placeholder,
    backHref,
    backLabel,
    backText,
    onShare,
    shareLabel,
    favorite,
    children,
}: PhotoHeroProps) {
    const scroller = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    const goTo = (next: number) => {
        const element = scroller.current;

        if (element) {
            element.scrollTo({
                left: next * element.clientWidth,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section aria-labelledby={titleId} className="relative md:h-150">
            {/* The photos: they scroll sideways, one at a time. */}
            <div
                aria-label={photosLabel}
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
                    placeholder
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
                        aria-label={backLabel}
                        className={roundOnPhoto}
                    >
                        <ChevronLeft aria-hidden="true" className="size-6" />
                    </Link>
                    <div className="flex gap-2">
                        {onShare && (
                            <button
                                type="button"
                                aria-label={shareLabel}
                                onClick={onShare}
                                className={roundOnPhoto}
                            >
                                <Share aria-hidden="true" className="size-5" />
                            </button>
                        )}
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

            {/* Desktop: back, share and save, under the header. */}
            <div className="absolute inset-x-0 top-27 z-10 hidden px-8 md:block">
                <div className="mx-auto flex max-w-284 items-center justify-between">
                    <Link
                        href={backHref}
                        className={cn(pillOnPhoto, 'pr-4.5 pl-3')}
                    >
                        <ChevronLeft aria-hidden="true" className="size-5" />
                        {backText}
                    </Link>
                    <div className="flex gap-2.5">
                        {onShare && (
                            <button
                                type="button"
                                onClick={onShare}
                                className={cn(pillOnPhoto, 'px-4.5')}
                            >
                                <Share
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                                Condividi
                            </button>
                        )}
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
                        {children}
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

/** No photo: a big icon on the turquoise shade (gyms, events). */
export function IconPlaceholder({
    icon: Icon,
    label,
}: {
    icon: typeof Share;
    label: string;
}) {
    return (
        <span
            role="img"
            aria-label={label}
            className="flex size-full items-start justify-center bg-[radial-gradient(circle_at_70%_25%,#1f4a4b_0%,#171717_60%)] pt-[22%] text-foreground/15 md:pt-36"
        >
            <Icon aria-hidden="true" className="size-28 md:size-44" />
        </span>
    );
}
