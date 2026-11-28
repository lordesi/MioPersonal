import { Calendar, House, MessageCircle, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { calendar, clients, messages, profile, today } from '@/routes/trainer';

/**
 * The page a trainer page belongs to, set with `Page.layout = { section }`.
 * The menu has Oggi, Calendario, Clienti and Inbox, and the photo for
 * Profilo; every other page lights up the one it lives in (navSection).
 */
export type TrainerSection =
    | 'today'
    | 'requests'
    | 'calendar'
    | 'clients'
    | 'messages'
    | 'profile-hub'
    | 'availability'
    | 'services'
    | 'events'
    | 'gyms'
    | 'profile'
    | 'reviews'
    | 'past-sessions'
    | 'settings';

/** The places of the menu (sidebar on desktop, tab bar on phones). */
export type TrainerNavSection =
    | 'home'
    | 'calendar'
    | 'clients'
    | 'inbox'
    | 'profile';

/** Which of the four places a page lights up. */
export function navSection(section?: TrainerSection): TrainerNavSection | null {
    switch (section) {
        case undefined:
            return null;
        case 'today':
        case 'requests':
            return 'home';
        case 'calendar':
            return 'calendar';
        case 'clients':
            return 'clients';
        case 'messages':
            return 'inbox';
        default:
            return 'profile';
    }
}

export type TrainerNavItem = {
    section: TrainerNavSection;
    title: string;
    icon: LucideIcon;
    href: string;
};

/** Oggi, Calendario, Clienti, Inbox; Profilo is the photo (sidebar, headers of the pages). */
export function trainerNavItems(): TrainerNavItem[] {
    return [
        { section: 'home', title: 'Oggi', icon: House, href: today.url() },
        {
            section: 'calendar',
            title: 'Calendario',
            icon: Calendar,
            href: calendar.url(),
        },
        {
            section: 'clients',
            title: 'Clienti',
            icon: Users,
            href: clients.url(),
        },
        {
            section: 'inbox',
            title: 'Inbox',
            icon: MessageCircle,
            href: messages.url(),
        },
    ];
}

export const profileNavItem = (): TrainerNavItem => ({
    section: 'profile',
    title: 'Profilo',
    icon: User,
    href: profile.url(),
});
