import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Link } from '@inertiajs/react';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import {
    darkLinkClassName,
    darkOverlayClassName,
    SheetHandle,
} from '@/components/mp/dark-dialog';
import { cookies } from '@/routes/legal';

type CookieBannerProps = {
    /** "Accetta tutti": saves the choice right away. */
    onAccept: () => void;
    /** "Gestisci le preferenze" and "Solo quelli necessari": open "La tua privacy". */
    onManage: () => void;
    disabled?: boolean;
    /**
     * False on the legal pages: the banner stays, but the page behind it can
     * be read (the "Cookie policy" link of the banner leads there).
     */
    blocking?: boolean;
};

const policyLinkClassName =
    'font-semibold text-brand underline underline-offset-3 outline-none hover:text-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 md:no-underline md:hover:underline';

/**
 * Shown on every page until a choice is made, over a dimmed page: it can't
 * be closed with Esc or a tap outside, only with a choice (on the legal
 * pages the page stays usable, see `blocking`). "Accetta tutti" saves at
 * once; "Solo quelli necessari" opens "La tua privacy", where "Salva
 * preferenze" saves. A sheet on phones, a wide bar at the bottom on desktop.
 */
export default function CookieBanner({
    onAccept,
    onManage,
    disabled,
    blocking = true,
}: CookieBannerProps) {
    return (
        <DialogPrimitive.Root open modal={blocking}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className={darkOverlayClassName} />
                <DialogPrimitive.Content
                    aria-describedby="cookie-banner-text"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                    // No field to focus: the dialog itself, not the first link.
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        (event.currentTarget as HTMLElement | null)?.focus();
                    }}
                    className="theme-dark fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-6 overflow-y-auto rounded-t-[38px] border border-b-0 border-border bg-background px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground shadow-[0_16px_48px_-8px_rgba(0,0,0,0.75)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-6 md:bottom-6 md:mx-auto md:max-w-300 md:flex-row md:items-center md:gap-12 md:rounded-[26px] md:border-b md:border-white/10 md:px-10 md:py-8"
                >
                    <SheetHandle />

                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <DialogPrimitive.Title className="text-[22px] leading-7 font-bold tracking-[-0.26px] md:text-[28px] md:leading-[1.12] md:font-light md:tracking-[-0.035em]">
                            Migliora la tua{' '}
                            <strong className="font-bold">esperienza</strong>
                        </DialogPrimitive.Title>
                        <div
                            id="cookie-banner-text"
                            className="flex flex-col gap-3 text-[15px] leading-5 tracking-[-0.23px] text-muted-foreground md:block md:max-w-170 md:tracking-normal"
                        >
                            <p>
                                Usiamo solo i cookie necessari per far
                                funzionare il sito: mantengono l’accesso,
                                proteggono i moduli e ricordano le tue
                                preferenze. Non si possono disattivare.
                            </p>{' '}
                            <p className="md:inline">
                                Per saperne di più leggi la{' '}
                                <Link
                                    href={cookies.url()}
                                    className={policyLinkClassName}
                                >
                                    Cookie policy di MioPersonal
                                </Link>
                                .
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onManage}
                            disabled={disabled}
                            className={`${darkLinkClassName} hidden self-start md:flex`}
                        >
                            Gestisci le preferenze
                        </button>
                    </div>

                    {/* Phones: the preferences as a row of their own. */}
                    <div className="flex flex-col gap-3 md:hidden">
                        <h3 className="text-[15px] leading-5 font-semibold tracking-[-0.23px]">
                            Preferenze
                        </h3>
                        <button
                            type="button"
                            onClick={onManage}
                            disabled={disabled}
                            className="flex h-13 w-full items-center gap-3 rounded-[14px] px-4 text-left text-[17px] tracking-[-0.43px] shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <SlidersHorizontal
                                aria-hidden="true"
                                className="size-5 shrink-0 text-brand"
                            />
                            <span className="flex-1">
                                Gestisci le preferenze
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4 shrink-0 text-muted-foreground"
                            />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 md:w-75 md:shrink-0 md:gap-2.5 md:pt-0">
                        <button
                            type="button"
                            onClick={onAccept}
                            disabled={disabled}
                            className="btn-brand h-12.5 text-[17px] tracking-[-0.43px]"
                        >
                            Accetta tutti
                        </button>
                        <button
                            type="button"
                            onClick={onManage}
                            disabled={disabled}
                            className="flex h-12.5 items-center justify-center rounded-full text-[17px] font-semibold tracking-[-0.43px] shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 md:bg-[rgba(10,10,10,0.55)] md:shadow-[inset_0_0_0_1.5px_var(--foreground)] md:hover:bg-foreground/10"
                        >
                            Solo quelli necessari
                        </button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
