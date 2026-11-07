/*
 * The service worker of MioPersonal (registered by resources/js/lib/pwa.ts).
 *
 * Only the push notifications: it caches nothing. The pages of logged-in
 * users are private ("no-store"), and a stale booking page would be worse than
 * no page.
 *
 * The payload is the WebPushMessage of the server (app/Notifications/Concerns/SendsPush.php):
 * { title, body, icon, badge, lang, tag, data: { url } }.
 */

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let message = {};

    try {
        message = event.data ? event.data.json() : {};
    } catch {
        message = { body: event.data ? event.data.text() : '' };
    }

    // Every push must show a notification: Safari stops the silent ones.
    event.waitUntil(
        self.registration.showNotification(message.title || 'MioPersonal', {
            body: message.body || '',
            icon: message.icon || '/icons/icon-192.png',
            badge: message.badge || '/icons/badge-96.png',
            lang: message.lang || 'it',
            tag: message.tag,
            renotify: Boolean(message.tag),
            data: message.data || {},
        }),
    );
});

// A tap opens the page of the notification: in a window of the app already
// open, if there is one.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = new URL(
        (event.notification.data && event.notification.data.url) || '/app',
        self.location.origin,
    );

    // Only our own pages.
    if (url.origin !== self.location.origin) {
        return;
    }

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windows) => {
                const open = windows.find(
                    (client) => new URL(client.url).origin === url.origin,
                );

                if (open) {
                    return open
                        .navigate(url.href)
                        .then((client) => (client || open).focus());
                }

                return self.clients.openWindow(url.href);
            }),
    );
});
