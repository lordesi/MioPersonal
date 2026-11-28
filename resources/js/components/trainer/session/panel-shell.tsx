import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** Where a popover opens: under a button, or beside an hour or a button. */
export type PopoverAnchor = {
    rect: DOMRect;
    placement: 'below' | 'side';
};

const WIDTH = 400;
const GAP = 14;
const MARGIN = 16;
/** Between the panel and the small picker beside it (design: 16px). */
const ASIDE_GAP = 16;

type Position = {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), Math.max(min, max));

/** The place of the popover in the window, from the anchor and its height. */
function place(anchor: PopoverAnchor | null, height: number): Position {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(WIDTH, vw - MARGIN * 2);

    if (!anchor) {
        const top = clamp((vh - height) / 2, MARGIN, vh - height - MARGIN);

        return {
            top,
            left: (vw - width) / 2,
            width,
            maxHeight: vh - top - MARGIN,
        };
    }

    const { rect } = anchor;

    if (anchor.placement === 'below') {
        const top = clamp(rect.bottom + GAP, MARGIN, vh - height - MARGIN);

        return {
            top,
            left: clamp(rect.right - width, MARGIN, vw - width - MARGIN),
            width,
            maxHeight: vh - top - MARGIN,
        };
    }

    const right = rect.right + GAP + width <= vw - MARGIN;
    const left = right ? rect.right + GAP : rect.left - GAP - width;
    const top = clamp(rect.top - 24, MARGIN, vh - height - MARGIN);

    return {
        top,
        left: clamp(left, MARGIN, vw - width - MARGIN),
        width,
        maxHeight: vh - top - MARGIN,
    };
}

/** The title of the panels with the round close button on the right. */
export function PanelHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
                <DialogPrimitive.Title className="m-0 text-[22px] font-bold tracking-[-0.02em]">
                    {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                    aria-label="Chiudi"
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#1C1E21] text-foreground outline-none hover:bg-[#26282C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </DialogPrimitive.Close>
            </div>
            {subtitle && (
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {subtitle}
                </span>
            )}
        </div>
    );
}

/**
 * A popover of desktop (design "Trainer · Popover · nuovo"): a 400px panel
 * on #121315 under a button or beside it, not modal (the calendar stays
 * usable behind). `aside` is a smaller panel opened beside it, on the side
 * with more room, level with the element `asideFrom` inside the panel.
 */
export function FloatingPanel({
    open,
    onOpenChange,
    anchor,
    label,
    children,
    aside,
    asideWidth = 340,
    asideFrom,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    anchor: PopoverAnchor | null;
    label: string;
    children: ReactNode;
    aside?: ReactNode;
    asideWidth?: number;
    asideFrom?: HTMLElement | null;
}) {
    // A state, not a ref: the portal mounts the panel after the first render.
    const [panel, setPanel] = useState<HTMLElement | null>(null);
    const [asidePanel, setAsidePanel] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [asideTop, setAsideTop] = useState(0);

    // Placed once its height is known, and again when it grows.
    useLayoutEffect(() => {
        const element = panel;

        if (!open || !element) {
            return;
        }

        const update = () => setPosition(place(anchor, element.offsetHeight));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        window.addEventListener('resize', update);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [open, anchor, panel]);

    // The picker beside: level with its row, inside the window.
    useLayoutEffect(() => {
        if (!position || !aside || !asidePanel) {
            return;
        }

        const offset = asideFrom
            ? asideFrom.offsetTop - (panel?.scrollTop ?? 0)
            : 0;
        setAsideTop(
            clamp(
                position.top + offset,
                MARGIN,
                window.innerHeight - asidePanel.offsetHeight - MARGIN,
            ),
        );
    }, [position, aside, asidePanel, asideFrom, panel]);

    const asideOnLeft =
        position !== null &&
        position.left + position.width / 2 > window.innerWidth / 2;

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={onOpenChange}
            modal={false}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    aria-label={label}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        // The first field, not the window around it.
                        (event.target as HTMLElement | null)
                            ?.querySelector<HTMLElement>('input, button')
                            ?.focus({ preventScroll: true });
                    }}
                    className="theme-dark pointer-events-none fixed inset-0 z-50 bg-transparent! text-foreground outline-none"
                >
                    <section
                        ref={setPanel}
                        data-shown={position !== null}
                        className="pointer-events-auto absolute flex [scrollbar-width:none] flex-col gap-5 overflow-y-auto overscroll-contain rounded-[26px] bg-[#121315] p-5.5 shadow-[0_30px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] data-[shown=false]:opacity-0"
                        style={
                            position
                                ? {
                                      top: position.top,
                                      left: position.left,
                                      width: position.width,
                                      maxHeight: position.maxHeight,
                                  }
                                : { top: 0, left: 0, width: WIDTH }
                        }
                    >
                        {children}
                    </section>

                    {aside && position && (
                        <div
                            ref={setAsidePanel}
                            className="pointer-events-auto absolute"
                            style={{
                                width: asideWidth,
                                top: asideTop,
                                left: asideOnLeft
                                    ? Math.max(
                                          MARGIN,
                                          position.left -
                                              asideWidth -
                                              ASIDE_GAP,
                                      )
                                    : Math.min(
                                          window.innerWidth -
                                              asideWidth -
                                              MARGIN,
                                          position.left +
                                              position.width +
                                              ASIDE_GAP,
                                      ),
                            }}
                        >
                            {aside}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

/** The panel beside the popover (the day or the time to choose). */
export const asidePanelClassName =
    'flex flex-col gap-3.5 rounded-3xl bg-[#121315] p-4.5 shadow-[0_30px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]';

/**
 * A sheet of phones (design "Trainer · Nuova seduta · nuovo"): from the
 * bottom, on a dark veil, with the handle on top.
 */
export function BottomSheet({
    open,
    onOpenChange,
    label,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    children: ReactNode;
}) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="theme-dark fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    aria-label={label}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className={cn(
                        'theme-dark fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] [scrollbar-width:none] flex-col gap-5.5 overflow-y-auto overscroll-contain rounded-t-[28px] bg-[#121315] px-4 pt-2.5 pb-[max(28px,env(safe-area-inset-bottom))] text-foreground shadow-[0_-20px_60px_rgba(0,0,0,0.6)] outline-none',
                        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className="h-1.25 w-10 shrink-0 self-center rounded-full bg-[#3A3D42]"
                    />
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
