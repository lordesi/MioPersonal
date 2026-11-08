import type { LegalSection } from '@/components/legal/legal-page';
import LegalPage, {
    LegalList,
    LegalNote,
    LegalParagraph,
} from '@/components/legal/legal-page';

// Draft: the [placeholders] must be filled in and checked by a lawyer.
// Each sentence describes what the code does today: change them together.
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
                        'Dati dell’account: nome, cognome, email, telefono e password (salvata in forma cifrata), con la data in cui hai accettato termini e informativa.',
                        'Se usi «Continua con Google»: l’identificativo del tuo account Google, nome, cognome ed email. Non riceviamo la tua password Google né la tua foto.',
                        'Profilo cliente, se lo completi: foto, città in cui ti alleni, obiettivo, discipline, orari preferiti, budget indicativo e trainer salvati nei preferiti.',
                        '«Su di te», se lo compili: anno di nascita, sesso, livello, da quanto ti alleni, quanto ti muovi, quante volte a settimana vorresti allenarti, sport praticati e una nota per il trainer.',
                        'Altezza e peso, solo se scegli di indicarli dando il consenso apposito.',
                        'Profilo trainer: foto e galleria, presentazione, anni di esperienza, discipline, obiettivi con cui lavori, zone, nome e indirizzo dei luoghi in cui alleni, indicazioni per arrivare, servizi, pacchetti e prezzi, orari di lavoro, certificazioni e relativi attestati.',
                        'Social del trainer, se li colleghi (Instagram, TikTok, Facebook, YouTube): l’identificativo dell’account, il nome utente (su Facebook il nome) e il link al profilo. Non conserviamo le chiavi di accesso che il social ci dà, né leggiamo post, messaggi o follower. Se scrivi a mano il tuo nome Instagram, salviamo solo quello.',
                        'Prenotazioni: trainer scelto, servizio, data, orario, luogo, stato della prenotazione con la sua storia (richiesta, conferma, annullamento) e i pacchetti di sedute con le sedute usate.',
                        'Assenze: se non ti presenti a una seduta confermata, il trainer può segnarla come «saltata».',
                        'Recensioni e risposte pubblicate sulla piattaforma.',
                        'Messaggi che ci invii dalla pagina Contatti.',
                        'Dati tecnici: indirizzo IP, tipo di browser, registri di accesso, data dell’ultima attività e giorni in cui hai usato il sito, cookie tecnici.',
                        'Statistiche anonime, non collegate a te: le pagine viste e le visite di ogni giorno con il canale da cui arrivano (per esempio Google o Instagram), le ricerche fatte (città, discipline, filtri usati e numero di risultati) e quante volte ogni giorno viene aperto il profilo di un trainer. Per contare i visitatori unici usiamo un cookie nostro, «mp_vid», con un codice casuale: sui nostri server ne salviamo solo una versione cifrata, non collegata al tuo account né al tuo indirizzo IP, che non salviamo (vedi la cookie policy).',
                        'Da dove sei arrivato quando ti sei iscritto: il canale (per esempio Google, Instagram o il nome di una campagna) e la prima pagina vista.',
                        'Le tue scelte sui cookie, con data e versione della cookie policy, per poter dimostrare il consenso.',
                        'Solo nel tuo browser, mai sui nostri server: la bozza della registrazione trainer, finché la invii o ricominci.',
                    ]}
                />
                <LegalNote>
                    Altezza e peso possono dire qualcosa sulla tua salute: li
                    salviamo solo con il tuo consenso esplicito e puoi
                    cancellarli quando vuoi da «Modifica profilo». Non chiediamo
                    altri dati sulla salute (malattie, infortuni, farmaci): ti
                    chiediamo di non inserirli nei messaggi, nelle note o nelle
                    recensioni.
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
                    'Creare e gestire il tuo account, anche con l’accesso tramite Google, e le prenotazioni: esecuzione del servizio che ci chiedi (art. 6.1.b GDPR).',
                    'Verificare i profili dei trainer prima di pubblicarli: esecuzione del servizio e nostro legittimo interesse a una piattaforma affidabile (art. 6.1.b e 6.1.f).',
                    'Inviarti email di servizio, per esempio la conferma di una prenotazione (art. 6.1.b).',
                    'Mostrare ai trainer a cui chiedi una seduta la tua percentuale di presenza, calcolata sulle sedute svolte con tutti i trainer e su quelle segnate come saltate: legittimo interesse dei trainer a organizzare il proprio lavoro (art. 6.1.f). Puoi opporti scrivendoci.',
                    'Mostrare ai trainer a cui chiedi una seduta quello che scrivi in «Su di te», perché possano prepararla su misura: esecuzione del servizio (art. 6.1.b). Altezza e peso solo con il tuo consenso esplicito (art. 9.2.a GDPR), che puoi revocare togliendo la spunta: li cancelliamo subito.',
                    'Oggi non inviamo newsletter né novità promozionali. Se lo faremo, sarà solo con il tuo consenso, revocabile in ogni momento (art. 6.1.a).',
                    'Proteggere la piattaforma da abusi e accessi non autorizzati: legittimo interesse (art. 6.1.f).',
                    'Statistiche interne per migliorare il servizio (quanti utenti sono attivi, cosa si cerca e non si trova): legittimo interesse (art. 6.1.f). Le ricerche e le visite ai profili sono anonime; i giorni di attività si cancellano con l’account.',
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
                        'Il trainer a cui chiedi una seduta vede nome e cognome, servizio, data e orario, la tua percentuale di presenza e quello che hai scritto in «Su di te» (con altezza e peso solo se li hai indicati); email e telefono solo dopo che ha confermato una tua prenotazione.',
                        'Sul profilo pubblico del trainer, visibile a tutti, compaiono nome e cognome, foto, presentazione, servizi e prezzi, certificazioni (titolo ed ente, non l’attestato), il nome e l’indirizzo degli studi in cui allena, i social collegati (con il link al profilo) e le recensioni.',
                        'Se colleghi un social, quella piattaforma (Meta per Instagram e Facebook, TikTok, Google per YouTube) sa che hai autorizzato MioPersonal: per quella parte è un titolare autonomo, con la sua informativa.',
                        'Nelle recensioni compaiono il tuo nome e l’iniziale del cognome, per esempio «Anna B.».',
                        'Il team di MioPersonal, solo per verificare i profili dei trainer, rispondere alle tue richieste e gestire le segnalazioni.',
                        'Se usi «Continua con Google», Google sa che hai fatto l’accesso a MioPersonal: per quella parte è un titolare autonomo, con la sua informativa.',
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
                    'Dati dell’account, del profilo e storico delle prenotazioni: finché l’account è attivo.',
                    'Quando elimini l’account lo blocchiamo subito e annulliamo le prenotazioni future; dopo 30 giorni, il tempo per cambiare idea accedendo di nuovo, cancelliamo i dati dell’account, la foto, le preferenze e i preferiti. Dalle copie di sicurezza spariscono entro [X] giorni.',
                    'Dopo l’eliminazione restano, senza alcun collegamento a te, le prenotazioni passate nello storico del trainer e le recensioni che hai scritto, che compaiono come «Utente anonimo».',
                    'Se un trainer chiude il profilo, cancelliamo anche servizi, foto, attestati, recensioni ricevute e prenotazioni legate al profilo.',
                    'Social collegati dal trainer: finché non li scolleghi da «Modifica profilo» (premendo «Scollega» li cancelliamo subito) o chiudi il profilo. Puoi anche revocare l’accesso dalle impostazioni del social: il collegamento resta finché non lo scolleghi qui.',
                    'Attestati caricati dai trainer: li cancelliamo appena il team approva o rifiuta il profilo. Restano titolo, ente e anno della certificazione.',
                    'Registri tecnici di accesso: [X] giorni.',
                    'Messaggi dalla pagina Contatti: non li salviamo sul sito. Arrivano nella casella email del team e li teniamo [X] mesi dalla risposta.',
                    'Scelte sui cookie: [X] mesi dalla scelta, per poter dimostrare il consenso.',
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
                    basato sul legittimo interesse, come la percentuale di
                    presenza. Puoi revocare i consensi dati, senza effetti sui
                    trattamenti già fatti.
                </LegalParagraph>
                <LegalParagraph>
                    Nome e telefono li correggi da solo nelle Impostazioni, dove
                    puoi anche eliminare l’account. Per cambiare email, ricevere
                    una copia dei tuoi dati o per tutto il resto scrivici.
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
            updatedOn="8 novembre 2026"
            summary={[
                'Raccogliamo solo i dati che servono a farti trovare un trainer e a gestire le prenotazioni.',
                'Email e telefono arrivano al trainer solo dopo che ha confermato una tua prenotazione.',
                'Non vendiamo i tuoi dati e non li usiamo per pubblicità.',
                'Puoi correggere i tuoi dati o eliminare l’account dalle Impostazioni, oppure scrivendoci.',
            ]}
            sections={sections}
        />
    );
}
