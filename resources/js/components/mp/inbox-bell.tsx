import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';

/**
 * The bell of the "Home" of the areas: it opens "Notifiche" of the Inbox,
 * with a turquoise dot while some are unread (`auth.unreadNotifications`).
 */
export default function InboxBell({
    href,
    className,
}: {
    href: string;
    className?: string;
}) {
    const unread = usePage().props.auth?.unreadNotifications ?? 0;
    const label =
        unread > 0
            ? `Notifiche, ${unread === 1 ? '1 nuova' : `${unread} nuove`}`
            : 'Notifiche';

    return (
        <Link
            prefetch={hoverPrefetch}
            href={href}
            aria-label={label}
            className={cn(
                'relative flex size-12 shrink-0 items-center justify-center rounded-full text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:size-13',
                className,
            )}
        >
            <Bell aria-hidden="true" className="size-6.5" />
            {unread > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute top-2.25 right-2.5 size-2.5 rounded-full bg-brand shadow-[0_0_0_2px_#000] md:top-2.5 md:right-3"
                />
            )}
        </Link>
    );
}
