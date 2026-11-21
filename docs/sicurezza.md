# Sicurezza delle pagine

## Chi può toccare un record: le Policy

Ogni indirizzo privato con l'ID di un record (una prenotazione, un cliente, una foto, un corso…) controlla che il record
sia di chi lo apre con una Policy di [app/Policies](../app/Policies): `Gate::authorize('asClient', $booking)`,
`'asTrainer'`, `'asGym'`. Se il record è di un altro la risposta è **404**, come se non esistesse (un 403 direbbe che
l'ID è vero). Le regole comuni sono in [ChecksOwnership](../app/Policies/Concerns/ChecksOwnership.php); i test sono
`tests/Unit/OwnershipPoliciesTest` e `tests/Feature/OwnershipTest`.

Quando si aggiunge qualcosa:

- **una rotta privata con un `{record}`**: `Gate::authorize(...)` come prima riga, prima di validare o salvare, e una
  riga in `OwnershipTest` con l'utente sbagliato;
- **un modello nuovo di proprietà di qualcuno**: la sua `…Policy` in `app/Policies` (Laravel la trova da solo dal nome);
- **un figlio di un record già controllato** (la nota di un cliente, la foto di un corso): basta verificare che
  appartenga al padre, come fanno già i controller;
- **le regole che non sono di proprietà** (profilo approvato, evento nascosto, seduta già passata) restano nei controller.

Le decisioni dell'admin su trainer e palestre rileggono il profilo bloccato (`lockForUpdate()`): due admin che
decidono nello stesso momento fanno una sola decisione e una sola email.

## Content-Security-Policy

La Content-Security-Policy (CSP) dice al browser da dove una pagina può caricare script, stili, immagini e
connessioni. Se un giorno qualcuno riuscisse a infilare uno script nel sito (per esempio in un testo scritto da un
utente), il browser si rifiuterebbe di eseguirlo.

### A che punto siamo

| Header                                | Cosa fa                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `Content-Security-Policy`             | blocca davvero, ma solo `frame-ancestors 'none'` (nessuno ci mette in un frame) |
| `Content-Security-Policy-Report-Only` | la policy completa: **non blocca nulla**, segnala cosa bloccherebbe             |

La policy è in [ContentSecurityPolicy](../app/Support/ContentSecurityPolicy.php) e la manda
[SecurityHeaders](../app/Http/Middleware/SecurityHeaders.php), solo sulle pagine HTML. Ogni richiesta ha il suo
`nonce`, lo stesso che Vite mette sui suoi tag `<script>` (`Vite::useCspNonce()`).

Cosa è permesso:

| Cosa        | Da dove                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| Script      | il nostro build; gli inline solo con il nonce; il beacon di Cloudflare Web Analytics   |
| Stili       | i nostri e gli inline (sfondo in `app.blade.php`, `style={…}` di React, Radix, sonner) |
| Immagini    | le nostre, `data:` e `blob:` (anteprime delle foto, crop, story image)                 |
| Connessioni | le nostre, Sentry (`*.ingest.de.sentry.io`), Cloudflare (`cloudflareinsights.com`)     |
| Altro       | nessun plugin (`object-src 'none'`), `<base>` e form solo verso di noi                 |

I dati della pagina Inertia e il JSON-LD della SEO sono `<script type="application/json">`: il browser non li esegue,
quindi non servono nonce. In locale, con `npm run dev`, è permesso anche il dev server di Vite.

### Le segnalazioni

Il browser manda ogni violazione a `POST /csp-report`
([CspReportController](../app/Http/Controllers/CspReportController.php)), fuori dal gruppo web: niente sessione,
cookie, CSRF o visite contate, al massimo 30 al minuto per indirizzo. Ogni violazione diversa finisce **una volta al
giorno** in `storage/logs/csp-AAAA-MM-GG.log` (14 giorni), senza IP né utente, con gli indirizzi senza query string e
con i token tolti (`/reset-password/{token}`).

Per leggerle in produzione (via SSH, utente `ploi`):

```
tail -n 50 /home/ploi/miopersonal.it/storage/logs/csp-$(date +%F).log
```

In locale Herd aggiunge due script inline suoi (`__HERD_EARLY_ERRORS__`) a ogni pagina: in console compaiono come
avvisi "[Report Only]" e finiscono nel log locale. Sono di Herd, non del sito, e in produzione non ci sono.

### Dalla segnalazione al blocco

1. Lasciare girare la versione Report-Only in produzione almeno una o due settimane, con visite vere da telefoni,
   desktop e app installata.
2. Leggere i log: ogni riga è una cosa nostra da permettere (aggiungerla in `ContentSecurityPolicy`) o una cosa
   estranea (estensioni del browser, script iniettati da Cloudflare) da lasciare fuori.
3. Quando per qualche giorno non arriva più nulla di nostro: in `SecurityHeaders` mandare la policy come
   `Content-Security-Policy` (aggiungendo `frame-ancestors 'none'`), **da sola in un deploy**, e controllare subito il
   sito vero in tutte le aree. Se qualcosa si rompe: `git revert` di quel commit.

Quando si aggiunge qualcosa al sito:

- **uno script o un servizio esterno nuovo** (mappe, pagamenti, video): aggiungere il suo dominio nella direttiva
  giusta, altrimenti dopo il passo 3 verrà bloccato;
- **mai `<script>` inline senza `nonce="{{ Vite::cspNonce() }}"`**, mai `eval()` o `new Function()`;
- **un `<iframe>`** (YouTube, mappe): serve `frame-src` con il suo dominio.
