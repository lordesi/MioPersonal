import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export type TabItem = NavItem & {
    /** Small counter on the icon, e.g. bookings waiting for an answer. */
    badge?: number;
};

const columns: Record<number, string> = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
};

type MobileTabBarProps = {
    items: TabItem[];
    /** Accessible name of the navigation, e.g. "Area trainer". */
    label: string;
    className?: string;
};

/** Bottom tab bar shown only below md (trainer and client areas). */
export default function MobileTabBar({
    items,
    label,
    className,
}: MobileTabBarProps) {
    return (
        <nav
            aria-label={label}
            className={cn(
                'sticky bottom-0 grid border-t bg-background px-1 pt-1.5 pb-2.5 md:hidden',
                columns[items.length],
                className,
            )}
        >
            {items.map((item) => (
                <Link
                    key={item.title}
                    href={item.href}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={cn(
                        'relative flex min-h-13 flex-col items-center justify-center gap-0.75 rounded-lg text-[11px] leading-3.5',
                        item.isActive
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-muted-foreground',
                    )}
                >
                    {item.icon && (
                        <item.icon aria-hidden="true" className="size-5.5" />
                    )}
                    {item.title}
                    {item.badge ? (
                        <span className="absolute top-1 right-4.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                            {item.badge}
                        </span>
                    ) : null}
                </Link>
            ))}
        </nav>
    );
}
