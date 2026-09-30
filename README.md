# MioPersonal

Piattaforma web che mette in contatto clienti e personal trainer.

Questo README spiega come installare il progetto sul tuo computer, **partendo da zero**.
Segui i passi **nell'ordine**, uno alla volta. Se un passo non dà il risultato descritto, **fermati** e segnalalo: meglio correggere subito che accumulare problemi.

---

## Indice

1. [Cosa installeremo](#1-cosa-installeremo)
2. [Installare Git](#2-installare-git)
3. [Installare Laravel Herd (PHP e Composer)](#3-installare-laravel-herd-php-e-composer)
4. [Installare Node.js](#4-installare-nodejs)
5. [Installare PostgreSQL](#5-installare-postgresql)
6. [Controllo finale degli strumenti](#6-controllo-finale-degli-strumenti)
7. [Creare il database del progetto](#7-creare-il-database-del-progetto)
8. [Scaricare il progetto da GitHub](#8-scaricare-il-progetto-da-github)
9. [Configurare e avviare il progetto](#9-configurare-e-avviare-il-progetto)
10. [Registrare un utente di prova](#10-registrare-un-utente-di-prova)
11. [Lavoro di tutti i giorni](#11-lavoro-di-tutti-i-giorni)
12. [Problemi comuni](#12-problemi-comuni)
13. [Regole del progetto](#13-regole-del-progetto)

---

## 1. Cosa installeremo

| Strumento        | A cosa serve                                                   | Versione   |
| ---------------- | -------------------------------------------------------------- | ---------- |
| **Git**          | Scaricare il codice e salvare le modifiche su GitHub           | Ultima     |
| **VS Code**      | L'editor in cui scriviamo il codice                            | Ultima     |
| **Laravel Herd** | Installa PHP, Composer e Laravel; fa girare il sito sul tuo PC | Ultima     |
| **Node.js**      | Serve a compilare la parte React (frontend)                    | **22 LTS** |
| **PostgreSQL**   | Il database                                                    | **18**     |

Usiamo **le stesse versioni** sui due computer. Se le versioni sono diverse, prima o poi qualcosa funzionerà su un PC e non sull'altro.

### Come si apre il terminale

Molti passi si fanno scrivendo comandi nel **terminale**.

- **PowerShell**: premi il tasto Windows, scrivi `PowerShell`, premi Invio.
- **Terminale di VS Code**: menu **Terminale → Nuovo terminale**. Si apre in basso.

Scrivi un comando alla volta e premi **Invio** dopo ciascuno.

> ⚠️ **Regola importante**: dopo aver installato un programma, **chiudi il terminale e aprine uno nuovo**. Un terminale già aperto non "vede" i programmi installati dopo la sua apertura.

---

## 2. Installare Git

1. Vai su **git-scm.com** e scarica la versione per Windows.
2. Installa lasciando **tutte le opzioni predefinite**.
3. Apri un nuovo PowerShell e verifica:
    ```
    git --version
    ```
    Deve rispondere con qualcosa come `git version 2.54.0.windows.1`.

### Configura il tuo nome e la tua email

Git "firma" ogni modifica con nome ed email. Scrivi (con i tuoi dati):

```
git config --global user.name "Il tuo nome"
git config --global user.email "la-tua-email@esempio.com"
```

> Se vuoi tenere privata la tua email, su GitHub vai in **Settings → Emails**, attiva _Keep my email addresses private_ e usa l'indirizzo `...@users.noreply.github.com` che ti propone.

---

## 3. Installare Laravel Herd (PHP e Composer)

Herd installa in un colpo solo **PHP**, **Composer** (che scarica le librerie PHP) e il comando **laravel**.

1. Vai su **herd.laravel.com** e scarica la versione per **Windows**.
2. Avvia il file `.exe` e rispondi **Sì** alla richiesta di permessi.
3. Durante la configurazione ti chiederà **"Choose your site folder"**: è la cartella dove terrai i progetti. Va bene quella proposta (`C:\Users\<tuo nome>\Herd`).
   Ogni sottocartella diventa un sito raggiungibile dal browser: la cartella `miopersonal` diventerà `http://miopersonal.test`.
4. La versione gratuita basta: non serve Herd Pro.
5. Se Herd propone di installare o gestire **Node.js**, **salta** quel passaggio: Node lo installiamo a parte (passo 4). Avere due installazioni di Node crea conflitti.

Chiudi e riapri PowerShell, poi verifica:

```
php -v
composer --version
laravel --version
```

Devono rispondere tutti e tre con un numero di versione. PHP deve essere **8.4**.

---

## 4. Installare Node.js

1. Installa **Node.js 22 LTS** (dal sito **nodejs.org** oppure dal terminale di VS Code, come preferisci).
2. Chiudi e riapri il terminale, poi verifica:
    ```
    node -v
    npm -v
    ```
    `node -v` deve rispondere con `v22.` seguito da altri numeri.

Deve esserci **una sola installazione** di Node sul PC.

---

## 5. Installare PostgreSQL

### Scaricare

1. Vai su **postgresql.org/download/windows** e clicca **Download the installer**.
2. Scegli la versione **18**, colonna **Windows x86-64**.

### Installare

Avvia il file scaricato e segui le schermate:

| Schermata              | Cosa fare                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Installation Directory | Lascia il percorso proposto                                                                                                            |
| Select Components      | Lascia **PostgreSQL Server** e **Command Line Tools**. Togli **Stack Builder**. pgAdmin è facoltativo                                  |
| Data Directory         | Lascia il percorso proposto                                                                                                            |
| **Password**           | Scegli la password dell'amministratore `postgres`. **Salvala subito** in un posto sicuro. Mai scriverla in chat o in file del progetto |
| Port                   | Lascia `5432`                                                                                                                          |
| Locale                 | Lascia _Default locale_                                                                                                                |

Alla fine, se c'è la spunta per avviare Stack Builder, toglila e clicca **Finish**.

### Verificare che il database sia acceso

PostgreSQL gira in background come **servizio di Windows**.

1. Premi **Windows + R**, scrivi `services.msc`, premi Invio.
2. Cerca **postgresql-x64-18**: nella colonna **Stato** deve esserci _In esecuzione_.

### Rendere raggiungibile il comando `psql`

`psql` è il programma per parlare col database dal terminale. Per usarlo scrivendo solo `psql`, aggiungiamo la sua cartella al **PATH** (l'elenco di cartelle in cui Windows cerca i programmi).

1. Premi il tasto Windows e scrivi `variabili d'ambiente`.
2. Scegli **Modifica le variabili d'ambiente relative al tuo account**.
3. Nella parte **in alto** ("Variabili utente per..."), clicca **una volta** sulla riga **Path** e poi su **Modifica...**
4. Clicca **Nuovo** e incolla:
    ```
    C:\Program Files\PostgreSQL\18\bin
    ```
5. Clicca **OK** e di nuovo **OK**.

> ⚠️ Usa **Modifica...**, non **Nuova...**. Creare una nuova variabile `Path` sostituirebbe quella esistente, dove Herd ha salvato il percorso di PHP: `php` smetterebbe di funzionare.
> Solo se la riga `Path` in alto **non esiste proprio**, usa **Nuova...** con nome `Path` e valore `C:\Program Files\PostgreSQL\18\bin`.

Chiudi e riapri PowerShell, poi verifica:

```
psql --version
```

Deve rispondere `psql (PostgreSQL) 18.x`.

---

## 6. Controllo finale degli strumenti

In un PowerShell **nuovo**, lancia questi comandi uno alla volta:

```
git --version
php -v
composer --version
laravel --version
node -v
npm -v
psql --version
```

Tutti devono rispondere con un numero di versione. Se uno risponde _"is not recognized"_, guarda la sezione [Problemi comuni](#12-problemi-comuni).

---

## 7. Creare il database del progetto

Ognuno di noi ha il **proprio database sul proprio PC**. Non condividiamo un database: condividiamo le **istruzioni per costruirlo** (le _migration_, file nel repository).

Creiamo un database `miopersonal` e un utente dedicato `miopersonal`. L'app non usa l'amministratore `postgres`: ha solo i permessi sul proprio database.

### Collegarsi come amministratore

```
psql -U postgres
```

Inserisci la password di `postgres`. **Mentre la scrivi non compare nulla**, nemmeno gli asterischi: è normale.

Se compare un avviso sulla _"console code page"_, ignoralo. Quando sei dentro, il prompt diventa `postgres=#`.

### Creare utente e database

Scegli una **nuova password** per l'utente `miopersonal` (diversa da quella di `postgres`) e annotala: ti servirà nel passo 9.

Scrivi questi due comandi, uno alla volta, mettendo la tua password tra gli **apici singoli**:

```
CREATE USER miopersonal WITH PASSWORD 'scegli-una-password';
CREATE DATABASE miopersonal OWNER miopersonal;
```

Le risposte attese sono `CREATE ROLE` e `CREATE DATABASE`.

> Ogni comando SQL finisce con il **punto e virgola**. Se lo dimentichi, il prompt diventa `postgres-#` e aspetta: scrivi `;` e premi Invio.

Esci con:

```
\q
```

### Verificare

Collegati con il nuovo utente:

```
psql -U miopersonal -d miopersonal -h localhost
```

Inserisci la password di `miopersonal`. Se il prompt diventa `miopersonal=>`, è tutto a posto. Esci con `\q`.

---

## 8. Scaricare il progetto da GitHub

### Accesso al repository

Il repository è `https://github.com/lordesi/MioPersonal`. Per accedervi devi essere **collaboratore**: riceverai un invito via email da GitHub. **Accettalo** prima di continuare.

### Clonare dentro la cartella di Herd

In PowerShell:

```
cd ~\Herd
git clone https://github.com/lordesi/MioPersonal.git miopersonal
cd miopersonal
```

- `cd ~\Herd` entra nella cartella dei siti di Herd (`~` è la tua cartella utente).
- `git clone ... miopersonal` scarica il progetto nella cartella `miopersonal`, **tutto minuscolo**: così l'indirizzo sarà `http://miopersonal.test`.
- La prima volta potrebbe aprirsi il browser per **accedere a GitHub**: accedi e autorizza.

> ⚠️ Il progetto **deve** stare dentro la cartella di Herd, altrimenti `miopersonal.test` non funziona.

Apri il progetto in VS Code:

```
code .
```

(Se `code` non viene riconosciuto: apri VS Code e usa **File → Apri cartella...**)

---

## 9. Configurare e avviare il progetto

Da qui in poi usa il **terminale di VS Code** (**Terminale → Nuovo terminale**). Controlla che il percorso nel prompt finisca con `\Herd\miopersonal>`.

### 9.1 Scaricare le librerie PHP

```
composer install
```

Scarica le librerie PHP nella cartella `vendor/`. Ci vuole qualche minuto.

### 9.2 Scaricare le librerie JavaScript

```
npm install
```

Scarica le librerie del frontend (React, Vite...) nella cartella `node_modules/`.

> `vendor/` e `node_modules/` **non sono su GitHub**: ognuno le scarica sul proprio PC con questi due comandi.

### 9.3 Creare il file delle impostazioni `.env`

```
copy .env.example .env
php artisan key:generate
```

- Il primo comando crea il tuo `.env` partendo dal modello `.env.example`.
- Il secondo genera la **chiave segreta** dell'app e la scrive nel `.env`.

> 🔒 Il file `.env` contiene password e chiavi. **Non va mai su GitHub** (Git lo ignora già in automatico) e non va mai incollato in chat.

### 9.4 Collegare il progetto al database

Apri il file `.env` in VS Code e fai in modo che le righe `DB_` siano **esattamente** così:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=miopersonal
DB_USERNAME=miopersonal
DB_PASSWORD=la-password-di-miopersonal
```

- La password è quella dell'utente **`miopersonal`** (passo 7), **non** quella di `postgres`.
- Se una riga inizia con `#`, cancella il `#` (altrimenti è un commento e viene ignorata).
- Se la password contiene spazi o `#`, mettila tra virgolette doppie: `DB_PASSWORD="abc #123"`.

Salva con **Ctrl + S**.

### 9.5 Creare le tabelle

```
php artisan migrate
```

Esegue le _migration_, cioè crea le tabelle nel tuo database. Devi vedere un elenco di righe con **DONE**.

### 9.6 Avviare il frontend

```
npm run dev
```

Avvia **Vite**, che traduce il codice React/TypeScript in JavaScript per il browser e aggiorna la pagina a ogni salvataggio.

- Il terminale resta "occupato": è normale. **Lascialo aperto** mentre lavori.
- Per altri comandi apri un **secondo terminale** con il **+** in alto a destra nel pannello del terminale.
- Per spegnere Vite: **Ctrl + C** nel suo terminale.
- Vite mostra anche un indirizzo tipo `http://localhost:5173`: **non aprirlo**, non è il sito.

### 9.7 Aprire il sito

Nel browser vai su:

```
http://miopersonal.test
```

Devi vedere la pagina di benvenuto con **Log in** e **Register** in alto. 🎉

---

## 10. Registrare un utente di prova

1. Clicca **Register** e crea un account inventato (es. `test@example.com`).
2. Comparirà la pagina **Email verification**: in locale le email **non vengono inviate davvero**, ma scritte in un file di log.

### Trovare il link di verifica

1. In VS Code apri `storage/logs/laravel.log`.
2. Vai in fondo al file con **Ctrl + Fine**.
3. Cerca (**Ctrl + F**) il testo `email/verify`.
4. Copia il link **completo** (inizia con `http://miopersonal.test/email/verify/`) e aprilo nel browser.

Arriverai alla **Dashboard**. ✅

### Se il link non funziona

Nel log il link a volte appare "rotto" (con `=3D` al posto di `=`, o spezzato su due righe). In quel caso segna l'email come verificata direttamente nel database:

```
psql -U miopersonal -d miopersonal -h localhost -c "update users set email_verified_at = now() where email = 'test@example.com';"
```

La risposta `UPDATE 1` conferma. Ricarica la pagina nel browser.

> Questa scorciatoia va bene **solo in locale** con utenti di prova.

---

## 11. Lavoro di tutti i giorni

### Quando inizi a lavorare

Nel terminale di VS Code, dentro il progetto:

```
git pull
```

Scarica le modifiche fatte dall'altro. Poi, **se sono cambiate** queste cose:

| Cosa è cambiato                                          | Comando da lanciare   |
| -------------------------------------------------------- | --------------------- |
| File in `database/migrations/` (nuove tabelle o colonne) | `php artisan migrate` |
| `composer.json` o `composer.lock` (nuove librerie PHP)   | `composer install`    |
| `package.json` o `package-lock.json` (nuove librerie JS) | `npm install`         |

Nel dubbio, lanciali tutti e tre: se non c'è niente di nuovo finiscono subito e non fanno danni.

Poi avvia il frontend:

```
npm run dev
```

### Quando salvi il tuo lavoro

Per ora lavoriamo **direttamente su `main`** (niente branch e niente approvazioni).

```
git status
git diff
git add <file-modificati>
git commit -m "Descrizione breve di cosa hai fatto"
git pull
git push
```

- `git status` mostra quali file hai modificato. **Controlla che `.env` non compaia mai.**
- `git diff` mostra le righe cambiate (se il terminale si ferma con `:` in fondo, premi `q`).
- `git add` prepara i file da includere. Meglio indicare i file uno per uno che usare `git add .`
- `git commit` salva la "fotografia" con un messaggio che dice **cosa** hai fatto e **perché**.
- `git pull` **prima** del push scarica eventuali modifiche dell'altro ed evita conflitti.
- `git push` carica su GitHub.

### Dopo il push

Su GitHub, accanto al tuo commit, compare prima un pallino giallo e poi:

- ✅ **spunta verde**: i controlli automatici (installazione e test) sono passati;
- ❌ **X rossa**: qualcosa non va. Clicca la X → **Details** → apri il passaggio fallito e leggi l'errore. Va sistemato subito, prima di aggiungere altro.

### Comandi utili

| Comando                  | A cosa serve                               |
| ------------------------ | ------------------------------------------ |
| `php artisan test`       | Lancia i test automatici (Pest)            |
| `vendor/bin/pint`        | Sistema la formattazione del codice PHP    |
| `php artisan migrate`    | Applica le nuove migration al tuo database |
| `php artisan route:list` | Mostra tutte le pagine (rotte) dell'app    |

---

## 12. Problemi comuni

| Problema                                                 | Causa probabile                                                                          | Soluzione                                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `... is not recognized as the name of a cmdlet`          | Il terminale è stato aperto prima dell'installazione, oppure il programma non è nel PATH | Chiudi e riapri il terminale. Per `psql`, rifai il passo 5 "Rendere raggiungibile il comando psql"                                 |
| `php` non funziona più dopo aver toccato il PATH         | È stata creata una nuova variabile `Path` invece di modificare quella esistente          | Nelle variabili d'ambiente, riaggiungi il percorso di Herd o reinstalla Herd                                                       |
| `password authentication failed`                         | Password sbagliata (nel `.env` o nel terminale)                                          | Controlla di usare la password di `miopersonal` e non quella di `postgres`. Nel terminale la password non si vede mentre la scrivi |
| `database "miopersonal" does not exist`                  | Il database non è stato creato                                                           | Rifai il passo 7                                                                                                                   |
| `Vite manifest not found`                                | Il frontend non è stato compilato                                                        | Lancia `npm run dev` e lascialo acceso                                                                                             |
| `miopersonal.test` non si apre                           | Il progetto non è dentro la cartella di Herd, o la cartella ha un altro nome             | Il percorso deve essere `...\Herd\miopersonal`                                                                                     |
| Avvisi `LF will be replaced by CRLF`                     | Differenza tra Windows e Linux nel modo di andare a capo                                 | Innocui, puoi ignorarli                                                                                                            |
| Il prompt di `psql` diventa `postgres-#`                 | Manca il punto e virgola                                                                 | Scrivi `;` e premi Invio                                                                                                           |
| Un percorso "spezzato" tipo `C:\Users\Nome` in un errore | Spazi nel nome della cartella utente                                                     | Segnalalo: si risolve spostando il progetto in una cartella senza spazi                                                            |

Se un errore non è in tabella: **copia il messaggio completo** e chiedi. Quasi sempre la causa è scritta nel testo dell'errore.

---

## 13. Regole del progetto

- 🔒 **Mai** mettere password, chiavi o il file `.env` su GitHub o in chat.
- **Codice in inglese** (nomi di tabelle, variabili, file); **interfaccia in italiano** (testi che vede l'utente).
- Ogni modifica al database si fa con una **migration** nuova. Una migration già su GitHub **non si modifica mai**: se serve cambiare qualcosa, se ne crea un'altra.
- `git pull` prima di iniziare e prima di ogni `git push`.
- Una cosa alla volta: finisci, prova, fai commit, poi passa alla successiva.
- Le idee nuove vanno nella lista **"dopo la beta"**, non si sviluppano subito.

---

## Stack del progetto

Laravel 13 · PHP 8.4 · Inertia.js · React · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL 18 · Pest · Hosting su Laravel Cloud (in arrivo)
