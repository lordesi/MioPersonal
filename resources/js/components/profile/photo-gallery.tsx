import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TrainerProfile } from '@/types';

type PhotoGalleryProps = {
    trainerName: string;
    photos: TrainerProfile['photos'];
};

/** Photos in the mosaic: the big one and up to 4 small ones. */
const MOSAIC = 5;

/*
 * Where each tile goes in the 4 × 2 grid, by number of photos, written out in
 * full so Tailwind can find them. With fewer than 5 photos the last ones get
 * wider, so the grid is always full. Below md only the first one shows.
 */
const tileSpans: Record<number, string[]> = {
    1: ['md:col-span-4 md:row-span-2'],
    2: ['md:col-span-2 md:row-span-2', 'md:col-span-2 md:row-span-2'],
    3: ['md:col-span-2 md:row-span-2', 'md:col-span-2', 'md:col-span-2'],
    4: ['md:col-span-2 md:row-span-2', 'md:col-span-2', '', ''],
    5: ['md:col-span-2 md:row-span-2', '', '', '', ''],
};

/** White round arrows of the full screen gallery. */
const arrow =
    'flex size-12 shrink-0 items-center justify-center rounded-full bg-background text-foreground hover:bg-background/85 focus-visible:ring-[3px] focus-visible:ring-background/50 focus-visible:outline-none';

/**
 * The gallery under the breadcrumb: a mosaic of the first photos, and all of
 * them full screen (arrows, ← → keys, thumbnails). No captions on the photos:
 * they are only read aloud. The page shows it only when there are photos.
 */
export default function PhotoGallery({
    trainerName,
    photos,
}: PhotoGalleryProps) {
    // The photo open full screen; null = closed.
    const [open, setOpen] = useState<number | null>(null);
    const total = photos.length;
    const shown = photos.slice(0, MOSAIC);
    const spans = tileSpans[shown.length];
    const go = (step: number) =>
        setOpen((index) =>
            index === null ? index : (index + step + total) % total,
        );

    const altText = (index: number) =>
        photos[index].caption ||
        `Foto ${index + 1} di ${total} di ${trainerName}`;

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
            go(-1);
        } else if (event.key === 'ArrowRight') {
            go(1);
        }
    };

    return (
        <section
            aria-label={`Foto di ${trainerName}`}
            className="relative grid h-64 grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:h-80 md:h-auto md:grid-cols-4 md:grid-rows-[200px_200px]"
        >
            {shown.map((photo, index) => (
                <button
                    key={photo.url}
                    type="button"
                    aria-label={`Apri la foto ${index + 1} di ${total}`}
                    onClick={() => setOpen(index)}
                    className={cn(
                        'group relative overflow-hidden bg-primary-foreground/10 outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60 focus-visible:ring-inset',
                        index > 0 && 'hidden md:block',
                        spans[index],
                    )}
                >
                    <img
                        src={photo.url}
                        alt={altText(index)}
                        className="absolute inset-0 size-full object-cover"
                    />
                    {/* A little darker on hover. */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/20"
                    />
                </button>
            ))}

            <button
                type="button"
                onClick={() => setOpen(0)}
                className="absolute right-3 bottom-3 inline-flex h-10 items-center gap-2 rounded-[10px] border border-primary bg-background px-3.5 text-sm font-semibold text-foreground shadow-lg outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60 md:right-4 md:bottom-4"
            >
                <LayoutGrid aria-hidden="true" className="size-4" />
                Mostra tutte le foto{' '}
                <span className="font-medium text-muted-foreground tabular-nums">
                    {total}
                </span>
            </button>

            <Dialog
                open={open !== null}
                onOpenChange={(value) => !value && setOpen(null)}
            >
                <DialogPortal>
                    <DialogOverlay className="bg-foreground" />
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        onKeyDown={onKeyDown}
                        className="fixed inset-0 z-50 flex flex-col bg-foreground text-background outline-none"
                    >
                        <DialogTitle className="sr-only">
                            Galleria foto di {trainerName}
                        </DialogTitle>
                        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-6">
                            <DialogClose className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-background/25 px-3.5 text-sm font-semibold outline-none hover:bg-background/10 focus-visible:ring-[3px] focus-visible:ring-background/50">
                                <X aria-hidden="true" className="size-4" />
                                Chiudi
                            </DialogClose>
                            <span
                                aria-live="polite"
                                className="text-[15px] leading-[22px] font-semibold tabular-nums"
                            >
                                {open !== null && `${open + 1} / ${total}`}
                            </span>
                            {/* As wide as "Chiudi": the counter stays in the middle. */}
                            <span aria-hidden="true" className="w-24" />
                        </div>

                        {open !== null && (
                            <>
                                <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 md:gap-5 md:px-6">
                                    {total > 1 && (
                                        <button
                                            type="button"
                                            aria-label="Foto precedente"
                                            onClick={() => go(-1)}
                                            className={arrow}
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                    )}
                                    <img
                                        src={photos[open].url}
                                        alt={altText(open)}
                                        className="max-h-full max-w-[min(100%,960px)] min-w-0 rounded-[20px] object-contain"
                                    />
                                    {total > 1 && (
                                        <button
                                            type="button"
                                            aria-label="Foto successiva"
                                            onClick={() => go(1)}
                                            className={arrow}
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-center px-4 pt-4.5 pb-6 md:px-6">
                                    <div
                                        role="group"
                                        aria-label="Miniature"
                                        className="flex max-w-full gap-2 overflow-x-auto p-1"
                                    >
                                        {photos.map((photo, index) => (
                                            <button
                                                key={photo.url}
                                                type="button"
                                                aria-label={`Mostra la foto ${index + 1}`}
                                                aria-current={index === open}
                                                onClick={() => setOpen(index)}
                                                className={cn(
                                                    'h-13 w-18 shrink-0 overflow-hidden rounded-[10px] border-2 outline-none focus-visible:ring-[3px] focus-visible:ring-background/50',
                                                    index === open
                                                        ? 'border-background'
                                                        : 'border-transparent opacity-55 hover:opacity-80',
                                                )}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt=""
                                                    loading="lazy"
                                                    className="size-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
        </section>
    );
}
