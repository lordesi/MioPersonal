import { House, MessageCircle, Search, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { searchUrl } from '@/lib/search';
import { home, messages, profile } from '@/routes/client';

/**
 * The page a client page belongs to, set with `Page.layout = { section }`.
 * 'explore': the public pages (home and searches) seen by a client.
 */
export type ClientSection =
    | 'explore'
    | 'home'
    | 'messages'
    | 'profile'
    | 'bookings'
    | 'favorites'
    | 'edit-profile'
    | 'settings';

/** The four places of the menu (sidebar on desktop, tab bar on phones). */
export type ClientNavSection = 'home' | 'search' | 'messages' | 'profile';

/** Which of the four places a page lights up. */
export function clientNavSection(
    section?: ClientSection,
): ClientNavSection | null {
    switch (section) {
        case undefined:
            return null;
        case 'explore':
            return 'search';
        case 'home':
        case 'messages':
            return section;
        default:
            return 'profile';
    }
}

/** The pages opened from "Profilo": on phones they show "‹ Profilo". */
export const inClientProfile = (section?: ClientSection): boolean =>
    section !== undefined &&
    section !== 'profile' &&
    clientNavSection(section) === 'profile';

export type ClientNavItem = {
    section: ClientNavSection;
    title: string;
    icon: LucideIcon;
    href: string;
};

/** Home, Cerca, Inbox; Profilo is drawn apart (avatar on desktop, 4th tab on phones). */
export function clientNavItems(): ClientNavItem[] {
    return [
        { section: 'home', title: 'Home', icon: House, href: home.url() },
        { section: 'search', title: 'Cerca', icon: Search, href: searchUrl() },
        {
            section: 'messages',
            title: 'Inbox',
            icon: MessageCircle,
            href: messages.url(),
        },
    ];
}

export const clientProfileNavItem = (): ClientNavItem => ({
    section: 'profile',
    title: 'Profilo',
    icon: User,
    href: profile.url(),
});

/**
 * The label of "Inbox" with the dot: the chats not read and the new
 * notifications. "Inbox, 2 chat da leggere e 1 notifica nuova".
 */
export function inboxLabel(
    unreadChats: number,
    unreadNotifications = 0,
): string {
    const parts: string[] = [];

    if (unreadChats > 0) {
        parts.push(
            unreadChats === 1
                ? '1 chat da leggere'
                : `${unreadChats} chat da leggere`,
        );
    }

    if (unreadNotifications > 0) {
        parts.push(
            unreadNotifications === 1
                ? '1 notifica nuova'
                : `${unreadNotifications} notifiche nuove`,
        );
    }

    return parts.length === 0 ? 'Inbox' : `Inbox, ${parts.join(' e ')}`;
}
