import { createInertiaApp } from '@inertiajs/react';
import CookieConsent from '@/components/cookies/cookie-consent';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/admin-layout';
import AuthLayout from '@/layouts/auth-layout';
import ClientLayout from '@/layouts/client-layout';
import PublicLayout from '@/layouts/public-layout';
import TrainerLayout from '@/layouts/trainer-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
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
    },
    strictMode: true,
    withApp(app, { page }) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
                <CookieConsent initialPage={page} />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
