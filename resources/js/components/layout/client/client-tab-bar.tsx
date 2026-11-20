import { Link, usePage } from '@inertiajs/react';
import type { ClientNavSection } from '@/components/layout/client-nav';
import {
    clientNavItems,
    clientProfileNavItem,
    messagesLabel,
} from '@/components/layout/client-nav';
import { glassClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';

type ClientTabBarProps = {
    current: ClientNavSection | null;
    /** e.g. `md:hidden` on the public pages, which have no side menu. */
    className?: string;
};

/**
 * The tab bar of the client on phones: a glass pill floating at the bottom
 * with Home, Cerca, Messaggi and Profilo, icons only. In the client area and
 * on the public pages to explore, so the way back is always in sight.
 */
export default function ClientTabBar({
    current,
    className,
}: ClientTabBarProps) {
    const unread = usePage().props.clientArea?.unreadChats ?? 0;
    const items = [...clientNavItems(), clientProfileNavItem()];

    return (
        <div
            className={cn(
                'pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center',
                className,
            )}
        >
            <nav
                aria-label="Navigazione principale"
                className={cn(
                    'pointer-events-auto flex h-18 w-full max-w-80 items-center gap-1 rounded-full p-2',
                    glassClassName,
                )}
            >
                {items.map((item) => {
                    const active = item.section === current;
                    const dot = item.section === 'messages' && unread > 0;

                    return (
                        <Link
                            key={item.section}
                            href={item.href}
                            aria-label={
                                item.section === 'messages'
                                    ? messagesLabel(unread)
                                    : item.title
                            }
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex h-full flex-1 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                active
                                    ? 'bg-brand text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)]'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <item.icon aria-hidden="true" className="size-6" />
                            {dot && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute top-3.5 left-[calc(50%+8px)] size-2.5 rounded-full shadow-[0_0_0_2px_#1c1c1c]',
                                        active ? 'bg-[#0a0a0a]' : 'bg-brand',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
