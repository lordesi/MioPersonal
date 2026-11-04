import type { CookieConsent } from '@/lib/cookie-consent';
import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            /** null until the cookie banner is answered. */
            cookieConsent: CookieConsent | null;
            [key: string]: unknown;
        };
    }
}
