import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import ClientLayout from '@/layouts/client-layout';
import PublicLayout from '@/layouts/public-layout';
import SettingsLayout from '@/layouts/settings/layout';
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
            case name === 'public/quiz':
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
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
