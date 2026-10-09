import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalNote,
    LegalParagraph,
} from '@/components/legal/legal-page';

/** Names and durations are indicative: check them on the live site. */
const cookies = [
    {
        name: 'miopersonal_session',
        purpose: 'Mantiene la sessione e l’accesso al tuo account',
        duration: 'Fino alla chiusura del browser o 2 ore di inattività',
        type: 'Tecnico',
    },
    {
        name: 'XSRF-TOKEN',
        purpose: 'Protegge i moduli da invii fraudolenti',
        duration: '2 ore',
        type: 'Tecnico, sicurezza',
    },
    {
        name: 'remember_web_…',
        purpose: 'Ti mantiene collegato se scegli «Resta collegato»',
        duration: 'Fino a 400 giorni',
        type: 'Tecnico',
    },
    {
        name: 'mp_tema',
        purpose: 'Ricorda se preferisci il tema chiaro o scuro',
        duration: '12 mesi',
        type: 'Tecnico, preferenza',
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
                    Nomi e durate sono indicativi: vanno verificati sulla
                    configurazione definitiva del sito.
                </LegalNote>
            </>
        ),
    },
    {
        id: 'terze',
        title: 'Cookie di terze parti',
        content: (
            <LegalParagraph>
                Al momento non usiamo cookie di terze parti, né strumenti di
                analisi o pubblicità. I caratteri tipografici sono serviti
                direttamente dai nostri server.
            </LegalParagraph>
        ),
    },
    {
        id: 'consenso',
        title: 'Consenso',
        content: (
            <LegalParagraph>
                I cookie tecnici non richiedono consenso. Se in futuro
                introdurremo cookie di analisi o di terze parti, ti mostreremo
                un banner per scegliere, con la possibilità di rifiutare con un
                solo clic.
            </LegalParagraph>
        ),
    },
    {
        id: 'gestire',
        title: 'Come gestire i cookie',
        content: (
            <LegalParagraph>
                Puoi vedere ed eliminare i cookie dalle impostazioni del tuo
                browser (Chrome, Safari, Firefox, Edge). Se blocchi i cookie
                tecnici, l’accesso all’account e le prenotazioni potrebbero non
                funzionare.
            </LegalParagraph>
        ),
    },
];

export default function Cookies() {
    return (
        <LegalPage
            pageName="Cookie policy"
            title="Cookie policy"
            intro="Quali cookie usa MioPersonal e come puoi gestirli."
            updatedOn="8 ottobre 2026"
            summary={[
                'Usiamo solo cookie tecnici, necessari a far funzionare il sito.',
                'Nessun cookie di profilazione e nessuna pubblicità.',
                'Per questo non ti chiediamo il consenso con un banner.',
                'Se in futuro aggiungeremo cookie di analisi, te lo chiederemo prima.',
            ]}
            sections={sections}
        />
    );
}

Cookies.layout = { nav: 'info', footer: 'compact' };
