import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ClientHeader from '@/components/layout/client-header';
import type { ClientSection } from '@/components/layout/client-nav';
import { ClientSidebar, clientNavItems } from '@/components/layout/client-nav';
import MobileTabBar from '@/components/layout/mobile-tab-bar';

type ClientLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'favorites' }`. */
    section?: ClientSection;
    /** Defaults to the logged-in user's name. */
    userName?: string;
};

/**
 * Client area (docs/design/cliente-dashboard.html). From md up: black side
 * menu and the page on the right (at most 1120 px). On mobile: header on top,
 * tabs at the bottom.
 */
export default function ClientLayout({
    children,
    section,
    userName,
}: ClientLayoutProps) {
    const { auth } = usePage().props;
    const items = clientNavItems(section);
    const name = userName ?? auth?.user?.name ?? '';

    return (
        <div className="flex min-h-screen bg-secondary">
            <ClientSidebar items={items} userName={name} />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="md:hidden">
                    <ClientHeader userName={name} />
                </div>
                <main className="mx-auto flex w-full max-w-280 flex-1 flex-col gap-6 px-4 pt-5 pb-8 md:gap-7 md:px-10 md:pt-8 md:pb-12">
                    {children}
                </main>
                <MobileTabBar
                    items={items.filter((item) => !item.desktopOnly)}
                    label="Navigazione principale"
                />
            </div>
        </div>
    );
}
