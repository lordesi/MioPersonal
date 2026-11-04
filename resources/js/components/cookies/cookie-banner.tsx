import { Link } from '@inertiajs/react';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from '@/routes/legal';

type CookieBannerProps = {
    onAcceptAll: () => void;
    onRejectAll: () => void;
    onCustomize: () => void;
    disabled?: boolean;
};

/**
 * Shown at the bottom of every page until a choice is made. As the Garante
 * asks, "Rifiuta tutti" looks like "Accetta tutti" and the X means "rifiuta";
 * the page stays usable while it's open.
 */
export default function CookieBanner({
    onAcceptAll,
    onRejectAll,
    onCustomize,
    disabled,
}: CookieBannerProps) {
    return (
        <section
            aria-labelledby="cookie-banner-title"
            className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border bg-card p-5 text-card-foreground shadow-lg md:inset-x-6 md:bottom-6"
        >
            <button
                type="button"
                onClick={onRejectAll}
                disabled={disabled}
                aria-label="Chiudi e rifiuta i cookie facoltativi"
                className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <X className="size-4" />
            </button>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                <div className="flex flex-1 flex-col gap-1.5 pr-6">
                    <h2
                        id="cookie-banner-title"
                        className="flex items-center gap-2 text-[15px] font-semibold"
                    >
                        <Cookie aria-hidden="true" className="size-4" />
                        Usiamo i cookie
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Oggi usiamo solo cookie tecnici, necessari a far
                        funzionare il sito. Se in futuro aggiungeremo cookie di
                        statistica o di marketing, li useremo solo se li
                        accetti. Puoi cambiare idea quando vuoi dalla{' '}
                        <Link
                            href={cookies.url()}
                            className="font-medium text-foreground underline underline-offset-3"
                        >
                            Cookie policy
                        </Link>
                        .
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={onCustomize}
                        disabled={disabled}
                    >
                        Personalizza
                    </Button>
                    <Button
                        type="button"
                        className="h-10 font-semibold"
                        onClick={onRejectAll}
                        disabled={disabled}
                    >
                        Rifiuta tutti
                    </Button>
                    <Button
                        type="button"
                        className="h-10 font-semibold"
                        onClick={onAcceptAll}
                        disabled={disabled}
                    >
                        Accetta tutti
                    </Button>
                </div>
            </div>
        </section>
    );
}
