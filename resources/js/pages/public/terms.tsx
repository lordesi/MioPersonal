import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalList,
    LegalParagraph,
} from '@/components/legal/legal-page';

// Draft: the [placeholders] must be filled in and checked by a lawyer.
// Each sentence describes what the code does today: change them together.
const sections: LegalSection[] = [
    {
        id: 'servizio',
        title: 'Il servizio',
        content: (
            <>
                <LegalParagraph>
                    MioPersonal è una piattaforma che permette di trovare
                    personal trainer in tutta Italia, consultarne il profilo e
                    prenotare una seduta. È in fase beta e gratuita per clienti
                    e trainer.
                </LegalParagraph>
                <LegalParagraph>
                    Gestito da [nome e cognome del titolare / futura società],
                    contattabile a [email di contatto].
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'account',
        title: 'Il tuo account',
        content: (
            <LegalList
                items={[
                    'Per prenotare o pubblicare un profilo serve un account, anche con «Continua con Google». Devi avere almeno 18 anni.',
                    'I dati che inserisci devono essere veri e aggiornati.',
                    'Sei responsabile della sicurezza della tua password e di ciò che avviene con il tuo account.',
                ]}
            />
        ),
    },
    {
        id: 'ruolo',
        title: 'Il ruolo di MioPersonal',
        content: (
            <LegalParagraph>
                I trainer sono professionisti indipendenti: MioPersonal non è il
                loro datore di lavoro e non è parte dell’accordo tra cliente e
                trainer. Prezzi, modalità di pagamento e svolgimento della
                seduta sono concordati direttamente tra voi. I prezzi mostrati
                sul profilo sono indicativi. MioPersonal non incassa pagamenti:
                paghi il trainer direttamente, nei modi concordati con lui.
            </LegalParagraph>
        ),
    },
    {
        id: 'prenotazioni',
        title: 'Prenotazioni',
        content: (
            <LegalList
                items={[
                    'Quando prenoti, lo slot resta riservato per te finché il trainer conferma o rifiuta la richiesta, al massimo per 24 ore dall’invio.',
                    'Se il trainer non risponde entro 24 ore, la richiesta decade e lo slot torna libero. Lo stato di ogni richiesta lo trovi nella tua area cliente; ti scriviamo via email quando il trainer conferma.',
                    'Alcuni trainer confermano in automatico («Conferma immediata» sul profilo): in quel caso la prenotazione è confermata appena la invii.',
                    'Dopo la conferma il trainer riceve la tua email e il tuo telefono per organizzare la seduta. Nome e indirizzo dello studio sono indicati sul suo profilo.',
                ]}
            />
        ),
    },
    {
        id: 'cancellazioni',
        title: 'Cancellazioni e assenze',
        content: (
            <LegalList
                items={[
                    'Una richiesta non ancora confermata puoi annullarla dalla tua area fino all’inizio della seduta.',
                    'Una prenotazione confermata puoi annullarla gratuitamente fino al termine indicato sul profilo del trainer: 12, 24 o 48 ore prima (di norma 24). Dopo il termine non si può più annullare dalla piattaforma: accordati direttamente con il trainer.',
                    'Per cambiare orario annulli e prenoti di nuovo. Il trainer può proporti un altro orario: la seduta si sposta solo se accetti, e finché non rispondi resta quello di prima. Mentre c’è una proposta puoi anche annullare gratis.',
                    'Il trainer può rifiutare una richiesta non ancora confermata. Se dopo la conferma non può più fare la seduta, la annulla e ti avvisiamo via email; una seduta di un pacchetto torna disponibile.',
                    'Entro 7 giorni dalla seduta il trainer può segnarla come saltata se non ti presenti. Le sedute saltate contano nella percentuale di presenza che vedono i trainer a cui chiedi una seduta; eventuali penali le concordi con lui. Se pensi che un’assenza sia sbagliata, scrivici.',
                    'Se un trainer chiude il profilo, le sue prenotazioni vengono annullate.',
                ]}
            />
        ),
    },
    {
        id: 'pacchetti',
        title: 'Pacchetti di sedute',
        content: (
            <LegalList
                items={[
                    'Alcuni trainer offrono pacchetti di più sedute a un prezzo complessivo. Il pacchetto si attiva quando il trainer conferma la prima seduta; le successive le prenoti dal suo profilo.',
                    'Pagamento, eventuale scadenza e rimborsi delle sedute non usate li concordi direttamente con il trainer: MioPersonal non incassa nulla e il contatore delle sedute è solo un promemoria.',
                    'Una seduta annullata in tempo torna disponibile nel pacchetto; una seduta segnata come saltata conta come usata.',
                    'Se il trainer chiude il profilo, il pacchetto non è più visibile sulla piattaforma: per le sedute rimaste accordati con lui.',
                ]}
            />
        ),
    },
    {
        id: 'trainer',
        title: 'Regole per i personal trainer',
        content: (
            <LegalList
                items={[
                    'Pubblichi informazioni vere su qualifiche, esperienza, servizi e prezzi.',
                    'Ti impegni a possedere le qualifiche e le eventuali assicurazioni richieste per la tua attività [da verificare].',
                    'Mantieni aggiornati orari e regole di prenotazione e rispondi alle richieste entro 24 ore.',
                    'Il profilo è pubblicato la prima volta solo dopo la verifica del nostro team, che può chiedere modifiche o rifiutarlo. Il team controlla le informazioni del profilo e gli eventuali attestati caricati: non è una verifica dell’identità né una garanzia delle qualifiche.',
                    'Dopo l’approvazione, le modifiche a profilo, servizi e foto sono pubblicate subito, sotto la tua responsabilità; il team può controllarle in ogni momento.',
                    'Segni una seduta come saltata solo se il cliente non si è presentato davvero: conta nella percentuale di presenza che vedono gli altri trainer.',
                ]}
            />
        ),
    },
    {
        id: 'recensioni',
        title: 'Recensioni',
        content: (
            <>
                <LegalParagraph>
                    Può lasciare una recensione solo chi ha svolto con quel
                    trainer una seduta confermata su MioPersonal e non segnata
                    come saltata, con l’email verificata: una recensione per
                    ogni prenotazione. Le recensioni sono pubblicate subito e
                    non si possono modificare; per cambiarne o toglierne una
                    tua, scrivici. Il trainer può rispondere pubblicamente.
                </LegalParagraph>
                <LegalParagraph>
                    Le recensioni devono essere oneste e rispettose. Se ne trovi
                    una offensiva, falsa o con dati personali, segnalacela dalla
                    pagina Contatti indicando trainer e recensione: se viola
                    queste regole la rimuoviamo e lo spieghiamo a chi l’ha
                    scritta.
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'ordine',
        title: 'Come ordiniamo i trainer',
        content: (
            <>
                <LegalList
                    items={[
                        'Nella ricerca compaiono solo i trainer approvati dal team, visibili e non in pausa.',
                        'Se hai completato il profilo cliente, vengono prima i trainer più vicini alle tue preferenze, in quest’ordine: città, modalità (di persona o online), discipline in comune, obiettivo e prezzo entro il budget.',
                        'Poi, in una città, chi allena di persona prima di chi lavora solo online; poi chi ha più recensioni; a parità, i profili iscritti da più tempo.',
                        'Puoi scegliere un altro ordine: primo orario libero, prezzo o valutazione media.',
                        '«Trainer in evidenza» nella home: valutazione media più alta, poi numero di recensioni, poi i profili approvati più di recente.',
                    ]}
                />
                <LegalParagraph>
                    Nessun trainer paga per comparire più in alto: oggi non
                    esistono posizionamenti a pagamento.
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'vietato',
        title: 'Cosa non è permesso',
        content: (
            <LegalList
                items={[
                    'Usare la piattaforma per scopi diversi dalla ricerca e prenotazione di sedute.',
                    'Pubblicare contenuti offensivi, discriminatori o ingannevoli.',
                    'Contattare gli utenti per pubblicità o spam.',
                    'Tentare di accedere ad account o dati di altri.',
                ]}
            />
        ),
    },
    {
        id: 'responsabilita',
        title: 'Responsabilità',
        content: (
            <LegalParagraph>
                Durante la beta il servizio è offerto così com’è e potrebbe
                avere interruzioni o errori. MioPersonal non risponde dello
                svolgimento delle sedute, che restano sotto la responsabilità
                del trainer e del cliente, nei limiti previsti dalla legge.
                Prima di iniziare un’attività fisica valuta con il tuo medico
                eventuali controindicazioni.
            </LegalParagraph>
        ),
    },
    {
        id: 'sospensione',
        title: 'Sospensione e chiusura dell’account',
        content: (
            <LegalParagraph>
                Puoi chiudere il tuo account quando vuoi dalle Impostazioni; se
                sei trainer puoi anche chiudere solo il profilo e tornare
                cliente. Se violi questi termini possiamo togliere il tuo
                profilo dalla ricerca o chiudere il tuo account: ti spieghiamo
                il motivo via email e puoi rispondere per chiarire. Se non è
                urgente, ti avvisiamo prima.
            </LegalParagraph>
        ),
    },
    {
        id: 'contatti',
        title: 'Contatti e segnalazioni',
        content: (
            <LegalParagraph>
                Per domande, reclami e segnalazioni di contenuti illeciti, anche
                da parte delle autorità, il nostro punto di contatto è [email di
                contatto], in italiano o in inglese. Puoi scriverci anche dalla
                pagina Contatti.
            </LegalParagraph>
        ),
    },
    {
        id: 'modifiche',
        title: 'Modifiche ai termini',
        content: (
            <LegalParagraph>
                Possiamo aggiornare questi termini. Le modifiche importanti ti
                saranno comunicate via email o sulla piattaforma almeno 15
                giorni prima che si applichino, salvo quelle imposte dalla
                legge.
            </LegalParagraph>
        ),
    },
    {
        id: 'legge',
        title: 'Legge applicabile',
        content: (
            <LegalParagraph>
                Si applica la legge italiana. Se sei un consumatore, per le
                controversie è competente il giudice del luogo in cui risiedi.
            </LegalParagraph>
        ),
    },
];

export default function Terms() {
    return (
        <LegalPage
            pageName="Termini e condizioni"
            title="Termini e condizioni d’uso"
            intro="Le regole per usare MioPersonal, sia se cerchi un trainer sia se sei un personal trainer."
            updatedOn="29 ottobre 2026"
            summary={[
                'MioPersonal mette in contatto clienti e personal trainer indipendenti: la seduta è un accordo tra voi.',
                'Durante la beta la piattaforma è gratuita e non gestisce pagamenti, nemmeno dei pacchetti.',
                'Lo slot che prenoti resta riservato finché il trainer conferma, al massimo 24 ore.',
                'Recensioni solo da chi ha svolto una seduta, nel rispetto di tutti.',
            ]}
            sections={sections}
        />
    );
}
