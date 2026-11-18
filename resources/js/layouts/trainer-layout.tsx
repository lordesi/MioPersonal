import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import ProfileStatusNotice from '@/components/layout/profile-status-notice';
import TrainerSidebar from '@/components/layout/trainer/trainer-sidebar';
import TrainerTabBar from '@/components/layout/trainer/trainer-tab-bar';
import type { TrainerSection } from '@/components/layout/trainer-nav';
import { navSection } from '@/components/layout/trainer-nav';
import ProfileList from '@/components/trainer/profile-hub/profile-list';
import { panelClassName } from '@/components/trainer/ui/styles';
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
 * The trainer area, dark with a turquoise glow. Desktop: the glass side menu
 * (Vetro 1) and the page on the right; the pages of "Profilo" keep its list
 * on the left. Phones: the page and the floating tab bar (Vetro 4). Two
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
    useEffect(() => {
        document.documentElement.classList.add('theme-dark');

        return () => document.documentElement.classList.remove('theme-dark');
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
                <Glow />
                <main className="relative flex flex-col gap-6 px-4 pt-3 pb-32">
                    {inProfile && (
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
        <div className="theme-dark relative flex min-h-dvh gap-6 bg-background p-4">
            <Glow />
            <TrainerSidebar
                current={current}
                pendingCount={pending}
                unreadChats={unread}
                publicProfileHref={trainerArea?.publicProfileHref ?? null}
                userName={auth?.user?.name ?? ''}
                avatar={auth?.user?.avatar}
            />
            {current === 'profile' && (
                <section
                    aria-label="Sezioni del profilo"
                    className={cn(
                        panelClassName,
                        'sticky top-4 h-[calc(100dvh-2rem)] w-80 shrink-0 [scrollbar-width:none] overflow-y-auto px-3 py-4',
                    )}
                >
                    <h2 className="mx-2.5 mt-1 mb-4.5 text-[28px] leading-8.5 font-bold tracking-[0.38px]">
                        Profilo
                    </h2>
                    <ProfileList current={section} size="sm" />
                </section>
            )}
            <main
                className={cn(
                    'relative flex min-w-0 flex-1 flex-col gap-6',
                    fill ? 'h-[calc(100dvh-2rem)]' : 'pt-2 pb-12',
                    current === 'profile' && 'max-w-240 pt-6 pr-4',
                )}
            >
                {notice}
                {children}
            </main>
        </div>
    );
}

/** The turquoise glow on the left of the page. */
function Glow() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_50%_at_0%_25%,rgba(66,215,217,0.22)_0%,rgba(66,215,217,0)_100%),radial-gradient(30%_40%_at_5%_95%,rgba(66,215,217,0.12)_0%,rgba(66,215,217,0)_100%)] max-md:bg-[radial-gradient(90%_40%_at_20%_100%,rgba(66,215,217,0.18)_0%,rgba(66,215,217,0)_100%)]"
        />
    );
}
