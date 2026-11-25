import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import ProfileStatusNotice from '@/components/layout/profile-status-notice';
import TrainerSidebar from '@/components/layout/trainer/trainer-sidebar';
import TrainerTabBar from '@/components/layout/trainer/trainer-tab-bar';
import type { TrainerSection } from '@/components/layout/trainer-nav';
import { navSection } from '@/components/layout/trainer-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { profile } from '@/routes/trainer';
import type { TrainerAreaData } from '@/types';

type TrainerLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'calendar' }`. */
    section?: TrainerSection;
    /**
     * Pages that draw their own full-height panels (Calendario, Clienti on
     * desktop): no padding at the bottom, the page fills the screen.
     */
    fill?: boolean;
};

/**
 * The trainer area, on the black of the "carbone" design. Desktop: the side
 * menu and the page on the right; the pages of "Profilo" keep its list on
 * the left. Phones: the page and the floating tab bar. Two
 * different drawings, chosen by the width of the screen (the area is never
 * rendered on the server, so no mismatch).
 */
export default function TrainerLayout({
    children,
    section,
    fill = false,
}: TrainerLayoutProps) {
    const { auth, trainerArea } = usePage<{ trainerArea?: TrainerAreaData }>()
        .props;
    const isMobile = useIsMobile();
    const current = navSection(section);
    const pending = trainerArea?.pendingCount ?? 0;
    const unread = trainerArea?.unreadChats ?? 0;

    // Dialogs, menus and toasts open in a portal outside the page: dark too.
    // "trainer-area": the buttons of the area as in "Diventa trainer" (app.css).
    useEffect(() => {
        document.documentElement.classList.add('theme-dark', 'trainer-area');

        return () =>
            document.documentElement.classList.remove(
                'theme-dark',
                'trainer-area',
            );
    }, []);

    const notice = trainerArea?.profile && (
        <ProfileStatusNotice
            {...trainerArea.profile}
            previewHref={trainerArea.publicProfileHref}
        />
    );

    // The pages of "Profilo" (services, hours, settings…), not the list itself.
    const inProfile = current === 'profile' && section !== 'profile-hub';

    if (isMobile) {
        return (
            <div className="theme-dark relative min-h-dvh bg-background">
                <main className="relative flex flex-col gap-8 px-4 pt-6 pb-32">
                    {inProfile && section !== 'settings' && (
                        <Link
                            href={profile()}
                            className="-mb-2 inline-flex min-h-11 items-center gap-1 self-start text-[17px] text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-5.5"
                            />
                            Profilo
                        </Link>
                    )}
                    {notice}
                    {children}
                </main>
                <TrainerTabBar
                    current={current}
                    pendingCount={pending}
                    unreadChats={unread}
                />
            </div>
        );
    }

    return (
        <div className="theme-dark relative flex min-h-dvh gap-6 bg-background p-4 lg:gap-10">
            <TrainerSidebar
                current={current}
                pendingCount={pending}
                unreadChats={unread}
                userName={auth?.user?.name ?? ''}
                avatar={auth?.user?.avatar}
            />
            <main
                className={cn(
                    'relative flex w-full min-w-0 flex-1 flex-col gap-8',
                    fill
                        ? 'h-[calc(100dvh-2rem)] pr-2 lg:pr-6'
                        : 'mx-auto max-w-280 pt-6 pr-2 pb-12 lg:pr-6',
                )}
            >
                {notice}
                {children}
            </main>
        </div>
    );
}
