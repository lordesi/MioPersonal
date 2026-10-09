import { Link } from '@inertiajs/react';
import { ChevronLeft, Share } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';

type ProfileMobileHeaderProps = {
    backHref: string;
    onShare: () => void;
};

/** Profile header on mobile: back to results, logo, share. */
export default function ProfileMobileHeader({
    backHref,
    onShare,
}: ProfileMobileHeaderProps) {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-2 md:hidden">
            <Link
                href={backHref}
                aria-label="Torna ai risultati"
                className="flex size-11 items-center justify-center rounded-lg"
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
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Condividi il profilo"
                onClick={onShare}
                className="size-11"
            >
                <Share className="size-5" />
            </Button>
        </header>
    );
}
