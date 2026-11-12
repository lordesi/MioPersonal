import {
    Building2,
    Calendar,
    CalendarDays,
    CircleHelp,
    Clock,
    Compass,
    Eye,
    House,
    Inbox,
    MessageCircle,
    Settings,
    Share2,
    Star,
    Tag,
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
    availability,
    calendar,
    clients,
    events,
    gyms,
    messages,
    requests,
    reviews,
    services,
    settings,
    share,
    today,
} from '@/routes/trainer';
import { edit as editProfile } from '@/routes/trainer/profile';

export type TrainerSection =
    | 'today'
    | 'requests'
    | 'calendar'
    | 'clients'
    | 'messages'
    | 'availability'
    | 'services'
    | 'events'
    | 'gyms'
    | 'profile'
    | 'reviews'
    | 'share'
    | 'settings';

/** The sections with a tab of their own on mobile; the rest is in "Altro". */
export const TRAINER_TABS: TrainerSection[] = [
    'today',
    'calendar',
    'requests',
    'clients',
];

/**
 * The trainer area: the daily work first, then what the clients book
 * ("Offerta"), then what they see ("Profilo").
 */
export function trainerNavGroups(
    current?: TrainerSection,
    pendingCount = 0,
): AreaNavGroup[] {
    const item = (
        section: TrainerSection,
        title: string,
        icon: AreaNavItem['icon'],
        href: string,
        extra: Partial<AreaNavItem> = {},
    ): AreaNavItem => ({ section, title, icon, href, ...extra });

    return withActive(
        [
            {
                items: [
                    item('today', 'Panoramica', House, today.url()),
                    item('requests', 'Richieste', Inbox, requests.url(), {
                        badge: pendingCount,
                    }),
                    item('calendar', 'Calendario', Calendar, calendar.url()),
                    item('clients', 'Clienti', Users, clients.url()),
                    item('messages', 'Messaggi', MessageCircle, messages.url()),
                ],
            },
            {
                label: 'OFFERTA',
                items: [
                    item(
                        'availability',
                        'Disponibilità',
                        Clock,
                        availability.url(),
                    ),
                    item('services', 'Servizi e prezzi', Tag, services.url(), {
                        shortTitle: 'Servizi',
                    }),
                    item('events', 'Eventi', CalendarDays, events.url()),
                    item('gyms', 'Palestre', Building2, gyms.url()),
                ],
            },
            {
                label: 'PROFILO',
                items: [
                    item(
                        'profile',
                        'Modifica profilo',
                        User,
                        editProfile.url(),
                    ),
                    item('reviews', 'Recensioni', Star, reviews.url()),
                    item('share', 'Condividi profilo', Share2, share.url()),
                ],
            },
        ],
        current,
    );
}

/** The links after the groups in the "Altro" sheet. */
export function trainerSheetLinks(publicProfileHref?: string): SheetLink[] {
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
