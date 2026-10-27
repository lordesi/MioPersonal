import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Panel from '@/components/trainer/area/panel';
import PackageProgress from '@/components/trainer/package-progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ClientPackage } from '@/types';

type PackageCarouselProps = {
    packages: ClientPackage[];
};

/**
 * "I tuoi pacchetti": one package at a time in a black card, with the
 * sessions left and "Prenota la prossima seduta". The arrows (and the dots
 * under it) move between the packages; with only one they are hidden.
 * Packages don't expire.
 */
export default function PackageCarousel({ packages }: PackageCarouselProps) {
    const [index, setIndex] = useState(0);
    const count = packages.length;
    // A package can disappear after a reload (all done): stay in range.
    const current = Math.min(index, count - 1);
    const pack = packages[current];
    const left = pack.total - pack.done;
    const toBook = pack.total - pack.booked;

    const move = (step: number) => setIndex((current + step + count) % count);

    return (
        <Panel
            title="I tuoi pacchetti"
            className="rounded-3xl"
            action={
                count > 1 && (
                    <span className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label="Pacchetto precedente"
                            onClick={() => move(-1)}
                        >
                            <ChevronLeft aria-hidden="true" />
                        </Button>
                        <span
                            aria-live="polite"
                            className="min-w-10 text-center text-[13px] leading-4.5 font-semibold text-muted-foreground tabular-nums"
                        >
                            {current + 1} di {count}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label="Pacchetto successivo"
                            onClick={() => move(1)}
                        >
                            <ChevronRight aria-hidden="true" />
                        </Button>
                    </span>
                )
            }
        >
            <div className="flex flex-col gap-3.5 rounded-[18px] bg-sidebar p-4.5 text-sidebar-foreground">
                <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        {pack.name}
                    </span>
                    <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                        con{' '}
                        <Link
                            href={pack.trainerHref}
                            className="hover:underline"
                        >
                            {pack.trainerName}
                        </Link>
                    </span>
                </span>
                <span className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-[44px] leading-11.5 font-bold tracking-[-0.03em]">
                        {left}
                    </span>
                    <span className="text-sm text-sidebar-foreground/85">
                        {left === 1 ? 'seduta rimasta' : 'sedute rimaste'} su{' '}
                        {pack.total}
                    </span>
                </span>
                <PackageProgress
                    done={pack.done}
                    total={pack.total}
                    tone="dark"
                />
            </div>

            {toBook > 0 && (
                <Button
                    asChild
                    className="h-11.5 rounded-xl text-sm font-semibold"
                >
                    <Link href={pack.trainerHref}>
                        Prenota la prossima seduta
                    </Link>
                </Button>
            )}

            {count > 1 && (
                <div aria-hidden="true" className="flex justify-center gap-1.5">
                    {packages.map((item, position) => (
                        <span
                            key={item.id}
                            className={cn(
                                'h-1.5 rounded-full transition-[width] motion-reduce:transition-none',
                                position === current
                                    ? 'w-4.5 bg-primary'
                                    : 'w-1.5 bg-input',
                            )}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
}
