import type { ReactNode } from 'react';
import PublicFooter from '@/components/layout/public-footer';
import type {
    PublicNav,
    PublicSection,
} from '@/components/layout/public-header';
import PublicHeader from '@/components/layout/public-header';

type PublicLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'search' }`. */
    section?: PublicSection;
    nav?: PublicNav;
    footer?: 'full' | 'compact';
    /** For pages with their own mobile header, like the trainer profile. */
    hideHeaderOnMobile?: boolean;
};

/** Pages anyone can see: home, search, trainer profile, legal pages. */
export default function PublicLayout({
    children,
    section,
    nav,
    footer = 'full',
    hideHeaderOnMobile = false,
}: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PublicHeader
                section={section}
                nav={nav}
                className={hideHeaderOnMobile ? 'hidden md:block' : undefined}
            />
            <main className="flex flex-1 flex-col">{children}</main>
            <PublicFooter variant={footer} />
        </div>
    );
}
