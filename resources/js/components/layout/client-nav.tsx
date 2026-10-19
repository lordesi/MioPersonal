import { Link } from '@inertiajs/react';
import { Calendar, Heart, Search, User } from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { home as publicHome } from '@/routes';
import { favorites, home, profile } from '@/routes/client';

export type ClientSection = 'bookings' | 'search' | 'profile' | 'favorites';

/** A link of the client area; desktopOnly ones stay out of the mobile tab bar. */
export type ClientNavItem = TabItem & {
    section?: ClientSection;
    desktopOnly?: boolean;
};

/**
 * The links of the client area, the same in the side menu and in the mobile
 * tab bar. "Impostazioni account" is in the account menu instead.
 */
export function clientNavItems(current?: ClientSection): ClientNavItem[] {
    const items: Omit<ClientNavItem, 'isActive'>[] = [
        {
            section: 'bookings',
            title: 'Le mie prenotazioni',
            shortTitle: 'Prenotazioni',
            icon: Calendar,
            href: home.url(),
        },
        {
            section: 'search',
            title: 'Cerca trainer',
            shortTitle: 'Cerca',
            icon: Search,
            href: searchUrl(),
        },
        {
            section: 'profile',
            title: 'Modifica profilo',
            shortTitle: 'Profilo',
            icon: User,
            href: profile.url(),
        },
        {
            section: 'favorites',
            title: 'Trainer preferiti',
            shortTitle: 'Preferiti',
            icon: Heart,
            href: favorites.url(),
        },
    ];

    return items.map((item) => ({
        ...item,
        isActive: item.section !== undefined && item.section === current,
    }));
}

type ClientSidebarProps = {
    items: ClientNavItem[];
    userName: string;
};

/** Black side menu of the client area, visible from md up. */
export function ClientSidebar({ items, userName }: ClientSidebarProps) {
    return (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-7 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
            <div className="px-2">
                <Link
                    href={publicHome()}
                    aria-label="MioPersonal, vai alla home"
                    className="flex items-center gap-2.5 text-sidebar-primary"
                >
                    <BrandMark />
                    <span className="text-lg leading-7 font-semibold tracking-tight">
                        MioPersonal
                    </span>
                </Link>
            </div>

            <nav aria-label="Principale" className="flex flex-col gap-0.5">
                {items.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        aria-current={item.isActive ? 'page' : undefined}
                        className={cn(
                            'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm',
                            item.isActive
                                ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                                : 'font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                    >
                        {item.icon && (
                            <item.icon
                                aria-hidden="true"
                                className="size-4.5"
                            />
                        )}
                        <span className="flex-1">{item.title}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <AccountMenu
                    variant="client"
                    placement="sidebar"
                    userName={userName}
                />
            </div>
        </aside>
    );
}
