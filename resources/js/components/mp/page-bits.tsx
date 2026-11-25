import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { hoverPrefetch } from '@/lib/prefetch';

/*
 * The pieces of the dark pages of text ("Come funziona", "Contatti", the
 * legal pages): the path on top, the turquoise icon in a circle, the dark
 * cards with an arrow, the turquoise buttons.
 */

/** The column of the page; the header lies on top of it (DarkHeader). */
export const pageColumnClassName =
    'mx-auto flex w-full max-w-300 flex-col px-4 pt-16 md:px-8 md:pt-23';

/** The title of the page: 34px on phones, up to 56px on desktop. */
export const pageTitleClassName =
    'text-[34px] leading-[41px] font-bold tracking-[0.4px] text-balance md:text-[clamp(2.125rem,1.4rem+3.2vw,3.5rem)] md:leading-[1.05] md:tracking-[-0.02em]';

/** A title of a block: 22px on phones, 28px on desktop. */
export const sectionTitleClassName =
    'text-[22px] leading-7 font-bold md:text-[28px] md:leading-8.5 md:tracking-[0.38px]';

/** The filled turquoise button: "Cerca un personal trainer", "Invia messaggio". */
export const brandFilledClassName =
    'inline-flex h-14 items-center justify-center rounded-full bg-brand px-7 text-[17px] font-semibold text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60';

/** The turquoise outline with white text: "Sei un trainer?", "Gestisci le preferenze". */
export const brandOutlineClassName =
    'inline-flex h-12.5 items-center justify-center rounded-full border border-brand px-7 text-[17px] font-semibold text-foreground outline-none hover:bg-brand/10 focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The big number of the error pages: "404", "500"; turquoise and light on desktop. */
export const errorNumberClassName =
    'text-[112px] leading-[0.9] font-bold tracking-[-0.06em] text-brand tabular-nums md:text-[160px]';

/** The small turquoise line over a title: "Errore 404". */
export const eyebrowClassName =
    'text-xs font-bold tracking-[0.08em] text-brand uppercase';

/** A dark card: the card color (#121315), round corners of 22px. */
export const darkCardClassName = 'rounded-[22px] bg-card';

/** "Home / Come funziona". */
export function PageBreadcrumb({ current }: { current: string }) {
    return (
        <nav
            aria-label="Percorso"
            className="flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground"
        >
            <Link
                prefetch={hoverPrefetch}
                href={home()}
                className="flex min-h-11 items-center outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                Home
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-foreground">
                {current}
            </span>
        </nav>
    );
}

/** A turquoise icon in a turquoise circle: 36px on phones, 44px on desktop. */
export function IconBadge({
    icon: Icon,
    className,
}: {
    icon: LucideIcon;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full border border-brand text-brand md:size-11',
                className,
            )}
        >
            <Icon className="size-5 md:size-5.5" />
        </span>
    );
}

/** A dark card (design "Prova da qui"): the icon in a turquoise box, a title, a line and the turquoise chevron. */
export function LinkCard({
    href,
    icon: Icon,
    title,
    children,
}: {
    href: string;
    icon: LucideIcon;
    title: string;
    children: ReactNode;
}) {
    return (
        <Link
            prefetch={hoverPrefetch}
            href={href}
            className={cn(
                darkCardClassName,
                'flex h-full items-center gap-3.5 border border-separator p-4 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring',
            )}
        >
            <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft text-brand"
            >
                <Icon className="size-5.5" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">
                    {children}
                </span>
            </span>
            <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
            />
        </Link>
    );
}
