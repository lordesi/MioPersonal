# Deploy: come arriva una modifica su miopersonal.it

**Un push su `main` va in produzione.** Quando i test su `main` finiscono verdi, GitHub entra nel server
e aggiorna il sito da solo, in circa 2–4 minuti. Per questo su `main` arriva solo codice passato da una
Pull Request.

```
branch → push → test ✅ → Pull Request → merge su main → test ✅ → deploy → sito aggiornato
```

## Cosa fare per ogni modifica

### 1. Partire sempre da `main` aggiornato

```
git switch main
git pull
git switch -c nome-modifica        # es. chat-allegati, fix-prenotazioni
```

### 2. Sviluppare e provare in locale

```
composer run dev                   # sito su http://miopersonal.test
```

- Per ricreare i dati finti: `php artisan migrate:fresh --seed`. Cancella **solo** il database locale.
- Per provarlo dal telefono: `herd share`.

### 3. Prima del push: gli stessi controlli di GitHub

```
composer ci:check                  # test, stile, tipi
npm run build:ssr                  # il build di produzione deve riuscire
```

### 4. Push del branch

```
git add -A
git commit -m "Descrizione chiara della modifica"
git push -u origin nome-modifica
```

GitHub fa girare i test. Il sito non cambia.

### 5. Pull Request

1. Su GitHub: **Compare & pull request**, con una descrizione di cosa cambia e di come provarlo.
2. Il socio legge le modifiche. Se vuole provarle sul suo PC: `git fetch && git switch nome-modifica`.
3. Aspettate che i test siano verdi ✅.

### 6. Merge = deploy

1. **Merge pull request**: parte il deploy automatico.
2. Lo seguite in GitHub → **Actions** → **deploy**.
3. Alla fine controllate il sito: la pagina modificata, [`/up`](https://miopersonal.it/up) e il login.

### 7. Se qualcosa va storto

- **Il deploy è fallito** (❌ in Actions): GitHub vi manda un'email. Aprite il log del job per vedere il
  passo che si è fermato. Lo script si ferma al primo errore: il sito resta com'era o quasi. Correggete su un
  branch e rifate la Pull Request. Se l'errore era passeggero (rete, GitHub), basta **Actions → deploy →
  Run workflow** su `main`.
- **Il deploy è riuscito ma il sito ha un problema**: tornate alla versione precedente con un nuovo deploy.
    ```
    git switch main && git pull
    git revert <commit-del-merge> -m 1
    git push
    ```
- **Una migrazione ha fatto danni**: fermatevi. Non lanciate altri comandi sul database: serve il backup
  (sotto).

## Regole per le migrazioni

- Aggiungere colonne o tabelle va bene. Le nuove colonne devono essere `nullable()` o avere un default.
- Rinominare o cancellare colonne si fa **in due deploy**: prima il codice smette di usarle, poi in un deploy
  successivo la migrazione le toglie.
- Mai una migrazione che modifica molti dati senza averla provata in locale sui dati demo.
- Prima di una migrazione rischiosa: backup del database (sotto).

## Cose da non fare

- Push diretto su `main` di una modifica non provata.
- Lanciare il deploy di Ploi senza motivo: consuma uno dei 5 deploy del mese. È solo per le emergenze.
- Modificare file direttamente sul server: il deploy successivo li sovrascrive.
- Cambiare le chiavi `VAPID_*` nel `.env`: i telefoni già iscritti smetterebbero di ricevere le push.

## Come funziona

| Pezzo | Cosa fa |
|---|---|
| [`.github/workflows/tests.yml`](../.github/workflows/tests.yml) | Test, stile, tipi e build SSR su ogni push di ogni branch |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Dopo i test verdi su `main` entra nel server via SSH e lancia lo script; poi controlla `/up`. Un deploy alla volta |
| [`scripts/deploy.sh`](../scripts/deploy.sh) | Lo script che gira sul server (sotto) |

Lo script, sul server come utente `ploi`, nella cartella `/home/ploi/miopersonal.it`:

1. blocca i deploy concorrenti e si ferma al primo errore;
2. `git fetch` e `git reset --hard` sul commit che ha passato i test (solo commit di `main`; un commit più
   vecchio di quello online viene saltato);
3. `composer install --no-dev --optimize-autoloader`;
4. `optimize:clear`, poi `migrate --force`;
5. `npm ci`, poi `npm run build:ssr`;
6. `optimize`, `storage:link`, `queue:restart`, `inertia:stop-ssr` (il daemon lo fa ripartire col codice
   nuovo), ricarica di PHP-FPM;
7. scrive ora, commit ed esito in `/home/ploi/deploys.log`.

Lo script arriva al server **dal commit che si sta pubblicando** (via SSH, non dal file già sul server).
Per vedere gli ultimi deploy: `tail /home/ploi/deploys.log`.

### Sul server e su GitHub (fatto il 13/11/2026)

| Cosa | Dove |
|---|---|
| Chiave di GitHub Actions per entrare nel server | Ploi → server → SSH keys → **GitHub Actions deploy**. Per revocarla: eliminatela lì |
| Secret `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_SSH_KEY` | GitHub → Settings → Environments → **production** (usabile solo da `main`) |
| Chiave del server per scaricare il codice (sola lettura) | GitHub → Settings → Deploy keys → **Server produzione**; sul server `~/.ssh/github_deploy` |
| Worker della coda | Ploi → server → Queue (`queue:work database`) |
| Scheduler (`schedule:run` ogni minuto) | Ploi → server → Cronjobs |
| Server SSR (`php8.4 artisan inertia:start-ssr`) | Ploi → Daemons, cartella del sito, utente `ploi` |

`DEPLOY_KNOWN_HOSTS` è l'impronta del server: se un giorno il server viene reinstallato cambia, e il deploy
si rifiuta di collegarsi. Si rigenera dal server con:

```
echo "2.28.40.245 $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
```

### Il bottone di Ploi (solo emergenza)

Lo script di deploy in Ploi fa la stessa cosa di GitHub, sull'ultimo commit di `main`:

```
cd /home/ploi/miopersonal.it
git fetch origin main
git show origin/main:scripts/deploy.sh | bash -s -- "$(git rev-parse origin/main)"
```

Usatelo solo se GitHub Actions non funziona: consuma uno dei 5 deploy del mese.

## Backup del database

Prima di un rilascio delicato. Sul server (`ssh ploi@2.28.40.245`):

```
cd /home/ploi/miopersonal.it && mkdir -p ~/backups
set -a; . <(grep -E '^DB_(HOST|PORT|DATABASE|USERNAME|PASSWORD)=' .env); set +a
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USERNAME" -Fc \
  -f ~/backups/miopersonal-$(date +%F-%H%M).dump "$DB_DATABASE"
ls -lh ~/backups
```

Poi copiatelo sul PC, da PowerShell (senza essere collegati al server):

```
scp ploi@2.28.40.245:backups/miopersonal-AAAA-MM-GG-HHMM.dump .
```

Il file contiene i dati veri degli utenti: tenetelo in un posto sicuro e cancellatelo quando non serve più.
Per ripristinarlo **chiamatevi prima**: `pg_restore --clean` sostituisce il database.
