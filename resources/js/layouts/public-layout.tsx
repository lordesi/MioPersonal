import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ClientTabBar from '@/components/layout/client/client-tab-bar';
import PublicFooter from '@/components/layout/public-footer';
import PublicHeader from '@/components/layout/public-header';
import DarkHeader from '@/components/mp/dark-header';

/**
 * The pages to explore: a logged-in client keeps the tabs of the client area
 * at the bottom (phones), so "Prenotazioni" is always one tap away. Not on the
 * pages of a trainer, gym or event, which have their own bar at the bottom.
 */
const EXPLORE_PAGES = [
    'public/home',
    'public/search',
    'public/gym-search',
    'public/course-search',
    'public/events',
    'public/news',
];

/**
 * The pages of the new dark design (.theme-dark in app.css). The header lies
 * on top of the page (on the photo of the home and of the trainer profile):
 * each page leaves the room for it.
 */
const DARK_PAGES = [
    'public/home',
    'public/search',
    'public/gym-search',
    'public/course-search',
    'public/profile',
    'public/events',
    'public/news',
    'public/how-it-works',
    'public/contacts',
    'public/privacy',
    'public/cookies',
    'public/terms',
    'public/gym',
    'public/event',
    'public/invite',
    'public/not-found',
    'public/error',
    'public/coming-soon',
];

type PublicLayoutProps = {
    children: ReactNode;
    /** For pages with their own mobile header, like the trainer profile. */
    hideHeaderOnMobile?: boolean;
};

/** Pages anyone can see: home, searches, profiles, legal pages. */
export default function PublicLayout({
    children,
    hideHeaderOnMobile = false,
}: PublicLayoutProps) {
    const page = usePage();
    const showClientTabs =
        page.props.auth?.user?.role === 'client' &&
        EXPLORE_PAGES.includes(page.component);
    // Phones only: the pages leave the room at the bottom (pb-28).
    const tabs = showClientTabs && (
        <ClientTabBar
            current={page.component === 'public/home' ? null : 'search'}
            className="md:hidden"
        />
    );

    if (DARK_PAGES.includes(page.component)) {
        return (
            <div className="theme-dark relative flex min-h-screen flex-col">
                <DarkHeader
                    className={
                        hideHeaderOnMobile ? 'hidden md:block' : undefined
                    }
                />
                <main className="flex flex-1 flex-col">{children}</main>
                <PublicFooter
                    variant="dark"
                    className={showClientTabs ? 'max-md:pb-28' : undefined}
                />
                {tabs}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PublicHeader
                className={hideHeaderOnMobile ? 'hidden md:block' : undefined}
            />
            <main className="flex flex-1 flex-col">{children}</main>
            <PublicFooter
                className={showClientTabs ? 'max-md:pb-28' : undefined}
            />
            {tabs}
        </div>
    );
}
