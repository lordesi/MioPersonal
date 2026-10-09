import { Link } from '@inertiajs/react';
import { Calendar, Clock, House, Star, Users } from 'lucide-react';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import MobileTabBar from '@/components/layout/mobile-tab-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    availability,
    calendar,
    clients,
    reviews,
    today,
} from '@/routes/trainer';

export type TrainerSection =
    | 'today'
    | 'calendar'
    | 'clients'
    | 'availability'
    | 'reviews';

const sections: {
    section: TrainerSection;
    title: string;
    icon: TabItem['icon'];
    href: () => string;
}[] = [
    { section: 'today', title: 'Oggi', icon: House, href: today.url },
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
    { section: 'reviews', title: 'Recensioni', icon: Star, href: reviews.url },
];

export function trainerNavItems(
    current?: TrainerSection,
    pendingCount = 0,
): TabItem[] {
    return sections.map((item) => ({
        title: item.title,
        href: item.href(),
        icon: item.icon,
        isActive: item.section === current,
        badge: item.section === 'today' ? pendingCount : undefined,
    }));
}

type TrainerSidebarProps = {
    items: TabItem[];
    /** When false, shows the "Attiva le notifiche" card under the menu. */
    notificationsEnabled?: boolean;
    onEnableNotifications?: () => void;
};

/** Vertical menu of the trainer area, visible from md up. */
export function TrainerSidebar({
    items,
    notificationsEnabled = true,
    onEnableNotifications,
}: TrainerSidebarProps) {
    return (
        <nav
            aria-label="Area trainer"
            className="hidden w-55 shrink-0 flex-col gap-1 md:flex"
        >
            {items.map((item) => (
                <Link
                    key={item.title}
                    href={item.href}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={cn(
                        'flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium',
                        item.isActive
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {item.icon && (
                        <item.icon aria-hidden="true" className="size-4" />
                    )}
                    {item.title}
                    {item.badge ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
                            {item.badge}
                        </span>
                    ) : null}
                </Link>
            ))}

            {notificationsEnabled ? (
                <p className="mt-4 px-3 text-xs text-muted-foreground">
                    Notifiche attive su questo dispositivo.
                </p>
            ) : (
                <div className="mt-4 flex flex-col gap-2 rounded-xl border bg-background p-3.5">
                    <span className="text-sm font-semibold">
                        Non perdere le prenotazioni
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Ricevi una notifica appena qualcuno prenota.
                    </span>
                    <Button type="button" onClick={onEnableNotifications}>
                        Attiva le notifiche
                    </Button>
                </div>
            )}
        </nav>
    );
}

/** Bottom tab bar of the trainer area, visible below md. */
export function TrainerTabBar({ items }: { items: TabItem[] }) {
    return <MobileTabBar items={items} label="Area trainer" />;
}
