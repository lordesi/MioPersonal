import type { ReactNode } from 'react';
import PublicFooter from '@/components/layout/public-footer';
import PublicHeader from '@/components/layout/public-header';

type PublicLayoutProps = {
    children: ReactNode;
    /** For pages with their own mobile header, like the trainer profile. */
    hideHeaderOnMobile?: boolean;
};

/** Pages anyone can see: home, search, trainer profile, legal pages. */
export default function PublicLayout({
    children,
    hideHeaderOnMobile = false,
}: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PublicHeader
                className={hideHeaderOnMobile ? 'hidden md:block' : undefined}
            />
            <main className="flex flex-1 flex-col">{children}</main>
            <PublicFooter />
        </div>
    );
}
