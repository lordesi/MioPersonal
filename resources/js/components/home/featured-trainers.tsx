import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import TrainerCard from '@/components/trainer/trainer-card';
import { Button } from '@/components/ui/button';
import { searchUrl } from '@/lib/search';
import type { TrainerSummary } from '@/types';

type FeaturedTrainersProps = {
    trainers: TrainerSummary[];
};

/**
 * Carousel of the best trainers: 3 cards at a time on large screens, the
 * arrows move one page. No library: it is the browser's own horizontal
 * scroll (with snap), so on phones it also works with the finger.
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
                    <p className="text-muted-foreground">
                        Con il primo orario libero già in vista.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={searchUrl()}
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0 md:gap-1.5"
                    >
                        Vedi tutti
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                    <div className="hidden gap-2 md:flex">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            aria-label="Trainer precedenti"
                            disabled={!canPrev}
                            onClick={() => scrollPage(-1)}
                        >
                            <ChevronLeft aria-hidden="true" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            aria-label="Trainer successivi"
                            disabled={!canNext}
                            onClick={() => scrollPage(1)}
                        >
                            <ChevronRight aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
            <div
                ref={trackRef}
                className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1 md:scroll-px-8 md:px-8 lg:gap-6 [&::-webkit-scrollbar]:hidden"
            >
                {trainers.map((trainer) => (
                    <TrainerCard
                        key={trainer.slug}
                        trainer={trainer}
                        layout="featured"
                        // Three cards and two gaps fill the row on desktop.
                        className="w-68 shrink-0 snap-start md:w-80 lg:w-[calc((100%-3rem)/3)]"
                    />
                ))}
            </div>
        </section>
    );
}
