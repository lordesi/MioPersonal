import type { ReactNode } from 'react';
import BrandLogo from '@/components/layout/brand-logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MinimalHeaderProps = {
    /** Single action on the right, e.g. "Hai già un account? Accedi". */
    children?: ReactNode;
    /** Small pill next to the logo, e.g. "Per i trainer". */
    badge?: string;
    /** Set to false in flows the user shouldn't leave by accident. */
    logoLinksHome?: boolean;
    className?: string;
};

/** Header for focused flows: registration, booking confirmation, profile setup. */
export default function MinimalHeader({
    children,
    badge,
    logoLinksHome = true,
    className,
}: MinimalHeaderProps) {
    return (
        // Dark like the public header, so every page starts the same way.
        <header className={cn('bg-primary text-primary-foreground', className)}>
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-2.5 md:px-8 md:py-5">
                <BrandLogo
                    linkToHome={logoLinksHome}
                    className="text-primary-foreground"
                />
                {badge && (
                    <Badge
                        variant="outline"
                        className="h-5.5 rounded-full border-primary-foreground/30 px-2 text-xs font-medium text-primary-foreground"
                    >
                        {badge}
                    </Badge>
                )}
                {children && (
                    <div className="ml-auto flex min-h-11 items-center gap-2 text-sm text-primary-foreground/70">
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
}
