import { Link } from '@inertiajs/react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import NotificationBell from '@/components/layout/notification-bell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TrainerHeaderProps = {
    userName: string;
    /** Link to the trainer's public profile; hidden on mobile. */
    publicProfileHref?: string;
};

export default function TrainerHeader({
    userName,
    publicProfileHref,
}: TrainerHeaderProps) {
    return (
        <header className="border-b bg-background">
            <div className="mx-auto flex h-15 max-w-340 items-center gap-2 pr-2 pl-4 md:h-17 md:gap-4 md:px-8">
                <BrandLogo hideNameBelow="md" />
                <Badge
                    variant="outline"
                    className="h-5.5 rounded-full px-2 text-xs font-medium"
                >
                    Area trainer
                </Badge>

                <div className="ml-auto flex items-center gap-2">
                    {publicProfileHref && (
                        <Button
                            asChild
                            variant="ghost"
                            className="hidden px-3 md:inline-flex"
                        >
                            <Link href={publicProfileHref}>
                                Vedi profilo pubblico
                            </Link>
                        </Button>
                    )}
                    {/* The requests to answer are on "Richieste": the bell is for everything else too. */}
                    <NotificationBell />
                    <AccountMenu
                        variant="trainer"
                        userName={userName}
                        publicProfileHref={publicProfileHref}
                    />
                </div>
            </div>
        </header>
    );
}
