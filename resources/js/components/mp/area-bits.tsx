import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';

/*
 * The pieces of the client and trainer areas in the "carbone" design (the
 * "-Nuovo" artboards, ds/miopersonal): the big title, the section titles,
 * the badges, the rows with the icon tile, the round outline buttons.
 * They work inside .theme-dark.
 */

/** "Ciao, Silvia", "Profilo", "Inbox": 34px on phones, 40px on desktop. */
export const areaTitleClassName =
    'text-[34px] leading-[1.08] font-bold tracking-[-0.03em] md:text-[40px]';

/** "Prenotazioni", "Trainer consigliati". */
export const areaSectionTitleClassName =
    'text-[22px] leading-7 font-bold tracking-[-0.02em]';

/** The small grey line over a group: "LA MIA ATTIVITÀ", "Nuove". */
export const areaEyebrowClassName =
    'text-[13px] leading-4.5 font-semibold tracking-[0.02em] text-muted-foreground';

/** A card on the black (#121315, corners of 24px). */
export const carbCardClassName = 'rounded-[24px] bg-card';

/** The open card: the turquoise outline of 1.5px. */
export const openCardClassName = 'shadow-[inset_0_0_0_1.5px_var(--brand)]';

/** "Vedi tutte", "Vedi tutti": the turquoise link next to a section title. */
export const areaLinkClassName =
    'py-2.5 text-[15px] font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring';

/** A round button with the grey outline (52px): Scrivi, Indicazioni. */
export const roundButtonClassName =
    'inline-flex size-13 shrink-0 items-center justify-center rounded-full bg-transparent text-foreground shadow-[inset_0_0_0_1px_var(--input)] outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40';

/** A round icon button without outline (40px): the arrows of the week. */
export const iconButtonClassName =
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

const buttonBase =
    'relative inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap outline-none transition-[transform,background-color,filter] select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40';

const buttonVariants = {
    primary:
        'bg-primary font-bold text-primary-foreground shadow-[0_8px_24px_rgba(66,215,217,0.28)] hover:brightness-106',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
    outline:
        'border-input bg-transparent text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.5)] hover:bg-accent',
    ghost: 'bg-transparent text-foreground hover:bg-accent',
    destructive: 'bg-[#ff4245] font-bold text-black hover:brightness-106',
} as const;

const buttonSizes = {
    sm: 'min-h-9 px-3 text-[15px] leading-5 tracking-[-0.23px]',
    md: 'min-h-11 px-5 text-[17px] leading-5.5 tracking-[-0.43px]',
    lg: 'min-h-14 px-6 text-[17px] leading-5.5 tracking-[-0.43px]',
} as const;

export type AreaButtonVariant = keyof typeof buttonVariants;

/** The buttons of the design system (MioPersonal.Button): sm 36, md 44, lg 56. */
export function areaButtonClassName(
    variant: AreaButtonVariant = 'primary',
    size: keyof typeof buttonSizes = 'md',
): string {
    return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

const badgeTones = {
    neutral: 'bg-secondary text-foreground',
    brand: 'bg-brand-soft text-brand',
    solid: 'bg-primary text-primary-foreground',
    outline: 'border-input bg-transparent text-foreground',
    success: 'bg-secondary text-[#30d158]',
    warning: 'bg-secondary text-[#ff9f0a]',
    destructive: 'bg-secondary text-[#ff7a7a]',
} as const;

export type BadgeTone = keyof typeof badgeTones;

/** "Tra 2 ore", "Confermata", "Da confermare" (MioPersonal.Badge). */
export function AreaBadge({
    tone = 'neutral',
    children,
    className,
}: {
    tone?: BadgeTone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex min-h-6 shrink-0 items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap',
                badgeTones[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

/** The small turquoise counter: the unread chats on the tabs. */
export function CountPill({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-black tabular-nums',
                className,
            )}
        >
            {children}
        </span>
    );
}

type AreaRowProps = {
    title: ReactNode;
    icon: LucideIcon;
    /** On the right, grey: "3", "1 attivo". */
    value?: ReactNode;
    subtitle?: ReactNode;
    /** A page of the site; `external`: a plain link with the arrow up. */
    href?: string;
    external?: boolean;
    onClick?: () => void;
    className?: string;
};

/**
 * A row of the lists of "Profilo" and "Impostazioni": the icon in a grey tile,
 * the title, the value and the arrow, a thin line under it.
 */
export function AreaRow({
    title,
    icon: Icon,
    value,
    subtitle,
    href,
    external = false,
    onClick,
    className,
}: AreaRowProps) {
    const Arrow = external ? ArrowUpRight : ChevronRight;
    const rowClassName = cn(
        'flex min-h-16 w-full items-center gap-3.5 border-b border-separator py-2.5 text-left text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [@media(hover:hover)]:hover:bg-white/3',
        className,
    );
    const content = (
        <>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] leading-5.5 font-semibold">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-[15px] leading-5 text-muted-foreground">
                        {subtitle}
                    </span>
                )}
            </span>
            {value !== undefined && value !== null && value !== '' && (
                <span className="shrink-0 text-[15px] whitespace-nowrap text-muted-foreground tabular-nums">
                    {value}
                </span>
            )}
            <Arrow
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
            />
        </>
    );

    if (href === undefined) {
        return (
            <button type="button" onClick={onClick} className={rowClassName}>
                {content}
            </button>
        );
    }

    return external ? (
        <a href={href} className={rowClassName}>
            {content}
        </a>
    ) : (
        <Link prefetch={hoverPrefetch} href={href} className={rowClassName}>
            {content}
        </Link>
    );
}

/** A group of rows with its grey title ("LA MIA ATTIVITÀ"). */
export function AreaRowGroup({
    title,
    children,
    className,
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('flex flex-col', className)}>
            <h2 className={cn(areaEyebrowClassName, 'mb-1 uppercase')}>
                {title}
            </h2>
            {children}
        </section>
    );
}

/** "Prenotazioni 2 · Vedi tutte": the title of a section, a count, a link. */
export function AreaSectionHeader({
    id,
    title,
    count,
    link,
    className,
}: {
    id?: string;
    title: string;
    count?: number;
    link?: { label: string; href: string };
    className?: string;
}) {
    return (
        <div
            className={cn('flex items-center justify-between gap-3', className)}
        >
            <div className="flex items-center gap-2.5">
                <h2 id={id} className={areaSectionTitleClassName}>
                    {title}
                </h2>
                {count !== undefined && count > 0 && (
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-card px-2 text-sm font-bold tabular-nums">
                        {count}
                    </span>
                )}
            </div>
            {link && (
                <Link
                    prefetch={hoverPrefetch}
                    href={link.href}
                    className={areaLinkClassName}
                >
                    {link.label}
                </Link>
            )}
        </div>
    );
}

/**
 * The switch of the design system (MioPersonal.Switch): turquoise when on.
 * The label and the note are written next to it by the page.
 */
export function AreaSwitch({
    checked,
    onToggle,
    disabled = false,
    labelledBy,
    describedBy,
}: {
    checked: boolean;
    onToggle: () => void;
    disabled?: boolean;
    labelledBy: string;
    describedBy?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={onToggle}
            className={cn(
                'relative h-7 w-16 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60',
                checked ? 'bg-brand' : 'bg-input',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'absolute top-0.5 left-0.5 h-6 w-9.5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform',
                    checked && 'translate-x-5.5',
                )}
            />
        </button>
    );
}
