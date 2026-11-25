import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/layout/brand-logo';
import { inboxLabel } from '@/components/layout/client-nav';
import type { TrainerNavSection } from '@/components/layout/trainer-nav';
import {
    profileNavItem,
    trainerNavItems,
} from '@/components/layout/trainer-nav';
import { Initials } from '@/components/trainer/ui/bits';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';
import { today } from '@/routes/trainer';

type TrainerSidebarProps = {
    current: TrainerNavSection | null;
    /** Requests waiting: a dot on "Oggi". */
    pendingCount: number;
    /** Conversations not read: a dot on "Inbox". */
    unreadChats: number;
    userName: string;
    avatar?: string | null;
};

/**
 * The side menu of the trainer area on desktop (design "Trainer · nuovo"):
 * the dark pill with Oggi, Calendario, Clienti and Inbox, and at the bottom
 * the trainer's photo (or initials), which opens "Profilo".
 */
export default function TrainerSidebar({
    current,
    pendingCount,
    unreadChats,
    userName,
    avatar,
}: TrainerSidebarProps) {
    const profile = profileNavItem();
    const unreadNotifications = usePage().props.auth?.unreadNotifications ?? 0;
    const onProfile = current === 'profile';

    const labelOf = (section: TrainerNavSection, title: string) => {
        if (section === 'home' && pendingCount > 0) {
            return `${title}, ${dotLabel('home', pendingCount)}`;
        }

        if (section === 'inbox') {
            return inboxLabel(unreadChats, unreadNotifications);
        }

        return title;
    };
    const hasDot = (section: TrainerNavSection) =>
        (section === 'home' && pendingCount > 0) ||
        (section === 'inbox' && unreadChats + unreadNotifications > 0);

    return (
        <aside className="sticky top-4 flex h-[calc(100dvh-2rem)] w-21 shrink-0 flex-col items-center gap-8 rounded-full border border-separator bg-[rgba(18,19,21,0.72)] pt-6 pb-3.5 backdrop-blur-[24px]">
            <Link
                prefetch={hoverPrefetch}
                href={today()}
                aria-label="MioPersonal, Oggi"
                className="flex rounded-full text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <BrandMark className="h-5.5 w-9" />
            </Link>

            <nav
                aria-label="Navigazione principale"
                className="flex flex-col items-center gap-3"
            >
                {trainerNavItems().map((item) => {
                    const active = item.section === current;

                    return (
                        <Link
                            prefetch={hoverPrefetch}
                            key={item.section}
                            href={item.href}
                            aria-label={labelOf(item.section, item.title)}
                            title={item.title}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex size-13 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                active
                                    ? 'bg-brand text-black shadow-[0_8px_24px_rgba(66,215,217,0.28)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                            )}
                        >
                            <item.icon aria-hidden="true" className="size-6" />
                            {hasDot(item.section) && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute top-2.5 right-2.5 size-2.25 rounded-full shadow-[0_0_0_2px_#121315]',
                                        active ? 'bg-black' : 'bg-brand',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <Link
                prefetch={hoverPrefetch}
                href={profile.href}
                aria-label={profile.title}
                title={profile.title}
                aria-current={onProfile ? 'page' : undefined}
                className={cn(
                    'mt-auto flex size-13 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    onProfile &&
                        avatar &&
                        'shadow-[0_0_0_2px_#121315,0_0_0_4px_var(--brand)]',
                )}
            >
                <Initials
                    name={userName}
                    src={avatar}
                    size={52}
                    className={cn(
                        'text-[15px] font-bold',
                        onProfile
                            ? 'bg-brand text-black'
                            : 'bg-secondary text-foreground',
                    )}
                />
            </Link>
        </aside>
    );
}

/** "1 richiesta da confermare", "2 conversazioni da leggere". */
export function dotLabel(section: TrainerNavSection, count: number): string {
    if (section === 'home') {
        return count === 1
            ? '1 richiesta da confermare'
            : `${count} richieste da confermare`;
    }

    return count === 1
        ? '1 conversazione da leggere'
        : `${count} conversazioni da leggere`;
}
