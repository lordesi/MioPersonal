import type { Page, SharedPageProps } from '@inertiajs/core';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import CookieConsent from '@/components/cookies/cookie-consent';
import AppPrompt from '@/components/pwa/app-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sentry } from '@/lib/sentry';
import AdminLayout from '@/layouts/admin-layout';
import AuthLayout from '@/layouts/auth-layout';
import ClientLayout from '@/layouts/client-layout';
import GymLayout from '@/layouts/gym-layout';
import PublicLayout from '@/layouts/public-layout';
import TrainerLayout from '@/layouts/trainer-layout';

/**
 * What app.tsx (the browser) and ssr.tsx (the Node server that renders the
 * public pages for search engines) share: both must draw the same page, or
 * React complains when the browser takes over the server HTML.
 */
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

export function title(title: string): string {
    return title ? `${title} - ${appName}` : appName;
}

export function layout(
    name: string,
): ComponentType<{ children: ReactNode }> | null {
    switch (true) {
        case name.startsWith('dev/'):
        // Full-screen designs that draw their own header.
        case name.startsWith('onboarding/'):
        case name === 'auth/login':
        case name === 'auth/register':
        case name === 'auth/forgot-password':
        case name === 'auth/reset-password':
        case name === 'auth/google-sign-up':
        case name === 'auth/verify-email':
        case name === 'client/booking-sent':
            return null;
        case name.startsWith('public/'):
            return PublicLayout;
        case name.startsWith('trainer/'):
            return TrainerLayout;
        case name.startsWith('gym/'):
            return GymLayout;
        case name.startsWith('admin/'):
            return AdminLayout;
        case name.startsWith('client/'):
            return ClientLayout;
        case name.startsWith('auth/'):
            return AuthLayout;
        // Every page is in one of the folders above.
        default:
            return PublicLayout;
    }
}

export function withApp(
    app: ReactElement,
    { page }: { page: Page<SharedPageProps> },
): ReactElement {
    return (
        <TooltipProvider delayDuration={0}>
            {/* A crash while drawing a page is sent to Sentry (when it is on). */}
            <Sentry.ErrorBoundary
                fallback={
                    <p className="p-6 text-center text-sm">
                        Qualcosa è andato storto. Ricarica la pagina.
                    </p>
                }
            >
                {app}
            </Sentry.ErrorBoundary>
            <Toaster />
            <CookieConsent initialPage={page} />
            <AppPrompt initialPage={page} />
        </TooltipProvider>
    );
}
