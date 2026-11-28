import { Link } from '@inertiajs/react';
import { ChevronLeft, Grid2x2, Heart, Share } from 'lucide-react';
import { useRef, useState } from 'react';
import PhotoLightbox from '@/components/trainer-profile/photo-lightbox';
import { useInitials } from '@/hooks/use-initials';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';

type Slide = { caption: string; url: string };

type ProfileGalleryProps = {
    name: string;
    slides: Slide[];
    backHref: string;
    onShare: () => void;
    /** The heart: only for guests and clients. */
    favorite: { pressed: boolean; onChange: (pressed: boolean) => void } | null;
};

/** Round button on the photo (back, share, heart). */
const roundButton =
    'flex size-11 items-center justify-center rounded-full bg-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Phones (design "V1 · Foto a scorrimento"): the photos side by side, a
 * swipe or a tap on the sides changes photo, the dots and "1 / 5" at the
 * bottom; back, share and the heart on top. A tap in the middle opens the
 * photo full screen. On the iPhone the photo goes up under the clock
 * (viewport-fit=cover, lib/zoom-lock.ts): the buttons stay under it.
 */
export function MobileGallery({
    name,
    slides,
    backHref,
    onShare,
    favorite,
}: ProfileGalleryProps) {
    const getInitials = useInitials();
    const track = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState<number | null>(null);
    const total = slides.length;

    const go = (next: number) => {
        const target = (next + total) % total;
        track.current?.scrollTo({
            left: target * track.current.clientWidth,
            behavior: 'smooth',
        });
    };

    return (
        <section
            aria-label={`Foto di ${name}`}
            className="relative h-[calc(27.5rem+env(safe-area-inset-top))] overflow-hidden rounded-b-[28px] bg-card md:hidden"
        >
            {total > 0 ? (
                <div
                    ref={track}
                    onScroll={(event) =>
                        setIndex(
                            Math.round(
                                event.currentTarget.scrollLeft /
                                    event.currentTarget.clientWidth,
                            ),
                        )
                    }
                    className="flex size-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
                >
                    {slides.map((slide, position) => (
                        <button
                            key={slide.url}
                            type="button"
                            aria-label={`Apri la foto ${position + 1} a schermo intero`}
                            onClick={() => setOpen(position)}
                            className="h-full w-full shrink-0 snap-center outline-none"
                        >
                            <img
                                src={slide.url}
                                alt={slide.caption}
                                loading={position === 0 ? 'eager' : 'lazy'}
                                fetchPriority={
                                    position === 0 ? 'high' : undefined
                                }
                                className="size-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            ) : (
                <span
                    role="img"
                    aria-label={`Foto profilo di ${name}`}
                    className="flex size-full items-center justify-center text-[120px] leading-none font-bold tracking-[-0.045em] text-foreground/15"
                >
                    {getInitials(name)}
                </span>
            )}

            {total > 1 && (
                <>
                    <button
                        type="button"
                        aria-label="Foto precedente"
                        onClick={() => go(index - 1)}
                        className="absolute top-[calc(4.5rem+env(safe-area-inset-top))] bottom-14 left-0 w-[30%] outline-none"
                    />
                    <button
                        type="button"
                        aria-label="Foto successiva"
                        onClick={() => go(index + 1)}
                        className="absolute top-[calc(4.5rem+env(safe-area-inset-top))] right-0 bottom-14 w-[30%] outline-none"
                    />
                    <div className="absolute inset-x-0 bottom-3.5 flex justify-center">
                        {slides.map((slide, position) => (
                            <button
                                key={slide.url}
                                type="button"
                                aria-label={`Vai alla foto ${position + 1}`}
                                aria-current={position === index}
                                onClick={() => go(position)}
                                className="flex h-7 w-5.5 items-center justify-center outline-none"
                            >
                                <span
                                    className={cn(
                                        'block h-1.5 rounded-full transition-[width] duration-200',
                                        position === index
                                            ? 'w-4.5 bg-foreground'
                                            : 'w-1.5 bg-foreground/50',
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <span
                        aria-live="polite"
                        className="absolute right-4 bottom-4 flex h-6.5 items-center rounded-full bg-black/60 px-2.5 text-[13px] font-semibold tabular-nums"
                    >
                        {index + 1} / {total}
                    </span>
                </>
            )}

            {/* Dark behind the clock and the battery, readable on any photo. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[calc(5rem+env(safe-area-inset-top))] bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0)_100%)]"
            />
            <div className="absolute inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
                <Link
                    prefetch={hoverPrefetch}
                    href={backHref}
                    aria-label="Torna ai risultati"
                    className={roundButton}
                >
                    <ChevronLeft aria-hidden="true" className="size-5.5" />
                </Link>
                <div className="flex gap-2">
                    <button
                        type="button"
                        aria-label="Condividi il profilo"
                        onClick={onShare}
                        className={roundButton}
                    >
                        <Share aria-hidden="true" className="size-5" />
                    </button>
                    {favorite && (
                        <button
                            type="button"
                            aria-pressed={favorite.pressed}
                            aria-label={
                                favorite.pressed
                                    ? 'Togli dai preferiti'
                                    : 'Salva nei preferiti'
                            }
                            onClick={() => favorite.onChange(!favorite.pressed)}
                            className={cn(
                                roundButton,
                                favorite.pressed && 'text-brand',
                            )}
                        >
                            <Heart
                                aria-hidden="true"
                                className={cn(
                                    'size-5',
                                    favorite.pressed && 'fill-current',
                                )}
                            />
                        </button>
                    )}
                </div>
            </div>

            <PhotoLightbox
                title={`Foto di ${name}`}
                slides={slides}
                openIndex={open}
                onOpenChange={setOpen}
            />
        </section>
    );
}

/**
 * Desktop (design "V1 · Griglia 1+4"): the first photo big, up to four on
 * the right, "Mostra tutte le foto" opens them full screen.
 */
export function DesktopGallery({
    name,
    slides,
}: Pick<ProfileGalleryProps, 'name' | 'slides'>) {
    const getInitials = useInitials();
    const [open, setOpen] = useState<number | null>(null);
    const shown = slides.slice(0, 5);

    if (shown.length === 0) {
        return (
            <section
                aria-label={`Foto di ${name}`}
                className="hidden h-117 items-center justify-center rounded-[20px] bg-card text-[200px] leading-none font-bold tracking-[-0.045em] text-foreground/15 md:flex"
            >
                <span role="img" aria-label={`Foto profilo di ${name}`}>
                    {getInitials(name)}
                </span>
            </section>
        );
    }

    return (
        <section
            aria-label={`Foto di ${name}`}
            className="relative hidden md:block"
        >
            <div
                className={cn(
                    'grid h-117 gap-2 overflow-hidden rounded-[20px]',
                    shown.length === 1 && 'grid-cols-1',
                    shown.length === 2 && 'grid-cols-2',
                    shown.length === 3 && 'grid-cols-[2fr_1fr] grid-rows-2',
                    shown.length >= 4 && 'grid-cols-[2fr_1fr_1fr] grid-rows-2',
                )}
            >
                {shown.map((slide, position) => (
                    <button
                        key={slide.url}
                        type="button"
                        aria-label={`Apri la foto ${position + 1} a schermo intero`}
                        onClick={() => setOpen(position)}
                        className={cn(
                            'group/photo min-h-0 overflow-hidden bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                            position === 0 && shown.length >= 3 && 'row-span-2',
                            // Four: the last one takes the whole bottom right.
                            position === 3 &&
                                shown.length === 4 &&
                                'col-span-2',
                        )}
                    >
                        <img
                            src={slide.url}
                            alt={slide.caption}
                            loading={position === 0 ? 'eager' : 'lazy'}
                            className="size-full object-cover transition-transform duration-500 group-hover/photo:scale-[1.03]"
                        />
                    </button>
                ))}
            </div>
            {slides.length > 1 && (
                <button
                    type="button"
                    onClick={() => setOpen(0)}
                    className="absolute right-5 bottom-5 flex h-11 items-center gap-2 rounded-xl bg-brand px-4.5 text-[15px] font-semibold text-black outline-none hover:brightness-105 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Grid2x2 aria-hidden="true" className="size-4.5" />
                    Mostra tutte le foto
                </button>
            )}
            <PhotoLightbox
                title={`Foto di ${name}`}
                slides={slides}
                openIndex={open}
                onOpenChange={setOpen}
            />
        </section>
    );
}
