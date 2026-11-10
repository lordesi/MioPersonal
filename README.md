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

Poi riempi le tabelle e collega la cartella delle foto:

```
php artisan db:seed
php artisan storage:link
```

- `db:seed` carica città e discipline e, solo in locale, i trainer d'esempio (email
  `…@demo.miopersonal.test`, password `password`).
- `storage:link` rende visibili nel browser le foto dei profili trainer (cartella
  `storage/app/public`). Va fatto una volta sola.

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
2. Dopo **Completa il tuo profilo** (clicca **Salta per ora**) comparirà la pagina **Conferma la tua email**: in locale le email **non vengono inviate davvero**, ma scritte in un file di log.

### Trovare il link di verifica

1. In VS Code apri `storage/logs/laravel.log`.
2. Vai in fondo al file con **Ctrl + Fine**.
3. Cerca (**Ctrl + F**) il testo `email/verify`.
4. Copia il link **completo** (inizia con `http://miopersonal.test/email/verify/`) e aprilo nel browser.

Arriverai nella tua area (cliente o trainer). ✅ Il link vale 24 ore; se scade, dalla pagina premi **Invia di nuovo il link**.

### Se il link non funziona

Nel log il link a volte appare "rotto" (con `=3D` al posto di `=`, o spezzato su due righe). In quel caso segna l'email come verificata direttamente nel database:

```
psql -U miopersonal -d miopersonal -h localhost -c "update users set email_verified_at = now() where email = 'test@example.com';"
```

La risposta `UPDATE 1` conferma. Ricarica la pagina nel browser.

> Questa scorciatoia va bene **solo in locale** con utenti di prova.

### Provare «Password dimenticata?»

1. Dalla pagina **Accedi** clicca **Password dimenticata?**, scrivi l'email dell'utente di prova e premi **Inviami il link**.
2. Come per la verifica, l'email finisce in `storage/logs/laravel.log`: cerca `reset-password` e apri il link.
3. Scegli la nuova password: torni su **Accedi** con il messaggio «Password aggiornata».

### Accesso con Google (facoltativo)

Finché nel `.env` non c'è `GOOGLE_CLIENT_ID`, il pulsante **Continua con Google** non compare. Per attivarlo:

1. Apri [console.cloud.google.com](https://console.cloud.google.com), crea un progetto e vai su **API e servizi → Schermata consenso OAuth** (tipo **Esterno**, aggiungi la tua email tra gli utenti di test).
2. Vai su **Credenziali → Crea credenziali → ID client OAuth**, tipo **Applicazione web**.
3. In **URI di reindirizzamento autorizzati** aggiungi `http://localhost:8000/auth/google/callback`.
   Google non accetta i domini `.test`: in locale va provato su `localhost`.
4. Copia ID e secret nel `.env`:

    ```
    GOOGLE_CLIENT_ID=il-tuo-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=il-tuo-secret
    GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
    ```

5. Avvia `php artisan serve` (oltre a `npm run dev`) e apri `http://localhost:8000/login`.

In produzione si aggiunge in Google l'indirizzo vero, es. `https://miopersonal.it/auth/google/callback`.

### Collegamento social dei trainer (facoltativo)

In «Diventa trainer» e in «Il mio profilo» il trainer può premere **Collega** per Instagram, TikTok, Facebook e YouTube. Si apre una finestra in cui fa il login sul social; poi sul profilo pubblico compare l'icona che apre il suo profilo. Non salviamo token: solo ID, nome utente e link. Ogni social resta nascosto finché nel `.env` manca il suo `*_CLIENT_ID` (senza nessun social configurato si vede solo il campo Instagram scritto a mano, come prima).

Le redirect URI da registrare su ogni console sono `https://<dominio>/social/{instagram|tiktok|facebook|youtube}/callback`.

- **Instagram**: [developers.facebook.com](https://developers.facebook.com) → crea un'app di tipo **Business** → aggiungi il prodotto **Instagram** → **API setup with Instagram login**. Permesso `instagram_business_basic`. Copia _Instagram app ID/secret_ in `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET`. Funziona solo con account Instagram **professionali** (creator o business): per gli altri resta il campo manuale.
- **Facebook**: nella stessa app Meta aggiungi **Facebook Login**, con i permessi `public_profile` e `user_link`. Copia _App ID/secret_ in `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`.
- **TikTok**: [developers.tiktok.com](https://developers.tiktok.com) → crea un'app → **Login Kit** (Web), con gli scope `user.info.basic` e `user.info.profile`. Copia _Client key/secret_ in `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`.
- **YouTube**: nel progetto Google Cloud del login abilita la **YouTube Data API v3**, aggiungi lo scope `youtube.readonly` alla schermata di consenso e crea (o riusa) un client OAuth web. Mettilo in `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`.

**In locale**: Meta e TikTok vogliono HTTPS e Google non accetta `.test`. Il modo più semplice è `herd share`, che dà un indirizzo pubblico in HTTPS: apri **tutto il sito da quell'indirizzo** (così la sessione resta la stessa) e registralo come redirect URI. Se serve, l'indirizzo si forza con `INSTAGRAM_REDIRECT_URI`, `TIKTOK_REDIRECT_URI`, `FACEBOOK_REDIRECT_URI` e `YOUTUBE_REDIRECT_URI`. Finché l'app è in modalità sviluppo/sandbox possono collegarsi solo gli account aggiunti come **tester** sulla console.

**Prima di andare online** serve l'approvazione di ogni piattaforma (gratuita): App Review di Meta per `instagram_business_basic` e `user_link`, revisione dell'app su TikTok, verifica dell'app su Google per `youtube.readonly`. Di solito chiedono un video che mostri il collegamento, la privacy policy (`/privacy`) e un URL con le istruzioni per cancellare i dati (`/privacy#conservazione`: basta premere «Scollega»).

### Email in produzione con Brevo

In locale le email restano nel log. Online servono davvero: le consegna [Brevo](https://www.brevo.com), collegato via **SMTP**. Non serve nessuna libreria: basta il `.env`.

Il piano gratuito di Brevo permette circa 300 email al giorno, quindi **le email sono poche e solo quelle che la persona deve leggere anche senza aprire il sito**. Tutto il resto è una notifica: la **campanella** dentro il sito (tabella `notifications`, `GET /notifiche`) e, con un dispositivo attivo, la push. Le email ancora inviate, tutte con il layout `resources/views/mail/layouts/base.blade.php`:

| Email | A chi |
|---|---|
| Conferma la tua email, Reimposta la password | chi si registra / chi la chiede |
| Esito della verifica del profilo (online, da sistemare, non approvato) | trainer e palestre |
| Seduta annullata dal trainer, nuovo orario proposto | cliente (e amici invitati) |
| Evento annullato, spostato, iscrizione tolta | iscritti all'evento |
| Messaggio dalla pagina Contatti | team (nessuna copia a chi scrive) |

Solo campanella + push (nessuna email): nuova richiesta o prenotazione, seduta confermata, risposte del cliente a un nuovo orario, promemoria (il giorno prima; 2 ore prima solo push), amico che partecipa, sedute fisse, iscrizione e promemoria degli eventi, evento che si farà, invito a organizzare, lista d'attesa, collegamenti trainer-palestra. I canali di ogni notifica sono nel suo `via()` (`app/Notifications`, helper in `Concerns/SendsPush`): per aggiungere una mail a una notifica basta usare `mailAndPush()` invece di `inAppAndPush()` e scrivere `toMail()`. Le notifiche più vecchie di 90 giorni le cancella `notifications:prune` (scheduler).

1. Crea un account Brevo (il piano gratuito permette circa 300 email al giorno: controlla sul sito).
2. In **Impostazioni → Mittenti, domini e IP → Domini** aggiungi `miopersonal.it` e copia nel DNS del dominio i record che Brevo ti mostra (DKIM, DMARC e il codice di verifica). Senza, le email finiscono nello spam.
3. In **SMTP e API → SMTP** genera una **chiave SMTP** e copia login e chiave nel `.env` del server:

    ```
    MAIL_MAILER=smtp
    MAIL_HOST=smtp-relay.brevo.com
    MAIL_PORT=587
    MAIL_USERNAME=il-login-smtp-di-brevo
    MAIL_PASSWORD=la-chiave-smtp
    MAIL_FROM_ADDRESS="noreply@miopersonal.it"
    MAIL_FROM_NAME="MioPersonal"
    ```

4. Registra un utente di prova con una tua email vera e controlla che arrivi **Conferma la tua email**.

> Le chiavi vanno **solo** nel `.env` del server, mai su GitHub.

#### Immagine del mittente (avatar accanto al nome)

Il cerchietto con il logo accanto a «MioPersonal» in Gmail e Apple Mail non dipende dal codice delle email: lo mostrano i client, in base all'indirizzo del mittente (`noreply@miopersonal.it`). Le vie gratuite:

1. **L'indirizzo deve ricevere posta.** La posta in arrivo di `miopersonal.it` passa da Cloudflare Email Routing: in Cloudflare → dominio → **Email → Email Routing → Routing rules** crea l'indirizzo `noreply@miopersonal.it` con inoltro a una tua casella e provalo scrivendogli da Gmail.
2. **Gmail**: vai su accounts.google.com/signup, scegli **«Usa il tuo indirizzo email attuale»** e inserisci `noreply@miopersonal.it`; conferma col codice che ti arriva per inoltro. Poi su myaccount.google.com → **Informazioni personali → Foto** carica `public/icons/icon-512.png` (logo quadrato su fondo nero). Compare a chi legge da Gmail dopo qualche ora o giorno.
3. **Apple Mail**: su businessconnect.apple.com registra l'attività, apri **Branded Mail**, aggiungi il dominio `miopersonal.it`, verificalo con il record TXT che Apple indica (in Cloudflare → DNS) e carica il logo. Gratuito, con revisione di Apple di alcuni giorni.
4. **Outlook e gli altri client**: non c'è una via gratuita affidabile. Il logo ovunque si chiama **BIMI** e richiede un certificato a pagamento (VMC/CMC, indicativamente 500-1500 € l'anno) e un record DNS `default._bimi`. Il DMARC del dominio è già `p=quarantine`, che è il requisito di partenza: la strada resta aperta.

Prerequisiti per la consegna (già a posto o da controllare su Brevo): SPF, DKIM e DMARC del dominio. Il record SPF di `miopersonal.it` oggi include solo Cloudflare: Brevo firma con la sua chiave DKIM, ma se vuoi che anche SPF lo autorizzi aggiungi `include:spf.brevo.com` al record TXT esistente (un solo record SPF per dominio).

### Email delle prenotazioni e coda

Le notifiche delle prenotazioni (**Nuova richiesta**, **Seduta confermata**, cambi di orario…) partono
**in coda**: la pagina non aspetta, e le notifiche vengono consegnate subito dopo da un
processo a parte, il _worker_ (`php artisan queue:work`). Senza worker non partono né le email né
le notifiche della campanella.

- **In locale**: metti `QUEUE_CONNECTION=sync` nel tuo `.env`. Le email vengono spedite subito, senza worker, e
  le trovi in `storage/logs/laravel.log`. Con `QUEUE_CONNECTION=database` restano in attesa finché
  non lanci `php artisan queue:work`.
- **Sul server**: lascia `QUEUE_CONNECTION=database` e attiva il worker (su Forge: **Queue**).
  Senza worker queste email non partono mai.

### App installabile, notifiche push e promemoria

Il sito si installa sulla schermata Home (`public/manifest.webmanifest`) e manda notifiche push
(`public/sw.js`). Non ci sono costi: le push passano dai servizi gratuiti di Apple, Google e Mozilla.

1. **Chiavi VAPID**, una volta sola per ogni ambiente:
    ```
    php artisan webpush:vapid
    ```
    Scrive `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nel `.env`; aggiungi anche
    `VAPID_SUBJECT="mailto:info@miopersonal.it"`. **Non cambiarle più**: i dispositivi già attivi
    smetterebbero di ricevere. Senza chiavi il pulsante **Attiva le notifiche** non compare.
2. **Su Windows** (in locale) OpenSSL ha bisogno del suo file di configurazione, sia per creare le
   chiavi sia per spedire le push. Prima dei comandi, nello stesso PowerShell:
    ```
    $env:OPENSSL_CONF = "$env:USERPROFILE\.config\herd\bin\php84\extras\ssl\openssl.cnf"
    ```
    Sul server Linux non serve.
3. **Promemoria**: `bookings:remind` gira ogni 5 minuti con lo scheduler. Il giorno prima avvisa
   cliente e trainer (campanella del sito e push a chi ha un dispositivo attivo, mai email, per stare
   nel limite gratuito di Brevo); 2 ore prima avvisa il cliente, solo con la push. Sul server servono
   il **cron** di `php artisan schedule:run` ogni minuto e il **worker** della coda.
4. **Provarle**: le push richiedono HTTPS. In locale `herd secure miopersonal` attiva HTTPS sul sito.
   Su iPhone funzionano solo dall'app aggiunta alla Home (Condividi → «Aggiungi alla schermata
   Home»), da iOS 16.4.

### SEO: rendering lato server (SSR) in produzione

Le pagine pubbliche (home, ricerca, profili trainer, pagine legali, contatti, «Diventa trainer») vengono
disegnate **sul server** da un piccolo processo Node, così Google e i social ricevono la pagina completa
e non un foglio bianco. Le aree private (area trainer, area cliente, admin, login…) restano solo nel
browser: l'elenco è in `app/Http/Middleware/HandleInertiaRequests.php` (`$withoutSsr`).

- **In locale** non serve fare niente: con `composer dev` ci pensa Vite.
- **Sul server (Ploi)**:
    1. Nello **script di deploy** sostituisci `npm run build` con `npm run build:ssr`, e aggiungi in fondo
       `php artisan inertia:stop-ssr` (ferma il vecchio processo: il daemon lo riavvia col codice nuovo).
    2. In **Daemons** aggiungi `php artisan inertia:start-ssr` (cartella del sito, utente `ploi`).
    3. Controlla: `curl -s https://miopersonal.it/personal-trainer | grep data-server-rendered` deve
       trovare una riga.

    Se il processo Node si ferma il sito continua a funzionare (le pagine si disegnano nel browser), ma
    Google vede di nuovo una pagina vuota. Per spegnerlo apposta: `INERTIA_SSR_ENABLED=false` nel `.env`.

I meta tag (description, canonical, Open Graph) e i dati strutturati per Google li scrive Laravel dalla
prop `seo` delle pagine (`App\Support\Seo`). Le pagine senza `seo` sono `noindex`. La mappa del sito è
`/sitemap.xml` (aggiornata al massimo ogni ora). Dopo il primo deploy aggiungila in
[Google Search Console](https://search.google.com/search-console) e Bing Webmaster Tools.

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
