import type { CookieConsent } from '@/lib/cookie-consent';
import type { Features } from '@/lib/features';
import type { Auth } from '@/types/auth';
import type { ClientAreaData } from '@/types/client';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            /** Gyms, courses and events: off hides them (lib/features.ts). */
            features: Features;
            auth: Auth;
            sidebarOpen: boolean;
            /** For "Attiva le notifiche"; null for guests or without the keys in the .env. */
            vapidPublicKey: string | null;
            /** null until the cookie banner is answered. */
            cookieConsent: CookieConsent | null;
            /** The client area's menu; null for guests and the other roles. */
            clientArea: ClientAreaData | null;
            /** Only on a prefetch: the token that counts the visit if the page is opened (lib/prefetch.ts). */
            pendingVisit?: string;
        };
    }
}
