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

## Obiettivi della Fase 0

- Cambio sezione dentro un'area: sotto 100 ms e senza la barra di caricamento.
- Filtri delle ricerche: sotto 250 ms sul sito vero.
- Aprire l'app dall'icona o da una notifica: nessuno schermo bianco.
- Pagine pubbliche: le foto non spostano il contenuto mentre caricano.
- Le visite ai profili nelle statistiche restano coerenti con prima.
