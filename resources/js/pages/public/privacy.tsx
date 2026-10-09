import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalList,
    LegalNote,
    LegalParagraph,
} from '@/components/legal/legal-page';

// Draft: the [placeholders] must be filled in and checked by a lawyer.
const sections: LegalSection[] = [
    {
        id: 'titolare',
        title: 'Chi è il titolare del trattamento',
        content: (
            <>
                <LegalParagraph>
                    MioPersonal è un progetto in fase beta. Fino alla
                    costituzione di una società, il titolare del trattamento è
                    [nome e cognome del titolare], [città].
                </LegalParagraph>
                <LegalParagraph>
                    Per qualsiasi domanda sui tuoi dati puoi scrivere a [email
                    per la privacy].
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'dati',
        title: 'Quali dati raccogliamo',
        content: (
            <>
                <LegalList
                    items={[
                        'Dati dell’account: nome, cognome, email, telefono e password (salvata in forma cifrata).',
                        'Profilo cliente, se lo completi: foto, zona in cui ti alleni, obiettivo, discipline, orari preferiti e budget indicativo.',
                        'Profilo trainer: foto, presentazione, anni di esperienza, discipline, zone, indirizzi dei luoghi in cui alleni, servizi e prezzi, orari di lavoro, certificazioni e relativi attestati.',
                        'Prenotazioni: trainer scelto, servizio, data, orario, luogo e l’eventuale messaggio.',
                        'Recensioni e risposte pubblicate sulla piattaforma.',
                        'Messaggi che ci invii dalla pagina Contatti.',
                        'Dati tecnici: indirizzo IP, tipo di browser, registri di accesso e cookie tecnici.',
                    ]}
                />
                <LegalNote>
                    Non chiediamo dati sulla salute. Ti chiediamo di non
                    inserirli nei messaggi, nelle note o nelle recensioni.
                </LegalNote>
            </>
        ),
    },
    {
        id: 'finalita',
        title: 'Perché li usiamo e su quale base',
        content: (
            <LegalList
                items={[
                    'Creare e gestire il tuo account e le prenotazioni: esecuzione del servizio che ci chiedi (art. 6.1.b GDPR).',
                    'Verificare i profili dei trainer prima di pubblicarli: esecuzione del servizio e nostro legittimo interesse a una piattaforma affidabile (art. 6.1.b e 6.1.f).',
                    'Inviarti email di servizio: conferme, promemoria, cambi di orario (art. 6.1.b).',
                    'Inviarti novità sulla piattaforma, solo se ce lo chiedi: consenso, revocabile in ogni momento (art. 6.1.a).',
                    'Proteggere la piattaforma da abusi e accessi non autorizzati: legittimo interesse (art. 6.1.f).',
                    'Rispettare obblighi di legge (art. 6.1.c).',
                ]}
            />
        ),
    },
    {
        id: 'destinatari',
        title: 'Chi può vedere i tuoi dati',
        content: (
            <>
                <LegalList
                    items={[
                        'Il trainer che prenoti vede nome, servizio, orario e messaggio; email e telefono solo dopo aver confermato.',
                        'Il cliente vede i contatti del trainer e l’indirizzo esatto solo dopo la conferma.',
                        'Sul profilo pubblico del trainer compaiono solo le informazioni che sceglie di pubblicare; dei luoghi mostriamo la zona, non l’indirizzo.',
                        'I fornitori che ci aiutano a far funzionare il servizio, nominati responsabili del trattamento: hosting [nome del fornitore] e invio email [nome del fornitore].',
                    ]}
                />
                <LegalParagraph>
                    Non vendiamo né cediamo i tuoi dati a terzi per finalità di
                    marketing.
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'luogo',
        title: 'Dove sono conservati',
        content: (
            <LegalParagraph>
                I dati sono conservati su server situati nell’Unione europea [da
                confermare con il fornitore di hosting]. Se un fornitore li
                trattasse fuori dall’UE, lo farà solo con le garanzie previste
                dal GDPR, come le clausole contrattuali standard.
            </LegalParagraph>
        ),
    },
    {
        id: 'conservazione',
        title: 'Per quanto tempo li teniamo',
        content: (
            <LegalList
                items={[
                    'Dati dell’account: finché l’account è attivo; dopo la cancellazione li eliminiamo entro [X] giorni.',
                    'Storico delle prenotazioni: [X] mesi dalla seduta, poi in forma anonima.',
                    'Attestati caricati dai trainer: fino all’approvazione del profilo più [X] mesi.',
                    'Registri tecnici di accesso: [X] giorni.',
                    'Messaggi dalla pagina Contatti: [X] mesi dalla risposta.',
                ]}
            />
        ),
    },
    {
        id: 'diritti',
        title: 'I tuoi diritti',
        content: (
            <>
                <LegalParagraph>
                    In ogni momento puoi chiederci di accedere ai tuoi dati,
                    correggerli, cancellarli, limitarne l’uso, riceverli in un
                    formato leggibile (portabilità) o opporti al trattamento
                    basato sul legittimo interesse. Puoi revocare i consensi
                    dati, senza effetti sui trattamenti già fatti.
                </LegalParagraph>
                <LegalParagraph>
                    Rispondiamo entro un mese. Se pensi che i tuoi dati non
                    siano trattati correttamente, puoi presentare reclamo al
                    Garante per la protezione dei dati personali
                    (garanteprivacy.it).
                </LegalParagraph>
            </>
        ),
    },
    {
        id: 'minori',
        title: 'Minori',
        content: (
            <LegalParagraph>
                MioPersonal è riservato a chi ha almeno 18 anni. Non raccogliamo
                consapevolmente dati di minori.
            </LegalParagraph>
        ),
    },
    {
        id: 'modifiche',
        title: 'Modifiche a questa informativa',
        content: (
            <LegalParagraph>
                Se cambiamo qualcosa di importante te lo diciamo via email o con
                un avviso sulla piattaforma. In alto trovi sempre la data
                dell’ultimo aggiornamento.
            </LegalParagraph>
        ),
    },
];

export default function Privacy() {
    return (
        <LegalPage
            pageName="Privacy policy"
            title="Informativa sulla privacy"
            intro="Come MioPersonal raccoglie e usa i tuoi dati quando cerchi un trainer, prenoti una seduta o ti iscrivi come personal trainer."
            updatedOn="8 ottobre 2026"
            summary={[
                'Raccogliamo solo i dati che servono a farti trovare un trainer e a gestire le prenotazioni.',
                'I tuoi contatti arrivano al trainer solo dopo che ha confermato la prenotazione.',
                'Non vendiamo i tuoi dati e non li usiamo per pubblicità.',
                'Puoi vedere, correggere o cancellare i tuoi dati quando vuoi, scrivendoci.',
            ]}
            sections={sections}
        />
    );
}

Privacy.layout = { nav: 'info', footer: 'compact' };
