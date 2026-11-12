import {
    Building2,
    Calendar,
    CalendarDays,
    CalendarHeart,
    CircleHelp,
    Compass,
    Dumbbell,
    Heart,
    Search,
    Settings,
    User,
} from 'lucide-react';
import type {
    AreaNavGroup,
    AreaNavItem,
    SheetLink,
} from '@/components/layout/area-nav';
import { withActive } from '@/components/layout/area-nav';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { home as publicHome } from '@/routes';
import { settings } from '@/routes/account';
import { favorites, home, profile } from '@/routes/client';
import { show as contactPage } from '@/routes/contact';
import { search as eventsSearch } from '@/routes/events';
import { register as trainerRegister } from '@/routes/trainer';

/** 'explore': the public pages (home and searches) seen by a client. */
export type ClientSection =
    | 'explore'
    | 'bookings'
    | 'favorites'
    | 'profile'
    | 'settings';

/** The sections with a tab of their own on mobile; "Profilo" opens the sheet. */
export const CLIENT_TABS: ClientSection[] = [
    'explore',
    'bookings',
    'favorites',
];

const item = (
    // The searches have a section of their own, never the current one here.
    section: string,
    title: string,
    icon: AreaNavItem['icon'],
    href: string,
    extra: Partial<AreaNavItem> = {},
): AreaNavItem => ({ section, title, icon, href, ...extra });

const mySpace = () => [
    item('bookings', 'Le mie prenotazioni', Calendar, home.url(), {
        shortTitle: 'Prenotazioni',
    }),
    item('favorites', 'Preferiti', Heart, favorites.url()),
    item('profile', 'Il mio profilo', User, profile.url()),
];

/** The side menu: the client's own pages, then the four searches. */
export function clientNavGroups(current?: ClientSection): AreaNavGroup[] {
    return withActive(
        [
            { label: 'IL MIO SPAZIO', items: mySpace() },
            {
                label: 'ESPLORA',
                items: [
                    item(
                        'search-trainers',
                        'Personal trainer',
                        Search,
                        searchUrl(),
                    ),
                    item('search-gyms', 'Palestre', Building2, gymSearchUrl()),
                    item(
                        'search-courses',
                        'Corsi',
                        CalendarDays,
                        courseSearchUrl(),
                    ),
                    item(
                        'search-events',
                        'Eventi',
                        CalendarHeart,
                        eventsSearch.url(),
                    ),
                ],
            },
        ],
        current,
    );
}

/** The mobile tabs: "Esplora" (the home) first, then the client's pages. */
export function clientTabGroups(current?: ClientSection): AreaNavGroup[] {
    return withActive(
        [
            {
                items: [
                    item('explore', 'Esplora', Compass, publicHome.url()),
                    ...mySpace(),
                ],
            },
        ],
        current,
    );
}

/** After "Il mio profilo" in the "Profilo" sheet. */
export function clientSheetLinks(): SheetLink[] {
    return [
        { title: 'Impostazioni account', href: settings.url(), icon: Settings },
        {
            title: 'Centro assistenza',
            href: contactPage.url(),
            icon: CircleHelp,
        },
        {
            title: 'Diventa un trainer',
            href: trainerRegister.url(),
            icon: Dumbbell,
            hint: 'Crea il tuo profilo, è gratis',
        },
    ];
}
