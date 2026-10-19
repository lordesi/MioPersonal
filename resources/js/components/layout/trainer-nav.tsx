import { Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Eye,
    House,
    Inbox,
    Star,
    Tag,
    Users,
} from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import MobileTabBar from '@/components/layout/mobile-tab-bar';
import { cn } from '@/lib/utils';
import {
    availability,
    calendar,
    clients,
    requests,
    reviews,
    services,
    today,
} from '@/routes/trainer';

export type TrainerSection =
    | 'today'
    | 'requests'
    | 'calendar'
    | 'clients'
    | 'availability'
    | 'services'
    | 'reviews';

/** A link of the trainer area; desktopOnly ones stay out of the mobile tab bar. */
export type TrainerNavItem = TabItem & {
    section: TrainerSection;
    desktopOnly?: boolean;
};

const sections: {
    section: TrainerSection;
    title: string;
    icon: TabItem['icon'];
    href: () => string;
    /** The tab bar has room for 5 links: this one is only in the side menu. */
    desktopOnly?: boolean;
}[] = [
    { section: 'today', title: 'Panoramica', icon: House, href: today.url },
    // On mobile the requests are in "Panoramica", with the badge on its tab.
    {
        section: 'requests',
        title: 'Richieste',
        icon: Inbox,
        href: requests.url,
        desktopOnly: true,
    },
    {
        section: 'calendar',
        title: 'Calendario',
        icon: Calendar,
        href: calendar.url,
    },
    { section: 'clients', title: 'Clienti', icon: Users, href: clients.url },
    {
        section: 'availability',
        title: 'Disponibilità',
        icon: Clock,
        href: availability.url,
    },
    {
        section: 'services',
        title: 'Servizi',
        icon: Tag,
        href: services.url,
        desktopOnly: true,
    },
    { section: 'reviews', title: 'Recensioni', icon: Star, href: reviews.url },
];

export function trainerNavItems(
    current?: TrainerSection,
    pendingCount = 0,
): TrainerNavItem[] {
    return sections.map((item) => ({
        section: item.section,
        title: item.title,
        href: item.href(),
        icon: item.icon,
        isActive: item.section === current,
        badge: item.section === 'requests' ? pendingCount : undefined,
        desktopOnly: item.desktopOnly,
    }));
}

type TrainerSidebarProps = {
    items: TrainerNavItem[];
    userName: string;
    /** "Vedi profilo pubblico", hidden until the registration is sent. */
    publicProfileHref?: string;
};

/** Black side menu of the trainer area, visible from md up. */
export function TrainerSidebar({
    items,
    userName,
    publicProfileHref,
}: TrainerSidebarProps) {
    return (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-7 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
            <div className="flex flex-col gap-2.5 px-2">
                <Link
                    href={today()}
                    aria-label="MioPersonal, area trainer"
                    className="flex items-center gap-2.5 text-sidebar-primary"
                >
                    <BrandMark />
                    <span className="text-lg leading-7 font-semibold tracking-tight">
                        MioPersonal
                    </span>
                </Link>
                <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                    AREA TRAINER
                </span>
            </div>

            <nav aria-label="Area trainer" className="flex flex-col gap-0.5">
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
                    variant="trainer"
                    placement="sidebar"
                    userName={userName}
                    publicProfileHref={publicProfileHref}
                />
            </div>
        </aside>
    );
}

/** Bottom tab bar of the trainer area, visible below md. */
export function TrainerTabBar({
    items,
    pendingCount = 0,
}: {
    items: TrainerNavItem[];
    /** Shown on "Panoramica": "Richieste" has no tab on mobile. */
    pendingCount?: number;
}) {
    return (
        <MobileTabBar
            items={items
                .filter((item) => !item.desktopOnly)
                .map((item) =>
                    item.section === 'today'
                        ? { ...item, badge: pendingCount }
                        : item,
                )}
            label="Area trainer"
        />
    );
}
