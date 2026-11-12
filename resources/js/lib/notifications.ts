/** The bell of the site (NotificationController): the latest notifications of the logged-in person. */
export type AppNotification = {
    id: string;
    title: string;
    body: string;
    /** A path of this site, e.g. "/area-trainer/richieste". */
    url: string;
    read: boolean;
    createdAt: string | null;
};

const LIST_URL = '/notifiche';
const READ_URL = '/notifiche/lette';

/** Laravel's CSRF cookie, sent back in the header. */
export function xsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((part) => part.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

/** A request in the background, not an Inertia visit: it never interrupts the page. */
export async function fetchNotifications(): Promise<{
    notifications: AppNotification[];
    unread: number;
}> {
    const response = await fetch(LIST_URL, {
        credentials: 'same-origin',
        headers,
    });

    if (!response.ok) {
        throw new Error(`notifications ${response.status}`);
    }

    return response.json();
}

export async function markAllNotificationsRead(): Promise<void> {
    const response = await fetch(READ_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { ...headers, 'X-XSRF-TOKEN': xsrfToken() },
    });

    if (!response.ok) {
        throw new Error(`notifications ${response.status}`);
    }
}

const relativeTime = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

/** "adesso", "5 minuti fa", "ieri", "3 giorni fa". */
export function timeAgo(iso: string | null, now = Date.now()): string {
    if (iso === null) {
        return '';
    }

    const minutes = Math.round((new Date(iso).getTime() - now) / 60000);

    if (minutes > -1) {
        return 'adesso';
    }

    if (minutes > -60) {
        return relativeTime.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);

    if (hours > -24) {
        return relativeTime.format(hours, 'hour');
    }

    return relativeTime.format(Math.round(hours / 24), 'day');
}
