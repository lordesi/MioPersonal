import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ClientTabBar from '@/components/layout/client-tab-bar';
import PublicFooter from '@/components/layout/public-footer';
import PublicHeader from '@/components/layout/public-header';

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

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PublicHeader
                className={hideHeaderOnMobile ? 'hidden md:block' : undefined}
            />
            <main className="flex flex-1 flex-col">{children}</main>
            <PublicFooter />
            {showClientTabs && <ClientTabBar section="explore" />}
        </div>
    );
}
