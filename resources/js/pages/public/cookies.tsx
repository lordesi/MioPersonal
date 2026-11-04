import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalNote,
    LegalParagraph,
} from '@/components/legal/legal-page';
import { Button } from '@/components/ui/button';
import { openCookieSettings } from '@/lib/cookie-consent';

/**
 * Every cookie and browser storage of the site: names and durations come from
 * config/session.php, Laravel's remember-me cookie, sidebar.tsx,
 * CookieConsent and saved-draft.ts. Update the table when one changes.
 */
const cookies = [
    {
        name: 'miopersonal-session',
        purpose: 'Mantiene la sessione e l’accesso al tuo account',
        duration: '2 ore dall’ultima attività',
        type: 'Tecnico',
    },
    {
        name: 'XSRF-TOKEN',
        purpose: 'Protegge i moduli da invii fraudolenti',
        duration: '2 ore dall’ultima attività',
        type: 'Tecnico, sicurezza',
    },
    {
        name: 'remember_web_…',
        purpose:
            'Ti mantiene collegato se scegli «Resta collegato» o accedi con Google',
        duration: 'Fino a 400 giorni',
        type: 'Tecnico',
    },
    {
        name: 'sidebar_state',
        purpose: 'Ricorda se la barra laterale è aperta o chiusa',
        duration: '7 giorni',
        type: 'Tecnico, preferenza',
    },
    {
        name: 'mp_cookie_consent',
        purpose: 'Ricorda le tue scelte sui cookie',
        duration: '6 mesi',
        type: 'Tecnico',
    },
    {
        name: 'miopersonal:trainer-draft:…',
        purpose:
            'Salva nel tuo browser la bozza della registrazione trainer, mai sui nostri server',
        duration: 'Finché invii il profilo o ricominci',
        type: 'Tecnico, memoria del browser',
    },
];

const cellClassName = 'border-b px-3 py-2.5 align-top';

const sections: LegalSection[] = [
    {
        id: 'cosa',
        title: 'Cosa sono i cookie',
        content: (
            <LegalParagraph>
                I cookie sono piccoli file che il sito salva nel tuo browser per
                ricordare informazioni tra una pagina e l’altra, per esempio che
                hai già fatto l’accesso.
            </LegalParagraph>
        ),
    },
    {
        id: 'quali',
        title: 'Quali cookie usiamo',
        content: (
            <>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-140 bg-card text-left text-sm">
                        <thead>
                            <tr className="text-[13px]">
                                {['Nome', 'A cosa serve', 'Durata', 'Tipo'].map(
                                    (heading) => (
                                        <th
                                            key={heading}
                                            scope="col"
                                            className="border-b px-3 py-2.5 font-semibold"
                                        >
                                            {heading}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {cookies.map((cookie) => (
                                <tr key={cookie.name}>
                                    <td
                                        className={`${cellClassName} font-mono text-[13px]`}
                                    >
                                        {cookie.name}
                                    </td>
                                    <td className={cellClassName}>
                                        {cookie.purpose}
                                    </td>
                                    <td className={cellClassName}>
                                        {cookie.duration}
                                    </td>
                                    <td className={cellClassName}>
                                        {cookie.type}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <LegalNote>
                    Questi sono tutti i cookie e i dati salvati nel browser che
                    usiamo oggi. Se ne aggiungiamo uno, aggiorniamo questa
                    tabella.
                </LegalNote>
            </>
        ),
    },
    {
        id: 'terze',
        title: 'Cookie di terze parti',
        content: (
            <>
                <LegalParagraph>
                    Al momento non usiamo cookie di terze parti, né strumenti di
                    analisi o pubblicità. I caratteri tipografici sono serviti
                    direttamente dai nostri server.
                </LegalParagraph>
                <LegalParagraph>
                    Se scegli «Continua con Google», per l’accesso passi dal
                    sito di Google, che usa i propri cookie secondo la sua
                    privacy policy.
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'consenso',
        title: 'Consenso',
        content: (
            <>
                <LegalParagraph>
                    I cookie tecnici non richiedono consenso. Oggi non usiamo
                    nessun cookie facoltativo, di statistica o di marketing.
                    Alla prima visita il banner ti chiede comunque cosa
                    preferisci per il futuro: puoi accettare, rifiutare con un
                    solo clic o scegliere categoria per categoria. Chiudere il
                    banner con la X equivale a rifiutare.
                </LegalParagraph>
                <LegalParagraph>
                    Se aggiungeremo cookie facoltativi, in questa pagina
                    troverai il nome del fornitore e a cosa servono, e il banner
                    ti chiederà di nuovo la tua scelta.
                </LegalParagraph>
                <LegalParagraph>
                    Ricordiamo la tua scelta per 6 mesi, poi te la chiediamo di
                    nuovo. Te la chiediamo prima solo se questa policy cambia.
                    Per poter dimostrare il consenso registriamo la scelta, la
                    data e la versione della policy, senza il tuo indirizzo IP.
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'gestire',
        title: 'Come gestire i cookie',
        content: (
            <>
                <LegalParagraph>
                    Puoi cambiare la tua scelta in ogni momento da «Impostazioni
                    cookie», in fondo a ogni pagina, o da qui:
                </LegalParagraph>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 self-start"
                    onClick={openCookieSettings}
                >
                    Gestisci le preferenze
                </Button>
                <LegalParagraph>
                    Puoi anche vedere ed eliminare i cookie dalle impostazioni
                    del tuo browser (Chrome, Safari, Firefox, Edge). Se blocchi
                    i cookie tecnici, l’accesso all’account e le prenotazioni
                    potrebbero non funzionare.
                </LegalParagraph>
            </>
        ),
    },
];

export default function Cookies() {
    return (
        <LegalPage
            pageName="Cookie policy"
            title="Cookie policy"
            intro="Quali cookie usa MioPersonal e come puoi gestirli."
            updatedOn="29 ottobre 2026"
            summary={[
                'Oggi usiamo solo cookie tecnici, necessari a far funzionare il sito.',
                'Nessun cookie di statistica, di profilazione o di pubblicità attivo.',
                'Se li aggiungeremo, li useremo solo con il tuo consenso.',
                'Puoi cambiare la tua scelta quando vuoi da «Impostazioni cookie».',
            ]}
            sections={sections}
        />
    );
}
