import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export type TabItem = NavItem & {
    /** Small counter on the icon, e.g. bookings waiting for an answer. */
    badge?: number;
    /** Shorter name for the narrow tab bar, e.g. "Prenotazioni". */
    shortTitle?: string;
};

const columns: Record<number, string> = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
};

/** The look of a tab, shared with the "Altro" button of components/layout/area-nav.tsx. */
export function tabClassName(active: boolean): string {
    return cn(
        'relative flex min-h-13 flex-col items-center justify-center gap-0.75 rounded-lg text-[11px] leading-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active
            ? 'font-semibold text-foreground'
            : 'font-medium text-muted-foreground',
    );
}

export function TabBadge({ count }: { count?: number }) {
    return count ? (
        <span className="absolute top-1 right-4.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
            <span className="sr-only">, da vedere: </span>
            {count}
        </span>
    ) : null;
}

type MobileTabBarProps = {
    items: TabItem[];
    /** Accessible name of the navigation, e.g. "Area trainer". */
    label: string;
    /** A last tab that is not a link, e.g. "Altro" opening a sheet. */
    extra?: ReactNode;
    className?: string;
};

/** Bottom tab bar shown only below md (client, trainer and gym areas). */
export default function MobileTabBar({
    items,
    label,
    extra,
    className,
}: MobileTabBarProps) {
    return (
        <nav
            aria-label={label}
            className={cn(
                'sticky bottom-0 z-30 grid border-t bg-background px-1 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden',
                columns[items.length + (extra ? 1 : 0)],
                className,
            )}
        >
            {items.map((item) => (
                <Link
                    key={item.title}
                    href={item.href}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={tabClassName(Boolean(item.isActive))}
                >
                    {item.icon && (
                        <item.icon aria-hidden="true" className="size-5.5" />
                    )}
                    {item.shortTitle ?? item.title}
                    <TabBadge count={item.badge} />
                </Link>
            ))}
            {extra}
        </nav>
    );
}
