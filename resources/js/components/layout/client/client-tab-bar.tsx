import { usePage } from '@inertiajs/react';
import type { ClientNavSection } from '@/components/layout/client-nav';
import {
    clientNavItems,
    clientProfileNavItem,
    inboxLabel,
} from '@/components/layout/client-nav';
import AreaTabBar from '@/components/mp/area-tab-bar';

type ClientTabBarProps = {
    current: ClientNavSection | null;
    /** e.g. `md:hidden` on the public pages, which have no side menu. */
    className?: string;
};

/**
 * The tab bar of the client on phones: Home, Cerca, Inbox and Profilo. In
 * the client area and on the public pages to explore, so the way back is
 * always in sight. The dot on "Inbox": chats or notifications not read.
 */
export default function ClientTabBar({
    current,
    className,
}: ClientTabBarProps) {
    const { clientArea, auth } = usePage().props;
    const unreadChats = clientArea?.unreadChats ?? 0;
    const unreadNotifications = auth?.unreadNotifications ?? 0;

    return (
        <AreaTabBar
            current={current}
            className={className}
            tabs={[...clientNavItems(), clientProfileNavItem()].map((item) => ({
                key: item.section,
                label: item.title,
                icon: item.icon,
                href: item.href,
                ...(item.section === 'messages' && {
                    ariaLabel: inboxLabel(unreadChats, unreadNotifications),
                    dot: unreadChats + unreadNotifications > 0,
                }),
            }))}
        />
    );
}
