import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Calendar,
    House,
    List,
    Mail,
    Settings,
    ShieldCheck,
    Star,
    Users,
} from 'lucide-react';
import BrandLogo from '@/components/layout/brand-logo';
import UserAvatar from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import {
    bookings,
    catalog,
    messages,
    overview,
    reviews,
    settings,
    users,
    verification,
} from '@/routes/admin';
import type { AdminAreaData } from '@/types';

export type AdminSection =
    | 'overview'
    | 'verification'
    | 'messages'
    | 'bookings'
    | 'users'
    | 'reviews'
    | 'catalog'
    | 'settings';

const sections: {
    section: AdminSection;
    title: string;
    icon: LucideIcon;
    href: () => string;
    badge?: keyof AdminAreaData;
}[] = [
    {
        section: 'overview',
        title: 'Panoramica',
        icon: House,
        href: overview.url,
    },
    {
        section: 'verification',
        title: 'Verifica trainer',
        icon: ShieldCheck,
        href: verification.url,
        badge: 'verificationCount',
    },
    {
        section: 'messages',
        title: 'Messaggi',
        icon: Mail,
        href: messages.url,
        badge: 'unreadMessages',
    },
    {
        section: 'bookings',
        title: 'Prenotazioni',
        icon: Calendar,
        href: bookings.url,
    },
    { section: 'users', title: 'Utenti', icon: Users, href: users.url },
    {
        section: 'reviews',
        title: 'Recensioni',
        icon: Star,
        href: reviews.url,
        badge: 'flaggedReviews',
    },
    {
        section: 'catalog',
        title: 'Discipline e zone',
        icon: List,
        href: catalog.url,
    },
    {
        section: 'settings',
        title: 'Impostazioni e registro',
        icon: Settings,
        href: settings.url,
    },
];

/** The page title in the admin header, e.g. "Verifica trainer". */
export function adminSectionTitle(section?: AdminSection): string {
    return sections.find((item) => item.section === section)?.title ?? 'Admin';
}

type AdminNavProps = {
    current?: AdminSection;
    area: AdminAreaData;
};

function NavLinks({
    current,
    area,
    className,
    linkClassName,
}: AdminNavProps & { className?: string; linkClassName?: string }) {
    return (
        <nav aria-label="Amministrazione" className={className}>
            {sections.map((item) => {
                const isActive = item.section === current;
                const badge = item.badge ? area[item.badge] : 0;

                return (
                    <Link
                        key={item.section}
                        href={item.href()}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                            'flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-accent',
                            linkClassName,
                        )}
                    >
                        <item.icon aria-hidden="true" className="size-4" />
                        {item.title}
                        {badge > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1.5 text-[11px] font-bold tabular-nums">
                                {badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

function AdminBrand() {
    return (
        <div className="flex items-center gap-2.5">
            <BrandLogo linkToHome={false} />
            <span className="flex h-5 items-center rounded-full bg-primary px-1.75 text-[11px] font-bold text-primary-foreground">
                Admin
            </span>
        </div>
    );
}

type AdminSidebarProps = AdminNavProps & {
    userName: string;
    twoFactorEnabled: boolean;
};

/** Side menu of the admin panel, visible from lg up. */
export function AdminSidebar({
    current,
    area,
    userName,
    twoFactorEnabled,
}: AdminSidebarProps) {
    return (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-5 border-r bg-background px-3.5 py-5 lg:flex">
            <div className="px-1.5">
                <AdminBrand />
            </div>
            <NavLinks
                current={current}
                area={area}
                className="flex flex-col gap-0.5"
            />
            <div className="mt-auto flex flex-col gap-2.5 rounded-xl border p-3">
                <div className="flex items-center gap-2.5">
                    <UserAvatar name={userName} />
                    <span className="flex flex-col">
                        <span className="text-sm font-semibold">
                            {userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Admin ·{' '}
                            {twoFactorEnabled
                                ? '2FA attiva'
                                : '2FA da attivare'}
                        </span>
                    </span>
                </div>
                <Link href={home()} className="text-[13px] underline">
                    Vai al sito pubblico
                </Link>
            </div>
        </aside>
    );
}

/**
 * Below lg the panel is not designed (desktop only): logo and a menu that
 * scrolls sideways, so the pages stay usable from a phone.
 */
export function AdminMobileNav({ current, area }: AdminNavProps) {
    return (
        <div className="flex flex-col gap-3 border-b bg-background px-4 pt-3 lg:hidden">
            <AdminBrand />
            <NavLinks
                current={current}
                area={area}
                className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3"
                linkClassName="h-9 whitespace-nowrap"
            />
        </div>
    );
}
