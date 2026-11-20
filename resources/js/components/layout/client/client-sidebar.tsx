import { Link } from '@inertiajs/react';
import { BrandMark } from '@/components/layout/brand-logo';
import type { ClientNavSection } from '@/components/layout/client-nav';
import {
    clientNavItems,
    clientProfileNavItem,
    messagesLabel,
} from '@/components/layout/client-nav';
import { Initials } from '@/components/trainer/ui/bits';
import { glassClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import { home } from '@/routes/client';

type ClientSidebarProps = {
    current: ClientNavSection | null;
    /** Conversations not read: a dot on "Messaggi". */
    unreadChats: number;
    userName: string;
    avatar?: string | null;
};

/**
 * The side menu of the client area on tablets and desktop: the glass pill of
 * the trainer area with Home, Cerca and Messaggi, and at the bottom the
 * client's photo, which opens "Profilo".
 */
export default function ClientSidebar({
    current,
    unreadChats,
    userName,
    avatar,
}: ClientSidebarProps) {
    const profile = clientProfileNavItem();

    return (
        <aside
            className={cn(
                'sticky top-4 flex h-[calc(100dvh-2rem)] w-20 shrink-0 flex-col items-center gap-8 rounded-full pt-6 pb-3.5',
                glassClassName,
            )}
        >
            <Link
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
                    const dot = item.section === 'messages' && unreadChats > 0;

                    return (
                        <Link
                            key={item.section}
                            href={item.href}
                            aria-label={
                                item.section === 'messages'
                                    ? messagesLabel(unreadChats)
                                    : item.title
                            }
                            title={item.title}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex size-13 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                active
                                    ? 'bg-brand text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                            )}
                        >
                            <item.icon
                                aria-hidden="true"
                                className="size-5.5"
                            />
                            {dot && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute top-2 right-2 size-2.5 rounded-full shadow-[0_0_0_2px_#1c1c1c]',
                                        active ? 'bg-[#0a0a0a]' : 'bg-brand',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <Link
                href={profile.href}
                aria-label={profile.title}
                title={profile.title}
                aria-current={current === 'profile' ? 'page' : undefined}
                className={cn(
                    'mt-auto flex size-13 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    current === 'profile'
                        ? 'shadow-[0_0_0_3px_#1c1c1c,0_0_0_5px_#42d7d9]'
                        : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
                )}
            >
                <Initials name={userName} src={avatar} size={52} />
            </Link>
        </aside>
    );
}
