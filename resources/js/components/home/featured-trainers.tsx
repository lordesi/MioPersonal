import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import TrainerCard from '@/components/trainer/trainer-card';
import { Button } from '@/components/ui/button';
import { useFavorite } from '@/hooks/use-favorite';
import { searchUrl } from '@/lib/search';
import type { TrainerSummary } from '@/types';

type FeaturedTrainersProps = {
    trainers: TrainerSummary[];
};

/**
 * Carousel of the best trainers: 3 whole cards at a time on large screens
 * (2 on tablets), the arrows at the sides move one page. No library: it is
 * the browser's own horizontal scroll (with snap), so on phones it also works
 * with the finger.
 */
export default function FeaturedTrainers({ trainers }: FeaturedTrainersProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    // The arrows are off at the start and at the end of the row.
    const updateArrows = useCallback(() => {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        setCanPrev(track.scrollLeft > 1);
        setCanNext(
            track.scrollLeft + track.clientWidth < track.scrollWidth - 1,
        );
    }, []);

    useEffect(() => {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        updateArrows();
        track.addEventListener('scroll', updateArrows, { passive: true });
        // The number of visible cards changes with the window size.
        const observer = new ResizeObserver(updateArrows);
        observer.observe(track);

        return () => {
            track.removeEventListener('scroll', updateArrows);
            observer.disconnect();
        };
    }, [updateArrows]);

    /** Moves by as many cards as fit on screen: 3 on desktop. */
    const scrollPage = (direction: 1 | -1) => {
        const track = trackRef.current;
        const [first, second] = Array.from(track?.children ?? []);

        if (!track || !(first instanceof HTMLElement)) {
            return;
        }

        // One card plus the space between two cards.
        const step =
            second instanceof HTMLElement
                ? second.offsetLeft - first.offsetLeft
                : first.offsetWidth;
        const gap = step - first.offsetWidth;
        const style = getComputedStyle(track);
        const visibleWidth =
            track.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight);
        const perPage = Math.max(1, Math.floor((visibleWidth + gap) / step));

        track.scrollBy({
            left: direction * step * perPage,
            behavior: 'smooth',
        });
    };

    if (trainers.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="featured-title"
            aria-roledescription="carousel"
            className="mx-auto flex w-full max-w-7xl flex-col gap-4 py-10 md:gap-7 md:py-18"
        >
            <div className="flex flex-wrap items-end justify-between gap-3 px-4 md:gap-4 md:px-8">
                <div className="flex flex-col gap-1.5">
                    <h2
                        id="featured-title"
                        className="text-2xl font-semibold tracking-tight md:text-3xl"
                    >
                        Trainer in evidenza
                    </h2>
                </div>
                <Link
                    href={searchUrl()}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0 md:gap-1.5"
                >
                    Vedi tutti
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            <div className="flex items-center md:px-1">
                <CarouselArrow
                    direction={-1}
                    disabled={!canPrev}
                    onClick={() => scrollPage(-1)}
                />
                {/*
                 * The sideways scroll cuts what sticks out of the row: room
                 * above and below (taken back with negative margins) for the
                 * lift and the shadow of the cards on hover. On md+ the side
                 * padding is smaller than the gap, so the next card starts
                 * just outside the visible area and no piece of it shows.
                 */}
                <div
                    ref={trackRef}
                    className="-mt-2 -mb-10 flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pt-2 pb-10 md:scroll-px-3 md:gap-4 md:px-3 [&::-webkit-scrollbar]:hidden"
                >
                    {trainers.map((trainer) => (
                        <FeaturedCard key={trainer.slug} trainer={trainer} />
                    ))}
                </div>
                <CarouselArrow
                    direction={1}
                    disabled={!canNext}
                    onClick={() => scrollPage(1)}
                />
            </div>
        </section>
    );
}

/** One card of the carousel, like the search results: each heart keeps its own state. */
function FeaturedCard({ trainer }: { trainer: TrainerSummary }) {
    const favorite = useFavorite(trainer.slug, trainer.favorite ?? false);

    return (
        <TrainerCard
            trainer={trainer}
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
            // Whole cards only: two fill the row on tablets, three on desktop.
            className="w-76 shrink-0 snap-start md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
        />
    );
}

type CarouselArrowProps = {
    direction: 1 | -1;
    disabled: boolean;
    onClick: () => void;
};

/** Arrow beside the row of cards, only from tablets up (on phones you swipe). */
function CarouselArrow({ direction, disabled, onClick }: CarouselArrowProps) {
    const Icon = direction === 1 ? ChevronRight : ChevronLeft;

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden shrink-0 rounded-full md:inline-flex"
            aria-label={
                direction === 1 ? 'Trainer successivi' : 'Trainer precedenti'
            }
            disabled={disabled}
            onClick={onClick}
        >
            <Icon aria-hidden="true" />
        </Button>
    );
}
