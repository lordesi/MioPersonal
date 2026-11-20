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

/** Home, Cerca, Messaggi; Profilo is drawn apart (avatar on desktop, 4th tab on phones). */
export function clientNavItems(): ClientNavItem[] {
    return [
        { section: 'home', title: 'Home', icon: House, href: home.url() },
        { section: 'search', title: 'Cerca', icon: Search, href: searchUrl() },
        {
            section: 'messages',
            title: 'Messaggi',
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

/** The label of "Messaggi" with the dot: "Messaggi, 2 non letti". */
export function messagesLabel(unread: number): string {
    if (unread <= 0) {
        return 'Messaggi';
    }

    return unread === 1
        ? 'Messaggi, 1 conversazione da leggere'
        : `Messaggi, ${unread} conversazioni da leggere`;
}
