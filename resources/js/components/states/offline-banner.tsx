import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type OfflineBannerProps = {
    message?: string;
    className?: string;
};

/** Banner at the top of the page when the connection drops; it doesn't block the page. */
export default function OfflineBanner({
    message = 'Sei offline. Ti mostriamo l’ultima versione salvata.',
    className,
}: OfflineBannerProps) {
    return (
        <div
            role="status"
            className={cn(
                'flex items-center gap-2.5 rounded-lg bg-primary px-3.5 py-3 text-sm text-primary-foreground',
                className,
            )}
        >
            <WifiOff aria-hidden="true" className="size-4.5 shrink-0" />
            {message}
        </div>
    );
}
