import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import ZoomableImage from '@/components/shared/zoomable-image';
import {
    Dialog,
    DialogClose,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type PhotoLightboxProps = {
    /** "Foto di Marco Rossi". */
    title: string;
    slides: { caption: string; url: string }[];
    /** The photo open; null = closed. */
    openIndex: number | null;
    onOpenChange: (index: number | null) => void;
};

/** Round arrows on the black. */
const arrow =
    'relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-white/50 focus-visible:outline-none';

/**
 * The photos of a profile (trainer, gym, event) full screen, on black:
 * they zoom (two fingers, double tap, trackpad), a swipe or the arrows
 * (← → too) change photo, Esc or "Chiudi" closes.
 */
export default function PhotoLightbox({
    title,
    slides,
    openIndex,
    onOpenChange,
}: PhotoLightboxProps) {
    const total = slides.length;
    const current = openIndex === null ? null : (slides[openIndex] ?? null);

    const go = (step: number) => {
        if (openIndex === null || total < 2) {
            return;
        }

        onOpenChange((openIndex + step + total) % total);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
            go(-1);
        } else if (event.key === 'ArrowRight') {
            go(1);
        }
    };

    return (
        <Dialog
            open={current !== null}
            onOpenChange={(value) => !value && onOpenChange(null)}
        >
            <DialogPortal>
                <DialogOverlay className="bg-black" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onKeyDown={onKeyDown}
                    className="fixed inset-0 z-50 flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white outline-none"
                >
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 md:px-6">
                        <DialogClose className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-3.5 text-sm font-semibold outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-white/50">
                            <X aria-hidden="true" className="size-4" />
                            Chiudi
                        </DialogClose>
                        <span
                            aria-live="polite"
                            className="text-[15px] leading-[22px] font-semibold tabular-nums"
                        >
                            {total > 1 &&
                                openIndex !== null &&
                                `${openIndex + 1} / ${total}`}
                        </span>
                        <span aria-hidden="true" className="w-24" />
                    </div>

                    {current && openIndex !== null && (
                        <>
                            <div className="flex min-h-0 flex-1 items-center justify-center gap-3 overflow-hidden md:gap-5 md:px-6">
                                {total > 1 && (
                                    <button
                                        type="button"
                                        aria-label="Foto precedente"
                                        onClick={() => go(-1)}
                                        className={cn(arrow, 'hidden sm:flex')}
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                )}
                                <ZoomableImage
                                    key={current.url}
                                    onSwipe={go}
                                    src={current.url}
                                    alt={current.caption}
                                    className="max-h-full max-w-[min(100%,1400px)] min-w-0 object-contain"
                                />
                                {total > 1 && (
                                    <button
                                        type="button"
                                        aria-label="Foto successiva"
                                        onClick={() => go(1)}
                                        className={cn(arrow, 'hidden sm:flex')}
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                )}
                            </div>

                            <div className="relative z-10 flex min-h-16 flex-col items-center justify-center gap-2 px-4 pt-3 pb-5 text-center md:px-6">
                                {current.caption && (
                                    <p className="line-clamp-2 max-w-xl text-[15px] leading-5.5 text-white/80">
                                        {current.caption}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
