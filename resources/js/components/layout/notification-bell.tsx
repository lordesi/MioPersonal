import { Link, router, usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppNotification } from '@/lib/notifications';
import {
    deleteNotifications,
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

type Filter = 'unread' | 'all';

const FILTERS: [Filter, string][] = [
    ['unread', 'Da leggere'],
    ['all', 'Tutte'],
];

/**
 * The bell: the number of unread notifications (shared prop `auth.unreadNotifications`,
 * updated at every visit) and, when opened, the latest ones in a glass panel
 * (design "Menu notifiche · vetro"): "Nuove" and "Precedenti", the filter
 * "Da leggere · Tutte" and the X that clears the previous ones. Opening it
 * marks them as read, but the new ones stay "Nuove" until it is closed.
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
    const [filter, setFilter] = useState<Filter>('all');
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
            // The list is read: what was new becomes "Precedenti".
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

    const fresh = items?.filter((item) => !item.read) ?? [];
    const old = items?.filter((item) => item.read) ?? [];
    const shownOld = filter === 'all' ? old : [];

    // "Cancella le notifiche precedenti": gone at once, back if it fails.
    const clearOld = () => {
        const before = items;
        setItems((current) => current?.filter((item) => !item.read) ?? null);

        void deleteNotifications(old.map((item) => item.id)).catch(() =>
            setItems(before),
        );
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
                sideOffset={10}
                collisionPadding={12}
                className="theme-dark flex max-h-[min(36rem,80dvh)] w-[min(24rem,calc(100vw-1.5rem))] [scrollbar-width:none] flex-col gap-3 overflow-y-auto overscroll-contain rounded-[38px] border border-white/10 bg-[#1c1c1cb8] p-3 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-[24px] backdrop-saturate-[1.8]"
            >
                <div className="flex items-center justify-between gap-3 pt-1.5 pr-0.5 pb-0.5 pl-3">
                    <DropdownMenuLabel className="p-0 text-[20px] leading-6 font-semibold tracking-[-0.45px]">
                        Notifiche
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={filter}
                        onValueChange={(value) => setFilter(value as Filter)}
                        aria-label="Filtra notifiche"
                        className="flex h-8.5 gap-0.5 rounded-full bg-[#7676803d] p-[3px]"
                    >
                        {FILTERS.map(([value, text]) => (
                            <DropdownMenuRadioItem
                                key={value}
                                value={value}
                                onSelect={(event) => event.preventDefault()}
                                className="cursor-pointer rounded-full px-3 py-0 text-[13px] tracking-[-0.08px] text-foreground focus:bg-white/10 focus:text-foreground data-[state=checked]:bg-white/[0.27] data-[state=checked]:font-semibold [&>span:first-child]:hidden"
                            >
                                {text}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </div>

                {items === null && !failed && <Message status>Carico…</Message>}
                {failed && (
                    <Message status>
                        Non riesco a caricarle: riprova tra poco.
                    </Message>
                )}
                {items !== null && fresh.length + shownOld.length === 0 && (
                    <Message>
                        {filter === 'unread' && items.length > 0
                            ? 'Nessuna notifica da leggere'
                            : 'Nessuna notifica'}
                    </Message>
                )}

                {fresh.length > 0 && (
                    <>
                        <span className="px-2.5 pt-1 text-[17px] font-semibold tracking-[-0.43px]">
                            Nuove
                        </span>
                        {fresh.map((item) => (
                            <NotificationCard key={item.id} item={item} fresh />
                        ))}
                    </>
                )}

                {shownOld.length > 0 && (
                    <>
                        <div className="flex items-center justify-between pt-1.5 pr-0.5 pl-2.5">
                            <span className="text-[17px] font-semibold tracking-[-0.43px] text-muted-foreground">
                                Precedenti
                            </span>
                            <DropdownMenuItem
                                aria-label="Cancella le notifiche precedenti"
                                title="Cancella le notifiche precedenti"
                                onSelect={(event) => {
                                    event.preventDefault();
                                    clearOld();
                                }}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#7676803d] p-0 text-foreground focus:bg-white/20 focus:text-foreground"
                            >
                                <X
                                    aria-hidden="true"
                                    className="size-3.5"
                                    strokeWidth={2.4}
                                />
                            </DropdownMenuItem>
                        </div>
                        {shownOld.map((item) => (
                            <NotificationCard key={item.id} item={item} />
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Message({
    children,
    status = false,
}: {
    children: ReactNode;
    status?: boolean;
}) {
    return (
        <p
            role={status ? 'status' : undefined}
            className="px-3 py-6 text-center text-[15px] text-muted-foreground"
        >
            {children}
        </p>
    );
}

/** A notification: the new ones lighter and raised, the read ones quiet. */
function NotificationCard({
    item,
    fresh = false,
}: {
    item: AppNotification;
    fresh?: boolean;
}) {
    return (
        <DropdownMenuItem
            asChild
            className={cn(
                'flex cursor-pointer flex-col items-stretch gap-0.5 rounded-[26px] border px-4 py-3.5 text-foreground focus:text-foreground',
                fresh
                    ? 'border-white/[0.18] bg-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_8px_24px_-6px_rgba(0,0,0,0.6)] focus:bg-white/20'
                    : 'border-white/10 bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] focus:bg-white/10',
            )}
        >
            <Link href={item.url}>
                <span className="flex items-start justify-between gap-2">
                    <span className="text-[15px] leading-5 font-semibold tracking-[-0.23px]">
                        {item.title}
                    </span>
                    <span
                        className={cn(
                            'shrink-0 text-[13px] leading-5 tracking-[-0.08px]',
                            fresh ? 'text-[#c8c8c8]' : 'text-muted-foreground',
                        )}
                    >
                        {timeAgo(item.createdAt)}
                    </span>
                </span>
                {item.body !== '' && (
                    <span
                        className={cn(
                            'text-[15px] leading-5 tracking-[-0.23px] break-words',
                            fresh ? 'text-[#e0e0e0]' : 'text-muted-foreground',
                        )}
                    >
                        {item.body}
                    </span>
                )}
                {fresh && <span className="sr-only">Da leggere</span>}
            </Link>
        </DropdownMenuItem>
    );
}
