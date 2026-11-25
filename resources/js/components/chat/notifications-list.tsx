import { Link, router } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    Dumbbell,
    MessageCircle,
    Star,
    UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { areaEyebrowClassName } from '@/components/mp/area-bits';
import type { AppNotification } from '@/lib/notifications';
import {
    fetchNotifications,
    markAllNotificationsRead,
    timeAgo,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';

/** The icon of a notification, from where it leads and what it says. */
function iconOf(item: AppNotification): LucideIcon {
    const text = `${item.url} ${item.title}`.toLowerCase();

    if (/recension/.test(text)) {
        return Star;
    }

    if (/pacchett/.test(text)) {
        return Dumbbell;
    }

    if (/messagg|chat/.test(text)) {
        return MessageCircle;
    }

    if (/richiest|client/.test(text)) {
        return UserPlus;
    }

    if (/prenotaz|sedut|calendario|oggi/.test(text)) {
        return CalendarDays;
    }

    return Bell;
}

/**
 * "Notifiche" of the Inbox (design "Inbox · notifiche · nuovo"): "Nuove"
 * with "Segna come lette", then "Precedenti". Each one opens its page.
 * Loaded in the background, like the bell (NotificationController).
 */
export default function NotificationsList() {
    const [items, setItems] = useState<AppNotification[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;

        fetchNotifications()
            .then(({ notifications }) => alive && setItems(notifications))
            .catch(() => alive && setFailed(true));

        return () => {
            alive = false;
        };
    }, []);

    const fresh = items?.filter((item) => !item.read) ?? [];
    const old = items?.filter((item) => item.read) ?? [];

    const markRead = () => {
        const before = items;
        setItems(
            (current) =>
                current?.map((item) => ({ ...item, read: true })) ?? null,
        );

        markAllNotificationsRead()
            // The dot on the bell and on "Inbox".
            .then(() => router.reload({ only: ['auth'] }))
            .catch(() => setItems(before));
    };

    if (failed) {
        return (
            <p role="status" className={messageClassName}>
                Non riesco a caricarle: riprova tra poco.
            </p>
        );
    }

    if (items === null) {
        return (
            <p role="status" className={messageClassName}>
                Carico…
            </p>
        );
    }

    if (items.length === 0) {
        return (
            <p className={messageClassName}>
                Nessuna notifica. Qui trovi conferme, promemoria e novità sulle
                tue sedute.
            </p>
        );
    }

    return (
        <div className="-mx-4 flex flex-col gap-1 py-3 md:mx-0">
            {fresh.length > 0 && (
                <>
                    <div className="flex items-center justify-between px-4 pt-2 pb-1">
                        <h2 className={areaEyebrowClassName}>Nuove</h2>
                        <button
                            type="button"
                            onClick={markRead}
                            className="py-2 text-sm font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Segna come lette
                        </button>
                    </div>
                    <ul>
                        {fresh.map((item) => (
                            <Row key={item.id} item={item} />
                        ))}
                    </ul>
                </>
            )}

            {old.length > 0 && (
                <>
                    <h2
                        className={cn(
                            areaEyebrowClassName,
                            'px-4 pb-1',
                            fresh.length > 0 ? 'pt-5' : 'pt-2',
                        )}
                    >
                        Precedenti
                    </h2>
                    <ul>
                        {old.map((item) => (
                            <Row key={item.id} item={item} />
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

const messageClassName =
    'px-4 py-10 text-center text-[15px] leading-5 text-muted-foreground';

function Row({ item }: { item: AppNotification }) {
    const Icon = iconOf(item);

    return (
        <li>
            <Link
                href={item.url}
                className="relative flex items-start gap-3.5 px-4 py-3.5 text-foreground outline-none after:absolute after:right-0 after:bottom-0 after:left-18.5 after:h-px after:bg-separator focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:rounded-2xl md:after:hidden md:hover:bg-white/5"
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                    <b className="text-base leading-5.5 font-bold">
                        {item.title}
                    </b>
                    {item.body !== '' && (
                        <span className="text-[15px] leading-5 break-words text-muted-foreground">
                            {item.body}
                        </span>
                    )}
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {timeAgo(item.createdAt)}
                    </span>
                </span>
                {!item.read && (
                    <span
                        role="img"
                        aria-label="Non letta"
                        className="mt-1.5 size-2.25 shrink-0 rounded-full bg-brand"
                    />
                )}
            </Link>
        </li>
    );
}
