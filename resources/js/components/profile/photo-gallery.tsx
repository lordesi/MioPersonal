import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
 * (mobile) change the photo shown, only when there is more than one photo.
 * The page shows it only when the trainer has gallery photos.
 */
export default function PhotoGallery({
    trainerName,
    photos,
    index,
    onIndexChange,
}: PhotoGalleryProps) {
    const total = photos.length;
    const photo = photos[index];
    const many = total > 1;
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
                        aria-label={`Foto ${index + 1} di ${total}`}
                        className="size-full"
                    >
                        <img
                            src={photo.url}
                            alt={`Foto ${index + 1} di ${total} di ${trainerName}`}
                            className="absolute inset-0 size-full object-cover"
                        />
                    </div>
                </div>

                {many && (
                    <>
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

                        <span className="absolute top-3 right-3 inline-flex h-6.5 items-center rounded-full bg-primary px-2.5 text-xs font-medium text-primary-foreground tabular-nums md:top-auto md:right-4 md:bottom-4 md:h-7 md:px-3 md:text-sm">
                            {index + 1} / {total}
                        </span>
                    </>
                )}
            </div>

            {many && (
                <>
                    {/* Thumbnails on desktop */}
                    <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
                        {photos.map((item, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Mostra foto ${i + 1}`}
                                aria-current={i === index}
                                onClick={() => onIndexChange(i)}
                                className={cn(
                                    'h-19 w-30 shrink-0 overflow-hidden rounded-lg bg-muted',
                                    i === index
                                        ? 'border-2 border-primary'
                                        : 'border opacity-70',
                                )}
                            >
                                <img
                                    src={item.url}
                                    alt=""
                                    loading="lazy"
                                    className="size-full object-cover"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Dots on mobile */}
                    <div className="-mt-1 flex justify-center md:hidden">
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Mostra foto ${i + 1}`}
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
                </>
            )}
        </section>
    );
}
