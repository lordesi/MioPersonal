import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { ClientSection } from '@/components/layout/client-header';
import ClientHeader, {
    clientTabItems,
} from '@/components/layout/client-header';
import MobileTabBar from '@/components/layout/mobile-tab-bar';
import { cn } from '@/lib/utils';

type ClientLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'bookings' }`. */
    section?: ClientSection;
    /** Wider page (1280 px instead of 880), e.g. Preferiti and Impostazioni. */
    wide?: boolean;
    /** Defaults to the logged-in user's name. */
    userName?: string;
};

/** Client area: header with the account menu, bottom tabs on mobile. */
export default function ClientLayout({
    children,
    section,
    wide = false,
    userName,
}: ClientLayoutProps) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <ClientHeader
                userName={userName ?? auth?.user?.name ?? ''}
                section={section}
            />
            <main
                className={cn(
                    'mx-auto flex w-full flex-1 flex-col gap-6 px-4 pt-5 pb-8 md:gap-8 md:px-8 md:pt-10 md:pb-20',
                    wide ? 'max-w-7xl' : 'max-w-220',
                )}
            >
                {children}
            </main>
            <MobileTabBar
                items={clientTabItems(section)}
                label="Navigazione principale"
            />
        </div>
    );
}
