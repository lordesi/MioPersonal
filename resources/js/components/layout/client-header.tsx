import { Link } from '@inertiajs/react';
import { Calendar, Heart, Search, User } from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import ThemeToggle from '@/components/shared/theme-toggle';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { settings } from '@/routes/account';
import { bookings, favorites } from '@/routes/client';

export type ClientSection = 'search' | 'bookings' | 'favorites' | 'account';

const navItems: { section: ClientSection; title: string; href: string }[] = [
    { section: 'search', title: 'Cerca trainer', href: searchUrl() },
    { section: 'bookings', title: 'Le mie prenotazioni', href: bookings.url() },
];

const tabs: {
    section: ClientSection;
    title: string;
    icon: TabItem['icon'];
    href: string;
}[] = [
    { section: 'search', title: 'Cerca', icon: Search, href: searchUrl() },
    {
        section: 'bookings',
        title: 'Prenotazioni',
        icon: Calendar,
        href: bookings.url(),
    },
    {
        section: 'favorites',
        title: 'Preferiti',
        icon: Heart,
        href: favorites.url(),
    },
    { section: 'account', title: 'Account', icon: User, href: settings.url() },
];

/** Items of the client bottom tab bar (mobile). */
export function clientTabItems(current?: ClientSection): TabItem[] {
    return tabs.map((tab) => ({
        title: tab.title,
        href: tab.href,
        icon: tab.icon,
        isActive: tab.section === current,
    }));
}

type ClientHeaderProps = {
    userName: string;
    section?: ClientSection;
};

export default function ClientHeader({ userName, section }: ClientHeaderProps) {
    return (
        <header className="border-b bg-background">
            <div className="mx-auto flex h-15 max-w-7xl items-center gap-8 pr-3 pl-4 md:h-18 md:px-8">
                <BrandLogo />

                <nav
                    aria-label="Principale"
                    className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.section}
                            href={item.href}
                            aria-current={
                                item.section === section ? 'page' : undefined
                            }
                            className={cn(
                                'hover:text-foreground',
                                item.section === section && 'text-foreground',
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    <AccountMenu variant="client" userName={userName} />
                </div>
            </div>
        </header>
    );
}
