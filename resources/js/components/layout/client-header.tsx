import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';

type ClientHeaderProps = {
    userName: string;
};

/**
 * Header of the client area on mobile: from md up the black side menu
 * (components/layout/client-nav.tsx) takes its place.
 */
export default function ClientHeader({ userName }: ClientHeaderProps) {
    return (
        <header className="border-b bg-background">
            <div className="flex h-15 items-center gap-2 pr-2 pl-4">
                <BrandLogo />
                <div className="ml-auto flex items-center">
                    <AccountMenu variant="client" userName={userName} />
                </div>
            </div>
        </header>
    );
}
