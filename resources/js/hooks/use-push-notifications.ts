import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { disablePush, enablePush, pushState } from '@/lib/push';
import type { PushState } from '@/lib/push';

/**
 * The push notifications of this device, for "Attiva le notifiche" and the
 * settings. `state` is null until the browser answered (never on the server).
 */
export function usePushNotifications() {
    const { vapidPublicKey } = usePage().props;
    const [state, setState] = useState<PushState | null>(null);
    const [processing, setProcessing] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;

        pushState(vapidPublicKey)
            .then((current) => active && setState(current))
            .catch(() => active && setState('unsupported'));

        return () => {
            active = false;
        };
    }, [vapidPublicKey]);

    const run = async (action: () => Promise<PushState>) => {
        setProcessing(true);
        setFailed(false);

        try {
            setState(await action());
        } catch {
            setFailed(true);
        } finally {
            setProcessing(false);
        }
    };

    return {
        state,
        processing,
        /** The last "Attiva"/"Disattiva" didn't go through: try again. */
        failed,
        enable: () =>
            vapidPublicKey !== null && run(() => enablePush(vapidPublicKey)),
        disable: () => run(disablePush),
    };
}
