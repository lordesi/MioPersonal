import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarHeart,
    Eye,
    House,
    Image,
    Settings,
    Sparkles,
    Tag,
    Ticket,
    User,
    Users,
} from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import MobileTabBar from '@/components/layout/mobile-tab-bar';
import { cn } from '@/lib/utils';
import {
    amenities,
    courses,
    dashboard,
    events,
    photos,
    plans,
    promotions,
    settings,
    trainers,
} from '@/routes/gym';
import { edit as editProfile } from '@/routes/gym/profile';

export type GymSection =
    | 'dashboard'
    | 'profile'
    | 'photos'
    | 'amenities'
    | 'courses'
    | 'events'
    | 'plans'
    | 'promotions'
    | 'trainers'
    | 'settings';

export type GymNavItem = TabItem & {
    section: GymSection;
    desktopOnly?: boolean;
};

const sections: {
    section: GymSection;
    title: string;
    icon: TabItem['icon'];
    href: () => string;
    /** The tab bar has room for 5 links; these are in the account menu on mobile. */
    desktopOnly?: boolean;
}[] = [
    {
        section: 'dashboard',
        title: 'Panoramica',
        icon: House,
        href: dashboard.url,
    },
    {
        section: 'profile',
        title: 'Profilo',
        icon: User,
        href: editProfile.url,
        desktopOnly: true,
    },
    { section: 'photos', title: 'Foto', icon: Image, href: photos.url },
    {
        section: 'amenities',
        title: 'Servizi',
        icon: Sparkles,
        href: amenities.url,
        // The tab bar has its 5 links already.
        desktopOnly: true,
    },
    {
        section: 'courses',
        title: 'Corsi',
        icon: CalendarDays,
        href: courses.url,
        desktopOnly: true,
    },
    {
        section: 'events',
        title: 'Eventi',
        icon: CalendarHeart,
        href: events.url,
        desktopOnly: true,
    },
    {
        section: 'plans',
        title: 'Abbonamenti',
        icon: Ticket,
        href: plans.url,
    },
    {
        section: 'promotions',
        title: 'Promozioni',
        icon: Tag,
        href: promotions.url,
    },
    { section: 'trainers', title: 'Trainer', icon: Users, href: trainers.url },
    {
        section: 'settings',
        title: 'Impostazioni',
        icon: Settings,
        href: settings.url,
        desktopOnly: true,
    },
];

export function gymNavItems(
    current?: GymSection,
    pendingCount = 0,
): GymNavItem[] {
    return sections.map((item) => ({
        section: item.section,
        title: item.title,
        href: item.href(),
        icon: item.icon,
        isActive: item.section === current,
        badge: item.section === 'trainers' ? pendingCount : undefined,
        desktopOnly: item.desktopOnly,
    }));
}

/** Black side menu of the gym area, visible from md up. */
export function GymSidebar({
    items,
    userName,
    publicProfileHref,
}: {
    items: GymNavItem[];
    userName: string;
    publicProfileHref?: string;
}) {
    return (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-7 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
            <div className="flex flex-col gap-2.5 px-2">
                <Link
                    href={dashboard()}
                    aria-label="MioPersonal, area palestra"
                    className="flex items-center gap-2.5 text-sidebar-primary"
                >
                    <BrandMark />
                    <span className="text-lg leading-7 font-semibold tracking-tight">
                        MioPersonal
                    </span>
                </Link>
                <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                    AREA PALESTRA
                </span>
            </div>

            <nav aria-label="Area palestra" className="flex flex-col gap-0.5">
                {items.map((item) => (
                    <Link
                        key={item.section}
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
                        {item.badge ? (
                            <span
                                className={cn(
                                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                                    item.isActive
                                        ? 'bg-sidebar-primary-foreground text-sidebar-primary'
                                        : 'bg-sidebar-primary text-sidebar-primary-foreground',
                                )}
                            >
                                <span className="sr-only">da confermare: </span>
                                {item.badge}
                            </span>
                        ) : null}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
                {publicProfileHref && (
                    <Link
                        href={publicProfileHref}
                        className="flex min-h-11 items-center gap-2.5 rounded-[10px] border border-sidebar-border px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        <Eye aria-hidden="true" className="size-4.5" />
                        Vedi profilo pubblico
                    </Link>
                )}
                <AccountMenu
                    variant="gym"
                    placement="sidebar"
                    userName={userName}
                    publicProfileHref={publicProfileHref}
                />
            </div>
        </aside>
    );
}

/** Bottom tab bar of the gym area, visible below md. */
export function GymTabBar({ items }: { items: GymNavItem[] }) {
    return (
        <MobileTabBar
            items={items.filter((item) => !item.desktopOnly)}
            label="Area palestra"
        />
    );
}
