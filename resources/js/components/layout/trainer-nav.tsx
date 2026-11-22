import {
    Building2,
    Eye,
    CircleHelp,
    Clock,
    House,
    Bell,
    Settings,
    Share2,
    ShieldCheck,
    Star,
    Tag,
    Ticket,
    Users,
    Calendar,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { withFeatures } from '@/lib/features';
import type { FeatureName, Features } from '@/lib/features';
import { show as contactPage } from '@/routes/contact';
import {
    availability,
    calendar,
    clients,
    events,
    gyms,
    profile,
    reviews,
    services,
    settings,
    share,
    today,
} from '@/routes/trainer';
import { edit as editProfile } from '@/routes/trainer/profile';

/**
 * The page a trainer page belongs to, set with `Page.layout = { section }`.
 * The menu has four places: Home, Calendario, Clienti and Profilo; every
 * other page lights up the one it lives in (navSection).
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
    | 'share'
    | 'settings';

/** The four places of the menu (sidebar on desktop, tab bar on phones). */
export type TrainerNavSection = 'home' | 'calendar' | 'clients' | 'profile';

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
        case 'messages':
            return 'clients';
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

/** Home, Calendario, Clienti; Profilo is drawn apart (avatar on desktop, 4th tab on phones). */
export function trainerNavItems(): TrainerNavItem[] {
    return [
        { section: 'home', title: 'Home', icon: House, href: today.url() },
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
    ];
}

export const profileNavItem = (): TrainerNavItem => ({
    section: 'profile',
    title: 'Profilo',
    icon: User,
    href: profile.url(),
});

/** A row of the "Profilo" list. */
export type ProfileLink = {
    /** The page it opens, to mark it on desktop. */
    section?: TrainerSection;
    title: string;
    /** Under the title, e.g. "Dati personali, email e password". */
    hint?: string;
    icon: LucideIcon;
    href: string;
    /** Opens outside the trainer area (the public profile, the site). */
    external?: boolean;
    /** Hidden while that part of the site is off (lib/features.ts). */
    feature?: FeatureName;
};

export type ProfileGroup = { label: string; links: ProfileLink[] };

/**
 * The groups of "Profilo": what the clients book (ATTIVITÀ), what they see
 * (VETRINA), the account and the help. Without the rows of the parts of
 * the site switched off (events, gyms).
 */
export function profileGroups(
    publicProfileHref: string | null,
    features: Features,
): ProfileGroup[] {
    const groups: ProfileGroup[] = [
        {
            label: 'ATTIVITÀ',
            links: [
                {
                    section: 'services',
                    title: 'Servizi e prezzi',
                    icon: Tag,
                    href: services.url(),
                },
                {
                    section: 'availability',
                    title: 'Orari',
                    icon: Clock,
                    href: availability.url(),
                },
                {
                    section: 'events',
                    title: 'Eventi',
                    icon: Ticket,
                    href: events.url(),
                    feature: 'events',
                },
                {
                    section: 'gyms',
                    title: 'Palestre',
                    icon: Building2,
                    href: gyms.url(),
                    feature: 'gyms',
                },
            ],
        },
        {
            label: 'VETRINA',
            links: [
                ...(publicProfileHref
                    ? [
                          {
                              title: 'Vedi profilo pubblico',
                              icon: Eye,
                              href: publicProfileHref,
                              external: true,
                          },
                      ]
                    : []),
                {
                    section: 'share',
                    title: 'Condividi profilo',
                    icon: Share2,
                    href: share.url(),
                },
                {
                    section: 'reviews',
                    title: 'Recensioni',
                    icon: Star,
                    href: reviews.url(),
                },
            ],
        },
        {
            label: 'ACCOUNT',
            links: [
                {
                    section: 'settings',
                    title: 'Impostazioni account',
                    icon: Settings,
                    href: settings.url(),
                },
                {
                    title: 'Notifiche',
                    icon: Bell,
                    href: `${settings.url()}#notifiche`,
                },
                {
                    title: 'Privacy e visibilità',
                    icon: ShieldCheck,
                    href: `${settings.url()}#visibilita`,
                },
            ],
        },
        {
            label: 'SUPPORTO',
            links: [
                {
                    title: 'Centro assistenza',
                    icon: CircleHelp,
                    href: contactPage.url(),
                    external: true,
                },
            ],
        },
    ];

    return groups.map((group) => ({
        ...group,
        links: withFeatures(group.links, features),
    }));
}

/** "Modifica profilo": the card at the top of "Profilo". */
export const editProfileHref = (): string => editProfile.url();
