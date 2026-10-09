import { usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdminSection } from '@/components/layout/admin-nav';
import {
    AdminMobileNav,
    AdminSidebar,
    adminSectionTitle,
} from '@/components/layout/admin-nav';
import type { AdminAreaData } from '@/types';

type AdminLayoutProps = {
    children: ReactNode;
    /** Set from the page: `Page.layout = { section: 'messages' }`. */
    section?: AdminSection;
    /** Menu badges: default to the `adminArea` prop every admin page receives. */
    verificationCount?: number;
    unreadMessages?: number;
    flaggedReviews?: number;
};

/** Admin panel (desktop only in the design): side menu, title bar, page. */
export default function AdminLayout({
    children,
    section,
    verificationCount,
    unreadMessages,
    flaggedReviews,
}: AdminLayoutProps) {
    const { auth, adminArea } = usePage<{ adminArea?: AdminAreaData }>().props;
    const area: AdminAreaData = {
        verificationCount:
            verificationCount ?? adminArea?.verificationCount ?? 0,
        unreadMessages: unreadMessages ?? adminArea?.unreadMessages ?? 0,
        flaggedReviews: flaggedReviews ?? adminArea?.flaggedReviews ?? 0,
    };
    const title = adminSectionTitle(section);

    return (
        <div className="flex min-h-screen bg-secondary">
            <AdminSidebar
                current={section}
                area={area}
                userName={auth?.user?.name ?? ''}
                twoFactorEnabled={Boolean(auth?.user?.two_factor_confirmed_at)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <AdminMobileNav current={section} area={area} />

                <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-8">
                    <h1 className="text-xl font-bold tracking-tight">
                        {title}
                    </h1>
                    {/* TODO: search users, trainers and bookings once they are stored. */}
                    <label className="ml-auto hidden h-10 w-90 items-center gap-2 rounded-lg border border-input bg-background px-3 md:flex">
                        <Search
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                        />
                        <span className="sr-only">Cerca</span>
                        <input
                            type="search"
                            placeholder="Cerca utenti, trainer, prenotazioni (#1048)…"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </label>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-4 pt-6 pb-12 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
