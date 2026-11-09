# Staging: la copia di prova del sito

`staging.miopersonal.it` è una seconda copia di MioPersonal, con un database suo e dati finti, dove si prova
ogni modifica **prima** di pubblicarla. Il flusso con il socio diventa:

1. push su `main`;
2. deploy di **staging** (da Ploi) e prova;
3. se va bene, deploy di **produzione** (da Ploi).

Il codice protegge già da solo la copia di prova (basta `APP_ENV=staging`):

| Cosa                | Come                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Chiuso da password  | Utente e password (`STAGING_USER`, `STAGING_PASSWORD`). Se mancano, il sito resta chiuso. |
| Non indicizzato     | Header `X-Robots-Tag: noindex` e `robots.txt` con `Disallow: /`.                          |
| Email intrappolate  | Qualunque `MAIL_MAILER` ci sia nel `.env`, le email vanno solo in `storage/logs`.         |
| Non confondibile    | In basso a sinistra c'è la scritta **STAGING · dati finti**.                              |
| Dati finti          | `php artisan staging:reset` rifà il database con trainer, palestre e account di prova.    |
| Reset sicuro        | `staging:reset` si rifiuta di girare se non è staging: non può cancellare la produzione.  |

## Una volta sola, su Ploi

1. **DNS**: aggiungi un record `A` per `staging` che punta allo stesso server di `miopersonal.it`.
2. **Sito**: crea il sito `staging.miopersonal.it` (stesso server, stessa versione di PHP della produzione),
   repository `main`, e attiva **SSL** (Let's Encrypt).
3. **Database**: crea un database **nuovo** con un utente suo (es. `miopersonal_staging`). Mai lo stesso
   della produzione: `staging:reset` lo svuota.
4. **`.env`**: parti da [`.env.staging.example`](../.env.staging.example). Cambia `APP_KEY` (`php artisan key:generate`),
   la password del database e `STAGING_PASSWORD`.
5. **Script di deploy**: lo stesso della produzione. Per ora non serve l'SSR su staging: lascia
   `npm run build`.
6. **Primo avvio** (nel terminale del sito):
    ```
    php artisan migrate --force
    php artisan staging:reset
    ```
7. **Coda e scheduler**: come in produzione, un **worker** (`php artisan queue:work`) e il **cron**
   di `php artisan schedule:run` ogni minuto. Servono per provare le sincronizzazioni con Google Calendar e i
   promemoria.
8. **Controlla**: aprendo il sito deve chiedere utente e password, mostrare la scritta STAGING, e
   `https://staging.miopersonal.it/robots.txt` deve dire `Disallow: /`.

> Su Ploi puoi anche attivare la protezione con password del sito (_Security → Basic authentication_): è
> in più, quella del codice resta come rete di sicurezza.

## Account di prova

Tutti con password `password`.

| Chi         | Email                              |
| ----------- | ---------------------------------- |
| Admin       | `admin@staging.miopersonal.test`   |
| Cliente     | `cliente@staging.miopersonal.test` |
| Trainer     | `giulia-rossi@demo.miopersonal.test` (con sedute e pacchetto) |
| Altri trainer e palestre | `…@demo.miopersonal.test` |

L'admin deve confermare di nuovo la password per aprire `/admin` (come in produzione).

## Cosa non è finto (da sapere)

- **Google (login e Calendar)**: usa le stesse credenziali della produzione solo se aggiungi
  `https://staging.miopersonal.it/auth/google/callback` e
  `https://staging.miopersonal.it/area-trainer/calendario-google/callback` tra i redirect autorizzati del client Google.
  Finché l'app Google è in modalità test, funziona solo per gli account di prova autorizzati (aggiungi i tuoi).
- **Instagram, TikTok, Facebook, YouTube, VAPID (push)**: lascia le chiavi **vuote** su staging. Senza chiavi i
  pulsanti non compaiono e non parte nulla.
- **Pagamenti** (quando ci saranno): solo chiavi di test.

## Dati veri su staging

Non copiare il database di produzione su staging: ci sono dati personali di persone vere. Se un giorno servisse
per riprodurre un problema, copialo solo dopo averlo reso anonimo (nomi, email, telefoni) e cancellalo subito
dopo.

## Rifare i dati finti

```
php artisan staging:reset
```

Cancella tutto il database di staging e lo riempie di nuovo. Si può lanciare quando vuoi.
