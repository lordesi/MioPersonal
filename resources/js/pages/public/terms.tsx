import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalList,
    LegalParagraph,
} from '@/components/legal/legal-page';

// Draft: the [placeholders] must be filled in and checked by a lawyer.
const sections: LegalSection[] = [
    {
        id: 'servizio',
        title: 'Il servizio',
        content: (
            <>
                <LegalParagraph>
                    MioPersonal è una piattaforma che permette di trovare
                    personal trainer a Milano e provincia, consultarne il
                    profilo e prenotare una seduta. È in fase beta e gratuita
                    per clienti e trainer.
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
                    'Per prenotare o pubblicare un profilo serve un account. Devi avere almeno 18 anni.',
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
                sul profilo sono indicativi.
            </LegalParagraph>
        ),
    },
    {
        id: 'prenotazioni',
        title: 'Prenotazioni',
        content: (
            <LegalList
                items={[
                    'Quando prenoti, lo slot resta riservato per te finché il trainer lo conferma o lo rifiuta, al massimo per 24 ore.',
                    'Se il trainer non risponde entro 24 ore, la prenotazione decade e lo slot torna libero.',
                    'Dopo la conferma ricevi i contatti e l’indirizzo del trainer, e lui riceve i tuoi.',
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
                    'Puoi spostare o annullare gratuitamente fino al termine indicato sul profilo del trainer (di norma 24 ore prima).',
                    'Il trainer può segnare un’assenza se non ti presenti; eventuali penali sono concordate direttamente con lui.',
                    'Se il trainer annulla, ti avvisiamo subito e puoi scegliere un altro orario.',
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
                    'Mantieni aggiornati orari e regole di prenotazione e rispondi alle prenotazioni entro 24 ore.',
                    'Il profilo è pubblicato solo dopo la verifica del nostro team, che può chiedere modifiche o rifiutarlo.',
                ]}
            />
        ),
    },
    {
        id: 'recensioni',
        title: 'Recensioni',
        content: (
            <LegalParagraph>
                Può lasciare una recensione solo chi ha svolto una seduta con
                quel trainer. Le recensioni devono essere oneste e rispettose:
                rimuoviamo quelle offensive, false o con dati personali. Il
                trainer può rispondere pubblicamente.
            </LegalParagraph>
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
                Puoi chiudere il tuo account quando vuoi. Possiamo sospendere o
                chiudere un account che violi questi termini, avvisandoti quando
                possibile.
            </LegalParagraph>
        ),
    },
    {
        id: 'modifiche',
        title: 'Modifiche ai termini',
        content: (
            <LegalParagraph>
                Possiamo aggiornare questi termini. Le modifiche importanti ti
                saranno comunicate con anticipo via email o sulla piattaforma.
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
            updatedOn="8 ottobre 2026"
            summary={[
                'MioPersonal mette in contatto clienti e personal trainer indipendenti: la seduta è un accordo tra voi.',
                'Durante la beta la piattaforma è gratuita e non gestisce pagamenti.',
                'Lo slot che prenoti resta riservato finché il trainer conferma, al massimo 24 ore.',
                'Recensioni solo da chi ha svolto una seduta, nel rispetto di tutti.',
            ]}
            sections={sections}
        />
    );
}

Terms.layout = { nav: 'info', footer: 'compact' };
