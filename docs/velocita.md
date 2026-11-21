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
Misurati con Sentry, come in produzione, erano 283 KB di JavaScript: i numeri di oggi sono in "Rifiniture (fase 5a)".

## La connessione al database

`db1` in `Server-Timing` è la prima query da sola: Laravel apre la connessione a PostgreSQL lì, quindi il suo tempo la
comprende. Il 21/11/2026 in produzione era 42-67 ms (le altre query 0,5-3 ms l'una): quasi metà del tempo del server.
Per un database sulla stessa macchina (`DB_HOST` 127.0.0.1) ([config/database.php](../config/database.php)):

- la connessione non usa più TLS (`sslmode`): `db1` da 42-67 a 30-47 ms;
- ogni processo PHP tiene la sua connessione per le pagine successive (`PDO::ATTR_PERSISTENT`): dopo la prima pagina di
  ogni processo `db1` è circa 1 ms. Per spegnerle: `DB_PERSISTENT=false` nel `.env`.

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

## Foto

Ogni foto pubblica ha tre copie WebP ([SafeImage](../app/Support/SafeImage.php), `VARIANTS`): `sm` 320 px per gli
avatar, `md` 800 px per le card, `lg` 1600 px per la foto principale e le gallerie. Le fa un job in coda dopo il
caricamento; il comando `photos:variants`, ogni ora, fa quelle mancanti e cancella quelle rimaste senza originale.
Una card in produzione: da 84 KB (JPEG) a 22 KB.

## Obiettivi e risultati della Fase 0 (21/11/2026)

| Obiettivo                                                     | Risultato                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Cambio sezione dentro un'area: sotto 100 ms, senza barra      | 50-60 ms dalla cache (prima circa 320 ms in locale)                 |
| Filtri delle ricerche: sotto 250 ms sul sito vero             | 96-145 ms                                                           |
| Aprire l'app dall'icona o da una notifica: niente bianco      | sfondo scuro prima del JavaScript, avvio della PWA scuro            |
| Pagine pubbliche: foto leggere, che non spostano il contenuto | card 84 → 22 KB; i riquadri hanno già proporzioni fisse             |
| Visite ai profili coerenti con prima                          | il prefetch conta solo se la pagina viene mostrata (`pendingVisit`) |

Tempo di PHP in produzione, prima e dopo: palestre 86-127 → 45 ms, ricerca trainer 119-145 → 65 ms, corsi 100 →
48-60 ms, profilo di un trainer 255-315 → 134 ms.

Le View Transitions (dissolvenza tra le pagine) sono state scartate: con un cambio pagina di 50 ms, un'animazione di
150-250 ms lo farebbe sembrare più lento.

## Pronti a crescere (fasi 1-2)

- **Lazy loading vietato fuori dalla produzione** (`Model::preventLazyLoading()`): in locale e nei test una relazione
  letta in un ciclo senza `with()` (una query per riga, N+1) si ferma con un errore. Ha trovato le segnalazioni
  dell'admin e la ricerca per data e fascia.
- **Test anche su PostgreSQL** (job `pgsql` di `tests.yml`): le parti delle migrazioni solo per PostgreSQL (i vincoli
  contro le doppie prenotazioni) ora girano nei test.
- **Indici su tutte le foreign key** (45, migrazione `add_indexes_to_foreign_keys`): oggi non cambia nulla, con molti
  dati evita che pagine e cancellazioni di account leggano tabelle intere.
- **Ricerca per data e fascia**: gli slot di tutti i candidati in poche query (`TrainerSlots::daysForMany()`), non
  cinque per trainer. In locale da 71 a 24 query, e il numero resta lo stesso con più trainer (test in
  `TrainerSearchTest`).
- **Profilo di un trainer** (134 ms in produzione): misurato pezzo per pezzo, non c'è un collo di bottiglia (query in
  tutto circa 20 ms, slot del calendario 7 ms, trainer simili 8 ms…). Lasciato così: si precarica già al passaggio del
  mouse.

## Rifiniture (fase 5a)

JavaScript della prima pagina, compresso (gzip), misurato come in produzione cioè con un `VITE_SENTRY_DSN`
(`VITE_SENTRY_DSN=https://abc@o1.ingest.de.sentry.io/1 npx vp build`; senza DSN il build toglie Sentry e i numeri
sembrano più bassi). "In tutto" è la somma dei file che la prima pagina scarica:

|                                 | Chunk `app` | In tutto |
| ------------------------------- | ----------- | -------- |
| Prima                           | 81 KB       | 283 KB   |
| Sentry caricato dopo la pagina  | 49 KB       | 252 KB   |
| Layout delle aree con le pagine | 33 KB       | 230 KB   |

- **Sentry dopo la pagina** ([lib/sentry.ts](../resources/js/lib/sentry.ts)): parte subito dopo l'avvio, in un file a
  parte di 31 KB ([lib/sentry-client.ts](../resources/js/lib/sentry-client.ts)); gli errori di quei primi istanti
  aspettano in una piccola coda. Il messaggio "Qualcosa è andato storto" è nostro
  ([AppErrorBoundary](../resources/js/components/app-error-boundary.tsx)). Senza DSN nessun file di Sentry.
- **Layout delle aree** ([lib/inertia-config.tsx](../resources/js/lib/inertia-config.tsx)): trainer, palestra, admin e
  cliente arrivano insieme alla loro pagina (`resolve()`), che si mostra solo quando ci sono tutti e due: nessun
  lampo vuoto, e il prefetch li scarica insieme. Il layout pubblico resta nel primo file, perché le pagine con SSR
  devono essere disegnate subito uguali dal server e dal browser.
- **Schede aperte durante un deploy** ([lib/stale-build.ts](../resources/js/lib/stale-build.ts)): se una pagina chiede
  un file del build vecchio, la scheda si ricarica una volta (al massimo una ogni 10 secondi).
- **Foto del login su telefono**: 129 → 78 KB, stesso aspetto.
- **Pagina offline** ([offline.html](../public/offline.html), servita da [sw.js](../public/sw.js)): senza connessione,
  una pagina scura "Sei offline" con "Riprova" al posto dell'errore del browser.

Regole:

- **Errori da segnalare a mano**: `reportError()` di `lib/sentry.ts`, mai `import … from '@sentry/react'` (rimetterebbe
  Sentry nel primo file).
- **Un layout nuovo per un'area privata**: in `areaLayouts` di `inertia-config.tsx`, non importato in cima al file.
- **`offline.html` è l'unica cosa nella cache del service worker**: le pagine private sono `no-store` e una pagina di
  prenotazioni vecchia sarebbe peggio di nessuna pagina.
- **Se `offline.html` cambia**, cambiare anche il nome della cache in `sw.js` (`offline-v1` → `offline-v2`…): il
  service worker nuovo butta via quella vecchia.
- **`/sw.js` e Cloudflare**: in produzione `/sw.js` esce con `Cache-Control: max-age=14400` e Cloudflare lo tiene in
  cache fino a 4 ore. Il browser per `sw.js` salta già la propria cache, quindi il problema è solo Cloudflare: serve
  una regola "Bypass cache" per `/sw.js`, oppure, dopo un deploy che tocca `sw.js`, un purge di
  `https://miopersonal.it/sw.js` (Cloudflare → Caching → Configuration → Custom Purge). Senza, telefoni e app
  installate prendono il service worker nuovo fino a 4 ore dopo.
