import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ModalSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /**
     * A <ModalSheetBody> (it scrolls) and, if needed, a <ModalSheetFooter>
     * (it stays at the bottom), so "Applica" is always in sight.
     */
    children: ReactNode;
    /** The width on desktop: 600px for the filters, 800px for two months, 880px for "Scegli data e ora". */
    size?: 'md' | 'lg' | 'xl';
    /** Phones: an arrow before the title, back to the window before (e.g. "Servizi"). */
    onBack?: () => void;
    /** e.g. "Torna ai servizi". */
    backLabel?: string;
};

const widths = { md: 'md:max-w-150', lg: 'md:max-w-200', xl: 'md:max-w-220' };

/**
 * A window of the dark pages: a sheet from the bottom on phones, centered
 * on desktop (design "RicercaSheet" / "DkFiltriFinestra"). It opens in a
 * portal outside the page, so it brings its own .theme-dark.
 */
export default function ModalSheet({
    open,
    onOpenChange,
    title,
    children,
    size = 'md',
    onBack,
    backLabel = 'Indietro',
}: ModalSheetProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="theme-dark fixed inset-0 z-50 bg-black/60! backdrop-blur-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    // Each window has a visible title; no description.
                    aria-describedby={undefined}
                    className={cn(
                        // Phones: a line on the top edge only, as the sheet of the design.
                        'theme-dark fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[26px] bg-card! shadow-[inset_0_1px_0_0_var(--border),0_24px_64px_-12px_rgba(0,0,0,0.8)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
                        'md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[88dvh] md:w-[calc(100%-4rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[26px] md:shadow-[inset_0_0_0_1px_var(--field),0_24px_64px_-12px_rgba(0,0,0,0.8)] md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95',
                        widths[size],
                    )}
                >
                    {/* The handle of the sheet, on phones. */}
                    <span
                        aria-hidden="true"
                        className="mx-auto mt-2 h-1.25 w-9 shrink-0 rounded-full bg-field md:hidden"
                    />
                    <div className="flex shrink-0 items-center justify-between gap-4 pt-3 pr-4.5 pb-2 pl-6 md:pt-4 md:pr-5 md:pl-7">
                        <div className="flex min-w-0 items-center gap-1">
                            {onBack && (
                                <button
                                    type="button"
                                    aria-label={backLabel}
                                    onClick={onBack}
                                    className="-ml-3 flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
                                >
                                    <ChevronLeft
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                </button>
                            )}
                            <DialogPrimitive.Title className="text-[22px] leading-7 font-bold tracking-[-0.26px]">
                                {title}
                            </DialogPrimitive.Title>
                        </div>
                        <DialogPrimitive.Close
                            aria-label="Chiudi"
                            className="group flex size-11 shrink-0 items-center justify-center rounded-full outline-none"
                        >
                            {/* Phones: a grey disc; desktop: a white ring. */}
                            <span className="flex size-7.5 items-center justify-center rounded-full bg-[#7878805c] group-hover:bg-[#78788080] group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50 md:size-8 md:border-[1.5px] md:border-foreground md:bg-transparent md:group-hover:bg-foreground/10">
                                <X
                                    aria-hidden="true"
                                    className="size-4 md:size-3.5"
                                    strokeWidth={2.4}
                                />
                            </span>
                        </DialogPrimitive.Close>
                    </div>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

/** The content of a ModalSheet: it scrolls when taller than the screen. */
export function ModalSheetBody({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'min-h-0 flex-1 scrollbar-soft overflow-y-auto px-6 pt-2 pb-6 md:px-7',
                className,
            )}
        >
            {children}
        </div>
    );
}

/**
 * The bottom of a ModalSheet ("Azzera", "Applica"): outside the part that
 * scrolls. On desktop a line across the whole window above it.
 */
export function ModalSheetFooter({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-between gap-4 px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:border-t md:border-border md:px-7 md:pt-4',
                className,
            )}
        >
            {children}
        </div>
    );
}
