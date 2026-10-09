import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import ThemeToggle from '@/components/shared/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TrainerHeaderProps = {
    userName: string;
    notificationCount?: number;
    /** Link to the trainer's public profile; hidden on mobile. */
    publicProfileHref?: string;
};

export default function TrainerHeader({
    userName,
    notificationCount = 0,
    publicProfileHref,
}: TrainerHeaderProps) {
    return (
        <header className="border-b bg-background">
            <div className="mx-auto flex h-15 max-w-340 items-center gap-2 pr-2 pl-4 md:h-17 md:gap-4 md:px-8">
                <BrandLogo hideNameOnMobile />
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
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Notifiche, ${notificationCount} da leggere`}
                        className="relative size-11 rounded-full"
                    >
                        <Bell className="size-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-3 font-bold text-primary-foreground tabular-nums">
                                {notificationCount}
                            </span>
                        )}
                    </Button>
                    <ThemeToggle />
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
