import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { expiryLabel } from '@/lib/chat';
import { formatDayMonthTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

type PhotoViewerProps = {
    /** The messages with a photo still available, oldest first. */
    photos: ChatMessage[];
    /** The message id of the photo open; null = closed. */
    openId: number | null;
    onOpenChange: (id: number | null) => void;
    /** The other person: "Tu" or the name, under the photo. */
    otherName: string;
};

/** White round arrows, as in the profile gallery. */
const arrow =
    'flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-foreground hover:bg-background/85 focus-visible:ring-[3px] focus-visible:ring-background/50 focus-visible:outline-none';

/**
 * The photos of the conversation full screen: arrows and ← → between them,
 * "Scarica", and who sent it when. Esc or "Chiudi" closes it.
 */
export default function PhotoViewer({
    photos,
    openId,
    onOpenChange,
    otherName,
}: PhotoViewerProps) {
    const index = photos.findIndex((message) => message.id === openId);
    const current = index === -1 ? null : photos[index];
    const total = photos.length;

    const go = (step: number) => {
        if (index === -1 || total < 2) {
            return;
        }

        onOpenChange(photos[(index + step + total) % total].id);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
            go(-1);
        } else if (event.key === 'ArrowRight') {
            go(1);
        }
    };

    const attachment = current?.attachment;

    return (
        <Dialog
            open={current !== null}
            onOpenChange={(value) => !value && onOpenChange(null)}
        >
            <DialogPortal>
                <DialogOverlay className="bg-foreground" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onKeyDown={onKeyDown}
                    className="fixed inset-0 z-50 flex flex-col bg-foreground text-background outline-none"
                >
                    <DialogTitle className="sr-only">
                        Foto della conversazione con {otherName}
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
                            {total > 1 &&
                                index !== -1 &&
                                `${index + 1} / ${total}`}
                        </span>
                        {attachment?.href ? (
                            <a
                                href={attachment.href}
                                download
                                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-background px-3.5 text-sm font-semibold text-foreground outline-none hover:bg-background/85 focus-visible:ring-[3px] focus-visible:ring-background/50"
                            >
                                <Download
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Scarica
                            </a>
                        ) : (
                            <span aria-hidden="true" className="w-24" />
                        )}
                    </div>

                    {current && attachment?.src && (
                        <>
                            <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 md:gap-5 md:px-6">
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
                                <img
                                    key={current.id}
                                    src={attachment.src}
                                    alt={
                                        current.body ??
                                        `Foto ${current.mine ? 'tua' : `di ${otherName}`}`
                                    }
                                    className="max-h-full max-w-[min(100%,1100px)] min-w-0 rounded-[16px] object-contain"
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

                            <div className="flex flex-col items-center gap-1 px-4 pt-4 pb-6 text-center md:px-6">
                                {current.body && (
                                    <p className="line-clamp-3 max-w-xl text-[15px] leading-5.5 whitespace-pre-line">
                                        {current.body}
                                    </p>
                                )}
                                <p className="text-[13px] text-background/70">
                                    {current.mine ? 'Tu' : otherName}
                                    {current.at &&
                                        ` · ${formatDayMonthTime(current.at)}`}
                                    {attachment.expiresAt &&
                                        ` · ${expiryLabel(attachment.expiresAt)}`}
                                </p>
                                {total > 1 && (
                                    <div className="mt-2 flex gap-3 sm:hidden">
                                        <button
                                            type="button"
                                            aria-label="Foto precedente"
                                            onClick={() => go(-1)}
                                            className={arrow}
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Foto successiva"
                                            onClick={() => go(1)}
                                            className={arrow}
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
