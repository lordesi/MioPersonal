import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cookies as cookiePolicy } from '@/routes/legal';

type CookiePreferencesDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Saves the choice: only necessary cookies exist, so it is always the same. */
    onSave: () => void;
    disabled?: boolean;
};

/** The cookies the site really sets, shown under "strettamente necessari". */
const necessaryCookies = [
    ['miopersonal-session', 'sessione e accesso'],
    ['XSRF-TOKEN', 'protezione dei moduli'],
    ['remember_web_…', 'resta collegato'],
    ['sidebar_state', 'barra laterale aperta o chiusa'],
    ['mp_cookie_consent', 'la tua scelta sui cookie'],
    ['mp_vid', 'conteggio anonimo dei visitatori'],
];

/** "La tua privacy": the categories, for now only the necessary cookies, locked on. */
export default function CookiePreferencesDialog({
    open,
    onOpenChange,
    onSave,
    disabled,
}: CookiePreferencesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* The built-in X is hidden: the arrow is the way back. */}
            <DialogContent
                aria-describedby={undefined}
                className="flex max-h-[min(92dvh,760px)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-xl [&>button]:hidden"
            >
                <div className="relative flex flex-none items-center justify-center border-b px-6 py-4">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        aria-label="Indietro"
                        className="absolute left-4 rounded-full p-2 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <DialogTitle className="text-base leading-6">
                        La tua privacy
                    </DialogTitle>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 text-[15px] leading-6">
                    <p>
                        Quando visiti un sito web questo potrebbe memorizzare o
                        recuperare informazioni sul tuo browser, principalmente
                        sotto forma di cookie. Queste informazioni potrebbero
                        riguardare te, le tue preferenze o il tuo dispositivo e
                        sono principalmente utilizzate per far funzionare il
                        sito come dovuto. Le informazioni di solito non ti
                        identificano direttamente.
                    </p>
                    <p>
                        Per saperne di più su ciascun cookie, su quali
                        informazioni raccoglie e su chi ne è responsabile,
                        consulta la{' '}
                        <Link
                            href={cookiePolicy.url()}
                            className="font-semibold underline underline-offset-3"
                            onClick={() => onOpenChange(false)}
                        >
                            Cookie policy di MioPersonal
                        </Link>
                        .
                    </p>

                    <section className="space-y-3 pt-2">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-xl font-semibold">
                                Cookie strettamente necessari
                            </h3>
                            <Switch
                                checked
                                disabled
                                aria-label="Cookie strettamente necessari, sempre attivi"
                                className="px-0.5 data-[size=default]:h-7 data-[size=default]:w-12 [&>[data-slot=switch-thumb]]:size-5.5!"
                            />
                        </div>
                        <p>
                            Questi cookie sono necessari per il funzionamento
                            del sito web e non possono essere disattivati nei
                            nostri sistemi. In genere vengono assegnati solo in
                            risposta alle azioni da te eseguite che comportano
                            una richiesta di servizi, ad esempio l’accesso,
                            l’impostazione delle preferenze o la compilazione di
                            moduli. Puoi configurare il browser in modo che ti
                            blocchi o ti avvisi riguardo a questi cookie, ma ciò
                            potrebbe impedire il funzionamento di alcune parti
                            del sito.
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {necessaryCookies.map(([name, purpose]) => (
                                <li key={name}>
                                    <span className="font-mono text-[13px] text-foreground">
                                        {name}
                                    </span>{' '}
                                    · {purpose}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="flex-none border-t px-6 py-4">
                    <Button
                        type="button"
                        size="lg"
                        className="h-12 w-full rounded-lg text-base font-semibold"
                        onClick={onSave}
                        disabled={disabled}
                    >
                        Salva
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
