# Istruzioni per Claude: MioPersonal

Valgono per chiunque lavori su questo repository con Claude (Alessandro e il socio), su qualsiasi PC.

## ⚠️ `main` è la produzione

**Ogni push o merge su `main` va online su miopersonal.it da solo.** Quando i test su `main` sono verdi,
GitHub Actions entra nel server e lancia [`scripts/deploy.sh`](scripts/deploy.sh). La guida completa per le
persone è [docs/deploy.md](docs/deploy.md).

## Come lavorare

1. **Mai commit o push diretti su `main`.** Si parte sempre da `main` aggiornato e si crea un branch:
    ```
    git switch main && git pull
    git switch -c nome-modifica
    ```
2. **Commit e push solo quando l'utente lo chiede.** Il push di un branch è sicuro: partono solo i test,
   nessun deploy.
3. **Prima di ogni push, gli stessi controlli di GitHub**, in locale:
    - `composer ci:check`: formattazione e lint di frontend, `.md` e `.yml` (`vp check`), tipi TypeScript,
      stile PHP (Pint), PHPStan e test. Correzioni automatiche: `npx vp check --fix` e `composer lint`;
    - `npm run build:ssr`, se la modifica tocca il frontend o l'SSR.
4. **Pull Request → test verdi → "Squash and merge".** Il merge è un deploy in produzione: guidare l'utente
   un passo alla volta, poi far controllare in GitHub → Actions prima `tests · main` e poi `deploy · main`.
5. **Dopo il merge**: `git switch main && git pull` e cancellare il branch locale.

## Migrazioni

- Solo aggiunte: tabelle nuove, colonne `nullable()` o con un default.
- Rinominare o cancellare colonne si fa in due deploy: prima il codice smette di usarle, poi una migrazione
  successiva le toglie.
- Prima di una migrazione rischiosa (cancella o modifica molti dati): avvisare l'utente e fare il backup del
  database ([docs/deploy.md](docs/deploy.md), sezione "Backup del database").

## Se qualcosa va storto

- **Deploy fallito**: correggere su un branch e rifare la Pull Request, oppure GitHub → Actions → deploy →
  Run workflow se l'errore era passeggero.
- **Sito rotto dopo un deploy**: `git revert <commit-del-merge>` su un branch e Pull Request (che fa un nuovo
  deploy).
- **Problemi al database in produzione**: fermarsi e avvisare l'utente prima di qualsiasi comando.

## Cose da non fare

- Premere **Deploy** in Ploi: è solo per le emergenze (piano Free, 5 deploy al mese).
- Modificare file direttamente sul server: il deploy successivo li sovrascrive.
- Cambiare le chiavi `VAPID_*` del `.env` di produzione: i telefoni iscritti smetterebbero di ricevere le push.
- Scrivere segreti in chat o nei file del repository. Dal `.env` mostrare solo i nomi delle variabili, mai i
  valori.

## Il progetto in breve

- Laravel (PHP 8.4) + Inertia + React, con SSR per le pagine pubbliche. In locale gira con Laravel Herd su
  `http://miopersonal.test`: `composer run dev`.
- Dati finti in locale: `php artisan migrate:fresh --seed` (cancella solo il database locale).
- I testi del sito sono in italiano; i messaggi di commit in inglese, una riga chiara su cosa cambia per chi
  usa il sito.
