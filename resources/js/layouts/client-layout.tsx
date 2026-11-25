import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import ClientSidebar from '@/components/layout/client/client-sidebar';
import ClientTabBar from '@/components/layout/client/client-tab-bar';
import type { ClientSection } from '@/components/layout/client-nav';
import {
    clientNavSection,
    inClientProfile,
} from '@/components/layout/client-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { profile } from '@/routes/client';

type ClientLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'favorites' }`. */
    section?: ClientSection;
    /**
     * Pages that draw their own full-height panels (Messaggi on desktop): no
     * padding at the bottom, the page fills the screen.
     */
    fill?: boolean;
};

/**
 * The client area, on the black of the "carbone" design. Phones: the page
 * and the floating tab bar (Home, Cerca, Inbox, Profilo).
 * Tablets and desktop: the glass side menu and the page on the right. The
 * area is never rendered on the server, so the two drawings never mismatch.
 */
export default function ClientLayout({
    children,
    section,
    fill = false,
}: ClientLayoutProps) {
    const { auth, clientArea } = usePage().props;
    const isMobile = useIsMobile();
    const current = clientNavSection(section);
    // The pages of "Profilo" (bookings, favorites, settings…), not the list itself.
    const inProfile = inClientProfile(section);

    // Dialogs, menus and toasts open in a portal outside the page: dark too.
    useEffect(() => {
        document.documentElement.classList.add('theme-dark');

        return () => document.documentElement.classList.remove('theme-dark');
    }, []);

    // "Impostazioni" draws its own: "‹ Profilo" on the list, "‹ Impostazioni" inside.
    const back = inProfile && section !== 'settings' && (
        <Link
            href={profile()}
            className="-mb-2 inline-flex min-h-11 items-center gap-1 self-start text-[17px] text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <ChevronLeft aria-hidden="true" className="size-5.5" />
            Profilo
        </Link>
    );

    if (isMobile) {
        return (
            <div className="theme-dark relative min-h-dvh bg-background text-foreground">
                <main
                    className={cn(
                        'relative flex flex-col gap-8 px-4 pt-6',
                        fill ? 'pb-28' : 'pb-32',
                    )}
                >
                    {back}
                    {children}
                </main>
                <ClientTabBar current={current} />
            </div>
        );
    }

    return (
        <div className="theme-dark relative flex min-h-dvh gap-6 bg-background p-4 text-foreground lg:gap-10">
            <ClientSidebar
                current={current}
                unreadChats={clientArea?.unreadChats ?? 0}
                userName={auth?.user?.name ?? ''}
                avatar={auth?.user?.avatar}
            />
            <main
                className={cn(
                    'relative flex w-full min-w-0 flex-1 flex-col gap-8',
                    // Full-height pages use the whole width, like "Clienti" of the trainer.
                    fill
                        ? 'h-[calc(100dvh-2rem)]'
                        : 'mx-auto max-w-280 pt-6 pr-2 pb-12 lg:pr-6',
                )}
            >
                {back}
                {children}
            </main>
        </div>
    );
}
