import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { cookies } from '@/routes/legal';

type CookieBannerProps = {
    /** Both buttons save the same choice: there are no optional cookies yet. */
    onAccept: () => void;
    onManage: () => void;
    disabled?: boolean;
};

/**
 * Shown at the bottom of every page until a choice is made. The site only
 * uses necessary cookies, so "Accetta tutti" and "Solo quelli necessari" are
 * equivalent; both stay so the day an optional category arrives they already
 * mean different things. The page stays usable while it's open.
 */
export default function CookieBanner({
    onAccept,
    onManage,
    disabled,
}: CookieBannerProps) {
    return (
        <section
            aria-labelledby="cookie-banner-title"
            className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border bg-card p-6 text-card-foreground shadow-lg md:inset-x-6 md:bottom-6"
        >
            <h2 id="cookie-banner-title" className="mb-3 text-xl font-semibold">
                Migliora la tua esperienza
            </h2>
            <p className="text-[15px] leading-6">
                Utilizziamo i cookie necessari per far funzionare il sito: ci
                permettono di mantenere l’accesso, proteggere i moduli e
                ricordare le tue preferenze, e non possono essere disattivati.
                Per saperne di più leggi la{' '}
                <Link
                    href={cookies.url()}
                    className="font-semibold underline underline-offset-3"
                >
                    Cookie policy di MioPersonal
                </Link>
                . Puoi aggiornare le tue preferenze in qualsiasi momento.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-lg px-6 font-semibold"
                    onClick={onAccept}
                    disabled={disabled}
                >
                    Accetta tutti
                </Button>
                <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-lg px-6 font-semibold"
                    onClick={onAccept}
                    disabled={disabled}
                >
                    Solo quelli necessari
                </Button>
                <button
                    type="button"
                    onClick={onManage}
                    disabled={disabled}
                    className="rounded-md px-2 py-2 text-[15px] font-medium underline underline-offset-3 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:ml-auto"
                >
                    Gestisci le preferenze
                </button>
            </div>
        </section>
    );
}
