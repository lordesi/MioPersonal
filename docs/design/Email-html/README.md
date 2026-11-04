# MioPersonal · Email automatiche

Nuovo design delle email che l'app invia da sola: conferma email, reset password e le 4 email di prenotazione.
Stesso stile dell'app (nero, bianco, grigi, angoli morbidi), pensate per essere lette in 5 secondi:
cosa è successo → i dettagli → un solo pulsante.

## Cosa c'è nella cartella

```
resources/views/emails/
  layouts/base.blade.php           layout comune: intestazione nera, card bianca, piè di pagina
  partials/button.blade.php        pulsante principale (funziona anche su Outlook)
  partials/booking.blade.php       scheda della seduta con il riquadro nero della data
  partials/details.blade.php       riquadro grigio "etichetta → valore" (le righe vuote spariscono)
  partials/note.blade.php          nota con barra nera (scadenze, sicurezza)
  partials/fallback-link.blade.php link di riserva se il pulsante non funziona
  auth/verify-email(.blade.php | -text.blade.php)      Conferma la tua email
  auth/reset-password(...)                             Reimposta la password
  booking/request-sent(...)       al cliente: richiesta inviata, in attesa del trainer
  booking/new-request(...)        al trainer: nuova richiesta da confermare entro 24 ore
  booking/confirmed(...)          al cliente: seduta confermata + contatti del trainer
  booking/not-confirmed(...)      al cliente: rifiutata o scaduta, scegli un altro orario
public/images/email/logo-white.png  logo bianco (PNG, le email non mostrano gli SVG)
examples/AppServiceProvider-boot.php  collega le email di conferma e reset password
examples/BookingConfirmed.php         esempio di notifica per le email di prenotazione
examples/routes-anteprima.php         rotta per vedere le email nel browser in locale
anteprime/                            le 6 email già pronte in HTML, da aprire nel browser
```

Ogni email ha due file: quello HTML e quello `-text`, in solo testo. Il testo semplice serve ai programmi di posta
che non mostrano l'HTML e migliora la consegna (meno spam).

## Perché funzionano in tutti i programmi di posta

- Layout fatto con tabelle e stili scritti dentro i tag (Gmail e Outlook ignorano molti CSS "moderni").
- Larghezza massima 600 px; su telefono si adatta e il pulsante diventa a tutta larghezza.
- Pulsante "a prova di Outlook" (versione VML per Outlook desktop su Windows).
- Modalità scura: su Apple Mail e Outlook.com i colori si invertono in modo pulito (card grigio scuro, pulsante bianco).
- Testo di anteprima (preheader) scelto da noi, invece della prima riga a caso.
- Font Geist dove supportato (Apple Mail, iOS); altrove ripiega su quelli di sistema.
- Niente JavaScript, niente SVG, immagini ridotte al solo logo.

## Come installarle (Laravel)

1. **Copia i file**
   - `resources/views/emails/` → nella stessa cartella del progetto
   - `public/images/email/logo-white.png` → nella stessa cartella del progetto

2. **Controlla il file `.env`** (in produzione su Laravel Cloud, nelle variabili d'ambiente)
   ```
   APP_URL=https://miopersonal.it
   MAIL_FROM_ADDRESS=noreply@miopersonal.it
   MAIL_FROM_NAME="MioPersonal"
   ```
   `APP_URL` deve essere l'indirizzo pubblico: il logo viene caricato da lì (`asset('images/email/logo-white.png')`).
   Se è `http://localhost`, nelle email vere il logo non si vede.

3. **Conferma email e reset password**: apri `app/Providers/AppServiceProvider.php` e incolla il contenuto di
   `examples/AppServiceProvider-boot.php` (gli `use` in alto e il codice dentro `boot()`).
   Da quel momento Laravel usa le nuove email al posto di quelle standard.
   Se avete già personalizzato i link (`ResetPassword::createUrlUsing`), tenete il vostro modo di costruire `$url`.

4. **Email di prenotazione**: per ogni momento serve una notifica che passa i dati alla vista giusta.
   `examples/BookingConfirmed.php` è un esempio completo: copialo in `app/Notifications/` e adatta i nomi dei campi.
   Le altre si fanno allo stesso modo:

   | Quando | A chi | Vista | Oggetto consigliato | Variabili |
   |---|---|---|---|---|
   | Il cliente invia una richiesta | cliente | `emails.booking.request-sent` | Richiesta inviata a {trainer} | trainerName, weekday, day, month, time, service, place, price, cancelPolicy, url |
   | Il cliente invia una richiesta | trainer | `emails.booking.new-request` | Nuova richiesta: {cliente}, {mer 28 ott} alle {13:00} | clientName, isNewClient, weekday, day, month, time, service, place, expiresAt, clientNote, url |
   | Il trainer conferma (o conferma automatica) | cliente | `emails.booking.confirmed` | Seduta confermata: {mer 28 ott}, {13:00} | trainerName, weekday, day, month, time, service, place, trainerPhone, trainerEmail, trainerNotes, cancelUntil, url |
   | Il trainer rifiuta o passano 24 ore | cliente | `emails.booking.not-confirmed` | Richiesta non confermata: scegli un altro orario | trainerName, reason ("declined" o "expired"), weekday, day, month, time, service, place, url, searchUrl |

   Per le date in italiano usate Carbon con `->locale('it')`: `isoFormat('ddd')` → "mer", `format('j')` → "28",
   `isoFormat('MMM')` → "ott". Le variabili facoltative (prezzo, telefono, messaggio...) possono essere `null`:
   la riga sparisce da sola. Con la conferma automatica attiva, al cliente va solo `confirmed` e al trainer
   potete mandare `new-request` cambiando il testo, oppure niente.

5. **Guardale nel browser**: incolla `examples/routes-anteprima.php` in fondo a `routes/web.php` e apri
   `http://localhost:8000/_email/booking.confirmed` (oppure `auth.verify-email`, `booking.new-request`, ...).
   La rotta esiste solo in locale.

## Come testarle prima di andare online

- **In locale**: con Laravel Herd o Sail usate Mailpit (`MAIL_MAILER=smtp`, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`)
  e vedete le email arrivare in `http://localhost:8025`, con anteprima mobile e controllo dell'HTML.
- **Su caselle vere**: mandatene una a Gmail (web e app), Outlook (web e, se potete, desktop Windows) e a un iPhone.
  Provate anche la modalità scura del telefono.
- **Spam**: inviatene una a mail-tester.com e puntate a 9/10 o più.

## Consegna (per non finire nello spam)

- Sul dominio `miopersonal.it` configurate **SPF**, **DKIM** e **DMARC** (il servizio di invio, ad esempio Resend,
  Postmark o Amazon SES, vi dà i record DNS da aggiungere).
- Il link **"Annulla iscrizione"** che Gmail mostra in alto nello screenshot arriva dall'intestazione
  `List-Unsubscribe`, aggiunta di solito dal servizio di invio. Per le email transazionali (conferme, reset,
  prenotazioni) non serve: disattivatela nelle impostazioni del servizio o usate per queste email un flusso
  "transactional" separato da quello delle newsletter.

## Cambiare testi e colori

- I testi sono direttamente nei file in `resources/views/emails/auth` e `booking`.
- I colori principali sono: nero `#0a0a0a`, testo `#3f3f46`, grigio chiaro `#f4f4f5`, bordi `#e4e4e7`.
  Se li cambiate, fatelo in tutti i file della cartella `emails` (cerca e sostituisci).
- Per una nuova email: copiate una vista esistente, cambiate titolo, testo e pulsante; il layout resta lo stesso.

## Prompt pronto per Claude Code

```
Ho una cartella "miopersonal-email" con il nuovo design delle email (leggi il README.md).
1. Copia resources/views/emails e public/images/email/logo-white.png nel progetto.
2. Collega verifica email e reset password come in examples/AppServiceProvider-boot.php.
3. Trova nel progetto dove vengono create, confermate, rifiutate o fatte scadere le prenotazioni e invia le
   4 email di prenotazione con delle Notification come examples/BookingConfirmed.php, usando i campi reali
   del modello Booking. Se una notifica esiste già, cambia solo toMail() per usare la nuova vista.
4. Aggiungi la rotta di anteprima di examples/routes-anteprima.php solo per l'ambiente locale.
5. Non modificare i file Blade delle email salvo per adattare i nomi delle variabili.
```
