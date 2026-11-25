import { usePage } from '@inertiajs/react';
import { inboxLabel } from '@/components/layout/client-nav';
import type { TrainerNavSection } from '@/components/layout/trainer-nav';
import { trainerNavItems } from '@/components/layout/trainer-nav';
import { dotLabel } from '@/components/layout/trainer/trainer-sidebar';
import AreaTabBar from '@/components/mp/area-tab-bar';

type TrainerTabBarProps = {
    current: TrainerNavSection | null;
    pendingCount: number;
    unreadChats: number;
};

/**
 * The tab bar of the trainer area on phones (design "Trainer · nuovo"):
 * Oggi, Calendario, Clienti and Inbox. "Profilo" opens from the photo at
 * the top of the pages. Dots: the requests on Oggi, chats and notifications
 * not read on Inbox.
 */
export default function TrainerTabBar({
    current,
    pendingCount,
    unreadChats,
}: TrainerTabBarProps) {
    const unreadNotifications = usePage().props.auth?.unreadNotifications ?? 0;

    return (
        <AreaTabBar
            current={current}
            tabs={trainerNavItems().map((item) => {
                const base = {
                    key: item.section,
                    label: item.title,
                    icon: item.icon,
                    href: item.href,
                };

                if (item.section === 'home' && pendingCount > 0) {
                    return {
                        ...base,
                        dot: true,
                        ariaLabel: `${item.title}, ${dotLabel('home', pendingCount)}`,
                    };
                }

                if (item.section === 'inbox') {
                    return {
                        ...base,
                        dot: unreadChats + unreadNotifications > 0,
                        ariaLabel: inboxLabel(unreadChats, unreadNotifications),
                    };
                }

                return base;
            })}
        />
    );
}
