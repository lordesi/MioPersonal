import PushSubscriptionController from '@/actions/App/Http/Controllers/PushSubscriptionController';
import { isIos, isStandalone } from '@/lib/pwa';

/**
 * "Attiva le notifiche" on this device. The browser asks for permission only
 * after the user presses the button: a request on page load is the quickest
 * way to get "Blocca", and after a "Blocca" we can't ask again.
 */

export type PushState =
    /** No keys on the server, or a browser without push. */
    | 'unsupported'
    /** iPhone in Safari: push only from the app added to the home screen. */
    | 'needs-install'
    /** "Blocca" was pressed: only the browser settings can change it. */
    | 'denied'
    | 'off'
    | 'on';

function supported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

async function registration(): Promise<ServiceWorkerRegistration> {
    // pwa.ts registers it after the load; this is ready as soon as it's active.
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    return navigator.serviceWorker.ready;
}

export async function pushState(publicKey: string | null): Promise<PushState> {
    if (publicKey === null) {
        return 'unsupported';
    }

    if (!supported()) {
        return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    const subscription = await (
        await registration()
    ).pushManager.getSubscription();

    if (subscription === null || Notification.permission !== 'granted') {
        return 'off';
    }

    if (!synced) {
        synced = true;
        save(subscription).catch(() => {
            synced = false;
        });
    }

    return 'on';
}

/** "AAAA-_" base64url → the bytes of the server's public key. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
    const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4))
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));

    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }

    return bytes;
}

/** Laravel's CSRF cookie, sent back in the header. */
function xsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((part) => part.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

/**
 * A request in the background, not an Inertia visit: it never interrupts the
 * page the user is opening.
 */
async function send(
    method: 'POST' | 'DELETE',
    url: string,
    data: Record<string, unknown>,
): Promise<void> {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`push ${response.status}`);
    }
}

function save(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    const encodings = (
        PushManager as unknown as { supportedContentEncodings?: string[] }
    ).supportedContentEncodings ?? ['aesgcm'];

    return send('POST', PushSubscriptionController.store.url(), {
        endpoint: json.endpoint,
        keys: json.keys,
        content_encoding: encodings.includes('aes128gcm')
            ? 'aes128gcm'
            : 'aesgcm',
    });
}

/**
 * Saved again once per page load: if someone else logged in on this browser,
 * the server moves the device to them, and the notifications follow.
 */
let synced = false;

/** Asks the permission, subscribes this browser and saves it: the new state. */
export async function enablePush(publicKey: string): Promise<PushState> {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return permission === 'denied' ? 'denied' : 'off';
    }

    const { pushManager } = await registration();
    const subscription =
        (await pushManager.getSubscription()) ??
        (await pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(publicKey),
        }));
    await save(subscription);
    synced = true;

    return 'on';
}

/** "Disattiva" on this device only. */
export async function disablePush(): Promise<PushState> {
    const subscription = await (
        await registration()
    ).pushManager.getSubscription();

    if (subscription !== null) {
        await send('DELETE', PushSubscriptionController.destroy.url(), {
            endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
    }

    return 'off';
}
