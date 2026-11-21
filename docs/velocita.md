# Velocità del sito

Come misurare quanto è fluido MioPersonal e i numeri da cui partiamo (Fase 0 "Fluidità").

## Come si misura

Ogni risposta del server ha l'header `Server-Timing` ([ServerTiming](../app/Http/Middleware/ServerTiming.php)):

- `app`: il tempo di tutto PHP, in millisecondi;
- `db`: il tempo passato nelle query, con quante sono.

Per vederlo sul sito vero:

1. Chrome → F12 → scheda **Network**, spuntare **Disable cache** solo per provare la prima visita.
2. Navigare come un utente normale (clic sui link, non ricaricare la pagina).
3. Cliccare la richiesta della pagina (si chiama come l'indirizzo, es. `calendario`) → scheda **Timing**: in fondo
   ci sono `app` e `db`. In alto, **Waiting for server response** è il tempo totale (rete + server).

Il tempo di un clic è circa: rete (~65 ms dall'Italia, fissa) + `app` + il disegno della pagina. Se `app` è alto la
pagina è lenta sul server; se `app` è basso ma l'attesa è lunga, è la rete o il browser.

## Da dove partiamo (21/11/2026)

Sito vero, connessione già aperta, richieste come quelle di un clic:

| Pagina                                   | Attesa totale | Di cui server (circa) |
| ---------------------------------------- | ------------- | --------------------- |
| Come funziona                            | 79 ms         | 15 ms                 |
| Ricerca trainer, palestre, corsi, eventi | 160-175 ms    | 100 ms                |
| Home (prima apertura, con SSR e TLS)     | 280-510 ms    |                       |

In locale le stesse pagine prendono 11-70 ms di server: la produzione è circa 3 volte più lenta. Le aree riservate in
locale: 13-62 ms (Clienti trainer la più lenta, 41 query); ricerca con "fascia oraria" 70 ms e 71 query.

Primo caricamento: circa 195 KB di JavaScript e 33 KB di CSS (compressi); ogni pagina aggiunge 5-25 KB la prima volta.

## La connessione al database

`db1` in `Server-Timing` è la prima query da sola: Laravel apre la connessione a PostgreSQL lì, quindi il suo tempo la
comprende. Il 21/11/2026 in produzione era 42-67 ms (le altre query 0,5-3 ms l'una): quasi metà del tempo del server.
Per un database sulla stessa macchina (`DB_HOST` 127.0.0.1) la connessione non usa più TLS
([config/database.php](../config/database.php), `sslmode`).

## Pagine aperte subito (prefetch)

I link di menu, tab bar, header e card scaricano la pagina prima del clic: al passaggio del mouse (`hoverPrefetch`)
oppure, per le tab bar dei telefoni, appena compaiono (`tabBarPrefetch`). Le regole sono in
[lib/prefetch.ts](../resources/js/lib/prefetch.ts):

- una pagina scaricata da più di 3 secondi si mostra subito e si aggiorna da sola in background;
- dopo ogni modifica (un'azione di Inertia, o una delle `fetch()` di chat, notifiche e push) le pagine scaricate si
  buttano via: nessuna può mostrare dati di prima;
- una pagina scaricata conta come visita o ricerca solo se viene mostrata (`pendingVisit`,
  [Stats](../app/Support/Stats.php)).

Quando si aggiunge qualcosa:

- **un link di navigazione** (menu, card): `prefetch={hoverPrefetch}`;
- **mai su un link che fa un'azione** (Esci, Elimina, `method="post"`…): il prefetch è una GET;
- **una modifica mandata con `fetch()`** invece che con Inertia: chiamare `forgetKeptPages()` quando riesce;
- **una pagina che conta visite o ricerche**: passare da `Stats::record…()`, che gestisce già il prefetch.

Misurato in locale (13/13 controlli end-to-end con Chrome): un clic nell'area trainer passa da circa 320 ms a 50-60 ms;
il profilo di un trainer dalla ricerca si apre in circa 80 ms.

## Obiettivi della Fase 0

- Cambio sezione dentro un'area: sotto 100 ms e senza la barra di caricamento.
- Filtri delle ricerche: sotto 250 ms sul sito vero.
- Aprire l'app dall'icona o da una notifica: nessuno schermo bianco.
- Pagine pubbliche: le foto non spostano il contenuto mentre caricano.
- Le visite ai profili nelle statistiche restano coerenti con prima.
