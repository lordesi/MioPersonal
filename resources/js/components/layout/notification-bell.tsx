import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppNotification } from '@/lib/notifications';
import {
    fetchNotifications,
    markAllNotificationsRead,
    timeAgo,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';

type NotificationBellProps = {
    /** "dark" on the black side menus, "light" on the white headers. */
    tone?: 'light' | 'dark';
    className?: string;
};

/** How often the number is refreshed when the tab becomes visible again. */
const REFRESH_EVERY_MS = 60_000;

/**
 * The bell: the number of unread notifications (shared prop `auth.unreadNotifications`,
 * updated at every visit) and, when opened, the latest ones. Opening it marks
 * them as read, but the new ones stay highlighted until it is closed.
 */
export default function NotificationBell({
    tone = 'light',
    className,
}: NotificationBellProps) {
    const sharedUnread = usePage().props.auth?.unreadNotifications ?? 0;
    const [unread, setUnread] = useState(sharedUnread);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AppNotification[] | null>(null);
    const [failed, setFailed] = useState(false);
    const lastRefresh = useRef(Date.now());

    useEffect(() => setUnread(sharedUnread), [sharedUnread]);

    // Back on the tab after a while: look for new notifications.
    useEffect(() => {
        const onVisible = () => {
            if (
                document.visibilityState === 'visible' &&
                Date.now() - lastRefresh.current > REFRESH_EVERY_MS
            ) {
                lastRefresh.current = Date.now();
                router.reload({ only: ['auth'] });
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () =>
            document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const onOpenChange = (next: boolean) => {
        setOpen(next);

        if (!next) {
            // The list is read: what was new stops being highlighted.
            setItems(
                (current) =>
                    current?.map((item) => ({ ...item, read: true })) ?? null,
            );

            return;
        }

        setFailed(false);
        lastRefresh.current = Date.now();

        void fetchNotifications()
            .then(({ notifications, unread: count }) => {
                setItems(notifications);

                if (count > 0) {
                    setUnread(0);

                    return markAllNotificationsRead();
                }
            })
            .catch(() => setFailed(true));
    };

    const label = unread > 0 ? `Notifiche: ${unread} da leggere` : 'Notifiche';

    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    className={cn(
                        'relative size-11 rounded-full',
                        tone === 'dark' &&
                            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        className,
                    )}
                >
                    <Bell className="size-5" />
                    {unread > 0 && (
                        <span
                            aria-hidden="true"
                            className={cn(
                                'absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-3 font-bold tabular-nums',
                                tone === 'dark'
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                    : 'bg-primary text-primary-foreground',
                            )}
                        >
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                collisionPadding={8}
                className="w-[min(22rem,calc(100vw-1rem))] p-0"
            >
                <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold">
                    Notifiche
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                <div className="max-h-[min(26rem,70vh)] overflow-y-auto p-1">
                    {items === null && !failed && (
                        <p
                            role="status"
                            className="px-3 py-6 text-center text-sm text-muted-foreground"
                        >
                            Carico…
                        </p>
                    )}
                    {failed && (
                        <p
                            role="status"
                            className="px-3 py-6 text-center text-sm text-muted-foreground"
                        >
                            Non riesco a caricarle: riprova tra poco.
                        </p>
                    )}
                    {items?.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                            Nessuna notifica
                        </p>
                    )}
                    {items?.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            asChild
                            className="items-start gap-2.5 rounded-md px-3 py-2.5"
                        >
                            <Link href={item.url}>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'mt-1.5 size-2 flex-none rounded-full',
                                        item.read
                                            ? 'bg-transparent'
                                            : 'bg-primary',
                                    )}
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span
                                        className={cn(
                                            'text-sm leading-5',
                                            item.read
                                                ? 'font-medium'
                                                : 'font-semibold',
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                    {item.body !== '' && (
                                        <span className="text-[13px] leading-4.5 break-words text-muted-foreground">
                                            {item.body}
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {timeAgo(item.createdAt)}
                                    </span>
                                </span>
                                {!item.read && (
                                    <span className="sr-only">Da leggere</span>
                                )}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
