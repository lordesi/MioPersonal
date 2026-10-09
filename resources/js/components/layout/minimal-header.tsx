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
        <header className={cn('border-b bg-background', className)}>
            <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-4 px-4 py-3.5 md:px-8">
                <BrandLogo linkToHome={logoLinksHome} />
                {badge && (
                    <Badge
                        variant="outline"
                        className="h-5.5 rounded-full px-2 text-xs font-medium"
                    >
                        {badge}
                    </Badge>
                )}
                {children && (
                    <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                        {children}
                    </div>
                )}
            </div>
        </header>
    );
}
