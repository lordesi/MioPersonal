import type { SocialProvider } from '@/types';

/** What the popup of TrainerSocialController tells (resources/views/social/popup-done.blade.php). */
export type SocialConnectResult = {
    type: 'trainer-social';
    provider: SocialProvider;
    ok: boolean;
    message: string;
};

/**
 * "Collega": the login on the social in a popup, so the page with the form
 * being filled in stays as it is. False when the browser blocked the popup.
 */
export function connectSocial(
    url: string,
    onResult: (result: SocialConnectResult) => void,
): boolean {
    const popupUrl = `${url}${url.includes('?') ? '&' : '?'}popup=1`;
    const popup = window.open(
        popupUrl,
        'miopersonal-social',
        'popup,width=520,height=720',
    );

    if (popup === null) {
        return false;
    }

    const listener = (event: MessageEvent) => {
        const data = event.data as Partial<SocialConnectResult> | null;

        if (
            event.origin !== window.location.origin ||
            data?.type !== 'trainer-social'
        ) {
            return;
        }

        window.removeEventListener('message', listener);
        onResult(data as SocialConnectResult);
    };

    window.addEventListener('message', listener);

    return true;
}
