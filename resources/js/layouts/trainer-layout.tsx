import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ProfileStatusNotice from '@/components/layout/profile-status-notice';
import TrainerHeader from '@/components/layout/trainer-header';
import type { TrainerSection } from '@/components/layout/trainer-nav';
import {
    TrainerSidebar,
    TrainerTabBar,
    trainerNavItems,
} from '@/components/layout/trainer-nav';
import type { TrainerAreaData } from '@/types';

type TrainerLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'calendar' }`. */
    section?: TrainerSection;
    /**
     * Bookings waiting for the trainer's answer (badge on "Richieste").
     * Defaults to the `trainerArea` prop every trainer page receives.
     */
    pendingCount?: number;
    publicProfileHref?: string;
    /** Defaults to the logged-in user's name. */
    userName?: string;
};

/**
 * Trainer area. From md up: black side menu and the page on the right
 * (at most 1120 px). On mobile: header on top, tabs at the bottom.
 */
export default function TrainerLayout({
    children,
    section,
    pendingCount,
    publicProfileHref,
    userName,
}: TrainerLayoutProps) {
    const { auth, trainerArea } = usePage<{ trainerArea?: TrainerAreaData }>()
        .props;
    const pending = pendingCount ?? trainerArea?.pendingCount ?? 0;
    const items = trainerNavItems(section, pending);
    const name = userName ?? auth?.user?.name ?? '';
    const profileHref =
        publicProfileHref ?? trainerArea?.publicProfileHref ?? undefined;

    return (
        <div className="flex min-h-screen bg-secondary">
            <TrainerSidebar
                items={items}
                userName={name}
                publicProfileHref={profileHref}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="md:hidden">
                    <TrainerHeader
                        userName={name}
                        notificationCount={pending}
                        publicProfileHref={profileHref}
                    />
                </div>
                <main className="mx-auto flex w-full max-w-280 flex-1 flex-col gap-6 px-4 pt-5 pb-8 md:px-10 md:pt-8 md:pb-12">
                    {trainerArea?.profile && (
                        <ProfileStatusNotice
                            {...trainerArea.profile}
                            previewHref={trainerArea.publicProfileHref}
                        />
                    )}
                    {children}
                </main>
                <TrainerTabBar items={items} pendingCount={pending} />
            </div>
        </div>
    );
}
