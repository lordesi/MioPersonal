import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import DarkDialog, {
    DarkDialogBody,
    DarkDialogFooter,
} from '@/components/mp/dark-dialog';
import { Switch } from '@/components/ui/switch';
import { darkSwitchClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
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
    ['miopersonal-session', 'Sessione e accesso'],
    ['XSRF-TOKEN', 'Protezione dei moduli'],
    ['remember_web_…', 'Resta collegato'],
    ['sidebar_state', 'Barra laterale aperta o chiusa'],
    ['mp_cookie_consent', 'La tua scelta sui cookie'],
    ['mp_vid', 'Conteggio anonimo dei visitatori'],
];

/** "Categoria", "Cookie usati": plain on phones, small capitals on desktop. */
const sectionTitleClassName =
    'text-[15px] leading-5 font-semibold tracking-[-0.23px] md:text-xs md:leading-4 md:tracking-[0.6px] md:text-muted-foreground md:uppercase';

/**
 * "La tua privacy": the categories, for now only the necessary cookies,
 * locked on. The X goes back to the banner when no choice was made yet.
 */
export default function CookiePreferencesDialog({
    open,
    onOpenChange,
    onSave,
    disabled,
}: CookiePreferencesDialogProps) {
    return (
        <DarkDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <>
                    La tua <strong className="font-bold">privacy</strong>
                </>
            }
            closeLabel="Chiudi le preferenze"
            scrolling
            className="max-md:top-11 md:max-h-[min(852px,calc(100dvh-3rem))] md:max-w-170"
        >
            <DarkDialogBody>
                <div className="flex flex-col gap-3 text-[15px] leading-5 tracking-[-0.23px] text-muted-foreground md:tracking-normal">
                    <p>
                        Quando visiti un sito, questo può salvare o leggere
                        informazioni sul tuo browser, soprattutto sotto forma di
                        cookie. Riguardano te, le tue preferenze o il tuo
                        dispositivo e servono a far funzionare il sito come
                        deve. Di solito non ti identificano direttamente.
                    </p>
                    <p>
                        Per sapere cosa raccoglie ogni cookie e chi ne è
                        responsabile, leggi la{' '}
                        <Link
                            href={cookiePolicy.url()}
                            className="font-semibold text-brand underline underline-offset-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:no-underline md:hover:underline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cookie policy di MioPersonal
                        </Link>
                        .
                    </p>
                </div>

                <section
                    aria-labelledby="cookie-category"
                    className="flex flex-col gap-3"
                >
                    <h3 id="cookie-category" className={sectionTitleClassName}>
                        Categoria
                    </h3>
                    <div className="flex items-center gap-3 rounded-[20px] bg-[#141414] px-4 py-3.5 shadow-[inset_0_0_0_1.5px_var(--brand)] md:min-h-16 md:rounded-[14px] md:bg-transparent md:px-4.5 md:py-2.5 md:shadow-[inset_0_0_0_1px_var(--brand)]">
                        <span
                            aria-hidden="true"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand md:size-5 md:bg-transparent"
                        >
                            <Lock className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[17px] leading-5.5 font-semibold tracking-[-0.43px] md:text-[15px] md:leading-5 md:tracking-[-0.23px]">
                                <span className="hidden md:inline">
                                    Cookie strettamente necessari
                                </span>
                                <span className="md:hidden">
                                    Strettamente necessari
                                </span>
                            </span>
                            <span className="text-[13px] leading-4.5 text-muted-foreground">
                                Sempre attivi
                            </span>
                        </div>
                        <Switch
                            checked
                            disabled
                            aria-label="Cookie strettamente necessari, sempre attivi"
                            className={cn(
                                darkSwitchClassName,
                                'disabled:opacity-100',
                            )}
                        />
                    </div>
                    <p className="text-[13px] leading-4.5 tracking-[-0.08px] text-muted-foreground md:tracking-normal">
                        Servono al funzionamento del sito e non si possono
                        disattivare. Vengono impostati solo in risposta a una
                        tua azione, come l’accesso, la scelta delle preferenze o
                        la compilazione di un modulo. Puoi bloccarli dal
                        browser, ma alcune parti del sito potrebbero smettere di
                        funzionare.
                    </p>
                </section>

                <section
                    aria-labelledby="cookie-list"
                    className="flex flex-col gap-3"
                >
                    <h3 id="cookie-list" className={sectionTitleClassName}>
                        Cookie usati
                    </h3>
                    {/* Phones: one list with lines; desktop: two columns of cards. */}
                    <ul className="flex flex-col rounded-[20px] bg-[#141414] px-4 shadow-[inset_0_0_0_1px_var(--border)] md:grid md:grid-cols-2 md:gap-3 md:rounded-none md:bg-transparent md:px-0 md:shadow-none">
                        {necessaryCookies.map(([name, purpose]) => (
                            <li
                                key={name}
                                className="flex min-h-13 flex-col justify-center gap-0.5 border-t border-separator py-2 first:border-t-0 md:min-h-16 md:rounded-[14px] md:border-t-0 md:px-4.5 md:py-2.5 md:shadow-[inset_0_0_0_1px_var(--border)]"
                            >
                                <span className="font-mono text-[13px] leading-4.5 text-foreground">
                                    {name}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground">
                                    {purpose}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            </DarkDialogBody>

            <DarkDialogFooter>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={disabled}
                    className="btn-brand h-12.5 w-full text-[17px] tracking-[-0.43px] md:w-auto md:min-w-65 md:px-8"
                >
                    Salva preferenze
                </button>
            </DarkDialogFooter>
        </DarkDialog>
    );
}
