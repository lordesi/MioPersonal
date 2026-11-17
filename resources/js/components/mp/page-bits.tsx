import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

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
    'inline-flex h-12.5 items-center justify-center rounded-full bg-brand px-7 text-[17px] font-semibold text-[#0a0a0a] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60';

/** The turquoise outline with white text: "Sei un trainer?", "Gestisci le preferenze". */
export const brandOutlineClassName =
    'inline-flex h-12.5 items-center justify-center rounded-full border border-brand px-7 text-[17px] font-semibold text-foreground outline-none hover:bg-brand/10 focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** A dark card: #1c1c1c, round corners of 26px. */
export const darkCardClassName = 'rounded-[26px] bg-card';

/** "Home / Come funziona". */
export function PageBreadcrumb({ current }: { current: string }) {
    return (
        <nav
            aria-label="Percorso"
            className="flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground"
        >
            <Link
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

/** A dark card with an icon, a title, a line and the turquoise arrow. */
export function LinkCard({
    href,
    icon,
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
            href={href}
            className={cn(
                darkCardClassName,
                'flex h-full items-center gap-3 px-4 py-3.5 outline-none hover:bg-[#232323] focus-visible:ring-[3px] focus-visible:ring-ring/50 md:gap-4 md:p-6',
            )}
        >
            <IconBadge icon={icon} />
            <span className="flex flex-1 flex-col gap-0.5 md:gap-1">
                <span className="text-[17px] font-semibold md:text-xl md:leading-6.25 md:tracking-[-0.45px]">
                    {title}
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground md:text-[15px] md:leading-5.25">
                    {children}
                </span>
            </span>
            <ArrowRight
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
            />
        </Link>
    );
}
