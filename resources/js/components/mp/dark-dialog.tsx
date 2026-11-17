import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/layout/brand-logo';
import { cn } from '@/lib/utils';

/**
 * The layer behind every dark dialog: the page stays in sight, blurred and
 * a little dimmed. No .theme-dark here: it would paint it solid black.
 */
export const darkOverlayClassName =
    'fixed inset-0 z-50 bg-black/35 backdrop-blur-[8px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0';

/** The handle on top of the sheets, on phones. */
export function SheetHandle() {
    return (
        <span
            aria-hidden="true"
            className="mx-auto h-1.25 w-9 shrink-0 rounded-full bg-[#7878805c] md:hidden"
        />
    );
}

/**
 * The second button ("Annulla", "Non ora", "Solo quelli necessari"): a grey
 * pill on phones, plain text in the middle on desktop.
 */
export const darkSecondaryButtonClassName =
    'flex h-12.5 w-full items-center justify-center rounded-full px-4 text-[17px] font-semibold tracking-[-0.43px] text-foreground shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 md:h-11 md:w-auto md:self-center md:text-[15px] md:tracking-[-0.23px] md:shadow-none md:hover:bg-transparent md:hover:underline';

/** The turquoise links inside the dialogs ("Password dimenticata?"). */
export const darkLinkClassName =
    'flex min-h-11 items-center text-[15px] font-semibold tracking-[-0.23px] text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50';

type DarkDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Bold on phones; on desktop light, with the key word in <strong>. */
    title: ReactNode;
    description?: ReactNode;
    /** Desktop: the MioPersonal mark next to the X, the title below. */
    logo?: boolean;
    /** The label of the X, e.g. "Torna al banner". */
    closeLabel?: string;
    /** The width and the height on desktop, e.g. "md:max-w-130". */
    className?: string;
    /** Without its own padding: the body scrolls (DarkDialogBody + DarkDialogFooter). */
    scrolling?: boolean;
    children: ReactNode;
};

/**
 * A dialog of the dark design, on every page: a sheet from the bottom with
 * a handle on phones, a card in the middle on desktop (the "home" style).
 * It opens in a portal outside the page, so it brings its own .theme-dark.
 */
export default function DarkDialog({
    open,
    onOpenChange,
    title,
    description,
    logo = false,
    closeLabel = 'Chiudi',
    className,
    scrolling = false,
    children,
}: DarkDialogProps) {
    const close = (
        <DialogPrimitive.Close
            aria-label={closeLabel}
            className="group -mr-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:-mr-2 md:shadow-[inset_0_0_0_1px_var(--field)] md:hover:bg-foreground/10"
        >
            {/* Phones: a grey disc; desktop: the grey ring of the button itself. */}
            <span className="flex size-8 items-center justify-center rounded-full bg-[#2a2a2a] group-hover:bg-[#3a3a3a] md:size-auto md:bg-transparent md:group-hover:bg-transparent">
                <X
                    aria-hidden="true"
                    className="size-4.5 md:size-5"
                    strokeWidth={2.5}
                />
            </span>
        </DialogPrimitive.Close>
    );

    const heading = (
        <DialogPrimitive.Title className="text-[22px] leading-7 font-bold tracking-[-0.26px] text-balance md:text-[28px] md:leading-[1.12] md:font-light md:tracking-[-0.035em]">
            {title}
        </DialogPrimitive.Title>
    );

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className={darkOverlayClassName} />
                <DialogPrimitive.Content
                    {...(description ? {} : { 'aria-describedby': undefined })}
                    className={cn(
                        'theme-dark fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-6 rounded-t-[38px] border border-b-0 border-border bg-background pt-2 text-foreground shadow-[0_16px_48px_-8px_rgba(0,0,0,0.75)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
                        'md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-3rem)] md:w-[calc(100%-4rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[38px] md:border-b md:border-white/10 md:pt-7 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95',
                        !scrolling &&
                            'overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pb-8',
                        scrolling && 'gap-0',
                        'md:max-w-130',
                        className,
                    )}
                >
                    <SheetHandle />

                    <div
                        className={cn(
                            'flex flex-col gap-1 md:gap-2',
                            scrolling &&
                                'px-6 pt-3 pb-3 md:px-10 md:pt-0 md:pb-4',
                        )}
                    >
                        {logo && (
                            <div className="hidden items-center justify-between gap-3 md:mb-4 md:flex">
                                <BrandMark className="h-10 w-16.25" />
                                {close}
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            {heading}
                            <div className={cn(logo && 'md:hidden')}>
                                {close}
                            </div>
                        </div>
                        {description && (
                            <DialogPrimitive.Description className="text-[15px] leading-5 tracking-[-0.23px] text-muted-foreground md:tracking-normal">
                                {description}
                            </DialogPrimitive.Description>
                        )}
                    </div>

                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

/** The part of a scrolling DarkDialog that scrolls. */
export function DarkDialogBody({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 scrollbar-soft flex-col gap-6 overflow-y-auto px-6 pt-1 pb-6 md:px-10',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** The bottom of a scrolling DarkDialog, always in sight. */
export function DarkDialogFooter({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex shrink-0 flex-col px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-10 md:pb-8',
                className,
            )}
        >
            {children}
        </div>
    );
}
