import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
     * Bookings waiting for the trainer's answer (badge on "Oggi").
     * Defaults to the `trainerArea` prop every trainer page receives.
     */
    pendingCount?: number;
    notificationCount?: number;
    notificationsEnabled?: boolean;
    publicProfileHref?: string;
    /** Defaults to the logged-in user's name. */
    userName?: string;
};

/** Trainer area: header, side menu on desktop, bottom tabs on mobile. */
export default function TrainerLayout({
    children,
    section,
    pendingCount,
    notificationCount,
    notificationsEnabled = true,
    publicProfileHref,
    userName,
}: TrainerLayoutProps) {
    const { auth, trainerArea } = usePage<{ trainerArea?: TrainerAreaData }>()
        .props;
    const pending = pendingCount ?? trainerArea?.pendingCount ?? 0;
    const items = trainerNavItems(section, pending);

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <TrainerHeader
                userName={userName ?? auth?.user?.name ?? ''}
                notificationCount={notificationCount ?? pending}
                publicProfileHref={
                    publicProfileHref ?? trainerArea?.publicProfileHref
                }
            />
            <div className="mx-auto flex w-full max-w-340 flex-1 items-start gap-7 px-4 pt-5 pb-7 md:px-8 md:pt-7 md:pb-16">
                <TrainerSidebar
                    items={items}
                    notificationsEnabled={notificationsEnabled}
                />
                <main className="flex min-w-0 flex-1 flex-col gap-6">
                    {children}
                </main>
            </div>
            <TrainerTabBar items={items} />
        </div>
    );
}
