import { Head, Link } from '@inertiajs/react';
import SectionLabel from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { dashboard, home } from '@/routes';
import { show as contactPage } from '@/routes/contact';

type ErrorStatus = 403 | 419 | 429 | 500 | 503;

/** Title and explanation of each error, in the tone of the 404 page. */
const messages: Record<ErrorStatus, { title: string; text: string }> = {
    403: {
        title: 'Questa pagina non è per il tuo account.',
        text: 'È riservata a un altro tipo di account. Torna nella tua area o alla home.',
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

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-col justify-center gap-5 px-4 pt-8 pb-10 md:gap-6 md:px-8 md:pt-18 md:pb-24">
                <div
                    aria-hidden="true"
                    className="text-[120px] leading-26 font-extrabold tracking-[-0.06em] tabular-nums md:text-[220px] md:leading-45"
                >
                    {status}
                </div>
                <div className="flex max-w-2xl flex-col gap-2.5">
                    <SectionLabel as="p">Errore {status}</SectionLabel>
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-[40px] md:leading-11">
                        {title}
                    </h1>
                    <p className="text-base text-muted-foreground md:text-lg md:leading-7">
                        {text}
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    {status === 419 ? (
                        <Button
                            type="button"
                            className="h-12 rounded-lg px-5.5 text-[15px] font-semibold"
                            onClick={() => window.location.reload()}
                        >
                            Ricarica la pagina
                        </Button>
                    ) : (
                        <Button
                            asChild
                            className="h-12 rounded-lg px-5.5 text-[15px] font-semibold"
                        >
                            {/* Logged in: the area of the role; guests: login, then the area. */}
                            <Link href={status === 403 ? dashboard() : home()}>
                                {status === 403
                                    ? 'Vai alla tua area'
                                    : 'Torna alla home'}
                            </Link>
                        </Button>
                    )}
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 rounded-lg px-5.5 text-[15px] font-semibold"
                    >
                        <Link href={contactPage()}>Centro assistenza</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}
