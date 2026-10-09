import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { TrainerProfile } from '@/types';

type PhotoGalleryProps = {
    trainerName: string;
    photos: TrainerProfile['photos'];
    index: number;
    onIndexChange: (index: number) => void;
};

const arrow =
    'absolute top-1/2 size-11 -translate-y-1/2 rounded-full border-border shadow-sm';

/**
 * Photo carousel without a library: arrows, thumbnails (desktop) and dots
 * (mobile) change the photo shown. No real photos yet: a grey placeholder
 * with the caption, as in the design.
 */
export default function PhotoGallery({
    trainerName,
    photos,
    index,
    onIndexChange,
}: PhotoGalleryProps) {
    const getInitials = useInitials();
    const total = photos.length;
    const photo = photos[index];
    const go = (step: number) => onIndexChange((index + step + total) % total);

    return (
        <section
            aria-roledescription="carousel"
            aria-label={`Foto di ${trainerName}`}
            className="flex flex-col gap-3"
        >
            <div className="relative h-85 overflow-hidden bg-muted md:aspect-21/9 md:h-auto md:rounded-xl">
                <div aria-live="polite" className="size-full">
                    <div
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${index + 1} di ${total}: ${photo.caption}`}
                        className="flex size-full flex-col items-center justify-center gap-2.5 text-muted-foreground"
                    >
                        {photo.isPortrait ? (
                            <span className="text-7xl font-bold tracking-tight md:text-8xl">
                                {getInitials(trainerName)}
                            </span>
                        ) : (
                            <Image
                                aria-hidden="true"
                                className="size-10 md:size-12"
                            />
                        )}
                        <span className="text-sm font-medium">
                            {photo.caption}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Foto precedente"
                    onClick={() => go(-1)}
                    className={cn(arrow, 'left-2.5 md:left-4')}
                >
                    <ChevronLeft className="size-5" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Foto successiva"
                    onClick={() => go(1)}
                    className={cn(arrow, 'right-2.5 md:right-4')}
                >
                    <ChevronRight className="size-5" />
                </Button>

                <span className="absolute bottom-4 left-4 hidden h-7 items-center rounded-full bg-background px-3 text-sm font-medium md:inline-flex">
                    {photo.caption}
                </span>
                <span className="absolute top-3 right-3 inline-flex h-6.5 items-center rounded-full bg-primary px-2.5 text-xs font-medium text-primary-foreground tabular-nums md:top-auto md:right-4 md:bottom-4 md:h-7 md:px-3 md:text-sm">
                    {index + 1} / {total}
                </span>
            </div>

            {/* Thumbnails on desktop */}
            <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
                {photos.map((item, i) => (
                    <button
                        key={item.caption}
                        type="button"
                        aria-label={`Mostra foto ${i + 1}: ${item.caption}`}
                        aria-current={i === index}
                        onClick={() => onIndexChange(i)}
                        className={cn(
                            'flex h-19 w-30 shrink-0 items-end rounded-lg bg-muted p-1.5 text-left text-xs font-medium',
                            i === index
                                ? 'border-2 border-primary text-foreground'
                                : 'border text-muted-foreground opacity-70',
                        )}
                    >
                        {item.caption}
                    </button>
                ))}
            </div>

            {/* Dots on mobile */}
            <div className="-mt-1 flex justify-center md:hidden">
                {photos.map((item, i) => (
                    <button
                        key={item.caption}
                        type="button"
                        aria-label={`Mostra foto ${i + 1}: ${item.caption}`}
                        aria-current={i === index}
                        onClick={() => onIndexChange(i)}
                        className="flex size-6 items-center justify-center"
                    >
                        <span
                            className={cn(
                                'block h-1.5 rounded-full',
                                i === index
                                    ? 'w-4.5 bg-primary'
                                    : 'w-1.5 bg-input',
                            )}
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
