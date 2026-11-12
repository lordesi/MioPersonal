import { Link } from '@inertiajs/react';
import { ChevronLeft, Share } from 'lucide-react';
import type { MouseEvent } from 'react';
import { BrandMark } from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import { canGoBack } from '@/lib/back';
import { home } from '@/routes';

type ProfileMobileHeaderProps = {
    /** Without a page of this site to go back to, e.g. the search of the city. */
    backHref: string;
    /** "Torna ai risultati" */
    backLabel?: string;
    onShare?: () => void;
    /** "Condividi il profilo" */
    shareLabel?: string;
};

/**
 * Header on mobile of the pages of a trainer, a gym or an event: back to the
 * page the visitor came from (or `backHref`), logo, share. Dark like the
 * block under it.
 */
export default function ProfileMobileHeader({
    backHref,
    backLabel = 'Indietro',
    onShare,
    shareLabel = 'Condividi',
}: ProfileMobileHeaderProps) {
    const back = (event: MouseEvent) => {
        if (canGoBack()) {
            event.preventDefault();
            window.history.back();
        }
    };

    return (
        <header className="flex h-16 items-center justify-between bg-primary px-2 text-primary-foreground md:hidden">
            <Link
                href={backHref}
                onClick={back}
                aria-label={backLabel}
                className="flex size-11 items-center justify-center rounded-lg hover:bg-primary-foreground/10"
            >
                <ChevronLeft className="size-5" />
            </Link>
            <Link
                href={home()}
                aria-label="MioPersonal, torna alla home"
                className="flex items-center"
            >
                <BrandMark />
            </Link>
            {onShare ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={shareLabel}
                    onClick={onShare}
                    className="size-11 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                    <Share className="size-5" />
                </Button>
            ) : (
                <span aria-hidden="true" className="size-11" />
            )}
        </header>
    );
}
