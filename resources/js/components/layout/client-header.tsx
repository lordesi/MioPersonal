import BrandLogo from '@/components/layout/brand-logo';
import NotificationBell from '@/components/layout/notification-bell';

/**
 * Header of the client area on mobile: from md up the black side menu
 * (components/layout/area-nav.tsx) takes its place. The account is in the
 * "Profilo" tab at the bottom.
 */
export default function ClientHeader() {
    return (
        <header className="border-b bg-background">
            <div className="flex h-15 items-center gap-2 pr-2 pl-4">
                <BrandLogo />
                <div className="ml-auto flex items-center gap-1">
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
