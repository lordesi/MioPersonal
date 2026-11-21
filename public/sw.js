/*
 * The service worker of MioPersonal (registered by resources/js/lib/pwa.ts).
 *
 * The push notifications, and a dark "Sei offline" page (public/offline.html)
 * when a page can't be opened for lack of connection. That page is the only
 * thing in the cache: the pages of logged-in users are private ("no-store"),
 * and a stale booking page would be worse than no page.
 *
 * The payload is the WebPushMessage of the server (app/Notifications/Concerns/SendsPush.php):
 * { title, body, icon, badge, lang, tag, data: { url } }.
 */

// A new name (offline-v2…) when offline.html changes: the old cache is deleted.
const CACHE = 'offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            await Promise.all(
                names
                    .filter((name) => name !== CACHE)
                    .map((name) => caches.delete(name)),
            );

            // The page is asked for while the service worker starts: no wait for it.
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            await self.clients.claim();
        })(),
    );
});

// Only the opening of a page (address bar, reload, link from outside, app icon).
// Inertia's clicks, files, forms and everything else never pass from here.
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.mode !== 'navigate' || request.method !== 'GET') {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                return (await event.preloadResponse) || (await fetch(request));
            } catch {
                // No connection: the dark page, never a stale copy of a real one.
                return (await caches.match(OFFLINE_URL)) || Response.error();
            }
        })(),
    );
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
