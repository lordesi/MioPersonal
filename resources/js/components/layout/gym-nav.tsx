import {
    CalendarDays,
    CalendarHeart,
    CircleHelp,
    Compass,
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
import type {
    AreaNavGroup,
    AreaNavItem,
    SheetLink,
} from '@/components/layout/area-nav';
import { withActive } from '@/components/layout/area-nav';
import { home } from '@/routes';
import { show as contactPage } from '@/routes/contact';
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
    | 'courses'
    | 'events'
    | 'trainers'
    | 'profile'
    | 'photos'
    | 'amenities'
    | 'plans'
    | 'promotions'
    | 'settings';

/** The sections with a tab of their own on mobile; the rest is in "Altro". */
export const GYM_TABS: GymSection[] = [
    'dashboard',
    'courses',
    'events',
    'trainers',
];

/**
 * The gym area: what happens in the gym ("Attività"), how it looks
 * ("Profilo") and what it costs ("Prezzi").
 */
export function gymNavGroups(
    current?: GymSection,
    pendingCount = 0,
): AreaNavGroup[] {
    const item = (
        section: GymSection,
        title: string,
        icon: AreaNavItem['icon'],
        href: string,
        extra: Partial<AreaNavItem> = {},
    ): AreaNavItem => ({ section, title, icon, href, ...extra });

    return withActive(
        [
            {
                items: [
                    item('dashboard', 'Panoramica', House, dashboard.url()),
                ],
            },
            {
                label: 'ATTIVITÀ',
                items: [
                    item('courses', 'Corsi', CalendarDays, courses.url()),
                    item('events', 'Eventi', CalendarHeart, events.url()),
                    item('trainers', 'Trainer', Users, trainers.url(), {
                        badge: pendingCount,
                    }),
                ],
            },
            {
                label: 'PROFILO',
                items: [
                    item('profile', 'Dati e orari', User, editProfile.url()),
                    item('photos', 'Foto', Image, photos.url()),
                    item('amenities', 'Servizi', Sparkles, amenities.url()),
                ],
            },
            {
                label: 'PREZZI',
                items: [
                    item('plans', 'Abbonamenti', Ticket, plans.url()),
                    item('promotions', 'Promozioni', Tag, promotions.url()),
                ],
            },
        ],
        current,
    );
}

/** The links after the groups in the "Altro" sheet. */
export function gymSheetLinks(publicProfileHref?: string): SheetLink[] {
    return [
        ...(publicProfileHref
            ? [
                  {
                      title: 'Vedi profilo pubblico',
                      href: publicProfileHref,
                      icon: Eye,
                  },
              ]
            : []),
        { title: 'Impostazioni account', href: settings.url(), icon: Settings },
        {
            title: 'Esplora il sito',
            href: home.url(),
            icon: Compass,
            hint: 'Trainer, palestre, corsi ed eventi',
        },
        {
            title: 'Centro assistenza',
            href: contactPage.url(),
            icon: CircleHelp,
        },
    ];
}
