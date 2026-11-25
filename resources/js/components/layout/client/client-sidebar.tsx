import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/layout/brand-logo';
import type { ClientNavSection } from '@/components/layout/client-nav';
import {
    clientNavItems,
    clientProfileNavItem,
    inboxLabel,
} from '@/components/layout/client-nav';
import { Initials } from '@/components/trainer/ui/bits';
import { cn } from '@/lib/utils';
import { home } from '@/routes/client';
import { hoverPrefetch } from '@/lib/prefetch';

type ClientSidebarProps = {
    current: ClientNavSection | null;
    /** Conversations not read: a dot on "Inbox". */
    unreadChats: number;
    userName: string;
    avatar?: string | null;
};

/**
 * The side menu of the client area on tablets and desktop: the dark pill
 * with Home, Cerca and Inbox, and at the bottom the client's photo (or
 * initials), which opens "Profilo".
 */
export default function ClientSidebar({
    current,
    unreadChats,
    userName,
    avatar,
}: ClientSidebarProps) {
    const profile = clientProfileNavItem();
    const unreadNotifications = usePage().props.auth?.unreadNotifications ?? 0;
    const onProfile = current === 'profile';

    return (
        <aside
            className={cn(
                'sticky top-4 flex h-[calc(100dvh-2rem)] w-21 shrink-0 flex-col items-center gap-8 rounded-full border border-separator bg-[rgba(18,19,21,0.72)] pt-6 pb-3.5 backdrop-blur-[24px]',
            )}
        >
            <Link
                prefetch={hoverPrefetch}
                href={home()}
                aria-label="MioPersonal, Home"
                className="flex rounded-full text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <BrandMark className="h-5.5 w-9" />
            </Link>

            <nav
                aria-label="Navigazione principale"
                className="flex flex-col items-center gap-3"
            >
                {clientNavItems().map((item) => {
                    const active = item.section === current;
                    const dot =
                        item.section === 'messages' &&
                        unreadChats + unreadNotifications > 0;

                    return (
                        <Link
                            prefetch={hoverPrefetch}
                            key={item.section}
                            href={item.href}
                            aria-label={
                                item.section === 'messages'
                                    ? inboxLabel(
                                          unreadChats,
                                          unreadNotifications,
                                      )
                                    : item.title
                            }
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
                            {dot && (
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
