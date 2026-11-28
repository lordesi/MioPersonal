import { Head, Link } from '@inertiajs/react';
import {
    brandFilledClassName,
    brandOutlineClassName,
    errorNumberClassName,
    eyebrowClassName,
    pageColumnClassName,
    pageTitleClassName,
} from '@/components/mp/page-bits';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { show as contactPage } from '@/routes/contact';

type ErrorStatus = 403 | 419 | 429 | 500 | 503;

/** Title and explanation of each error, in the tone of the 404 page. */
const messages: Record<ErrorStatus, { title: string; text: string }> = {
    403: {
        title: 'Questa pagina non è per il tuo account.',
        text: 'È riservata a un altro tipo di account. Torna alla home: dal menu del tuo account trovi la tua area.',
    },
    419: {
        title: 'La pagina è scaduta.',
        text: 'Per sicurezza la sessione scade dopo un po’ di inattività. Ricarica la pagina e riprova.',
    },
    429: {
        title: 'Troppi tentativi in poco tempo.',
        text: 'Aspetta un minuto e riprova.',
    },
    500: {
        title: 'Qualcosa è andato storto.',
        text: 'C’è stato un errore da parte nostra. Riprova tra poco: se succede ancora, scrivici.',
    },
    503: {
        title: 'Torniamo subito.',
        text: 'Stiamo facendo manutenzione al sito. Riprova tra qualche minuto.',
    },
};

/** Shown by bootstrap/app.php for the errors other than 404 (not-found.tsx). */
export default function ErrorPage({ status }: { status: ErrorStatus }) {
    const { title, text } = messages[status] ?? messages[500];

    return (
        <>
            <Head title={`Errore ${status}`} />

            <div
                className={cn(
                    pageColumnClassName,
                    'flex-1 justify-center gap-5 pb-16 md:gap-6 md:pb-24',
                )}
            >
                <div aria-hidden="true" className={errorNumberClassName}>
                    {status}
                </div>
                <div className="flex max-w-2xl flex-col gap-3">
                    <p className={eyebrowClassName}>Errore {status}</p>
                    <h1 className={pageTitleClassName}>{title}</h1>
                    <p className="text-[17px] text-muted-foreground md:text-xl md:leading-7">
                        {text}
                    </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
                    {status === 419 ? (
                        <button
                            type="button"
                            className={brandFilledClassName}
                            onClick={() => window.location.reload()}
                        >
                            Ricarica la pagina
                        </button>
                    ) : (
                        <Link href={home()} className={brandFilledClassName}>
                            Torna alla home
                        </Link>
                    )}
                    <Link
                        href={contactPage()}
                        className={brandOutlineClassName}
                    >
                        Centro assistenza
                    </Link>
                </div>
            </div>
        </>
    );
}
