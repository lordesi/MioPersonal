# Analisi dei dati di MioPersonal

Base per scrivere `docs/schema.dbml` e le migration. Le scelte della sezione 6 sono **decise**
(ottobre 2026), e l'app è **nazionale**: le città sono i capoluoghi di provincia, senza quartieri.

**Da dove viene.** Dal codice attuale, che descrive esattamente cosa mostra ogni schermata:

- i tipi in `resources/js/types/*.ts`;
- i dati d'esempio dei controller (`BuildsPlaceholderData` e i controller di cliente, trainer e
  admin);
- i form: registrazione trainer (`components/onboarding/trainer/draft.ts`), contatti,
  completa profilo, impostazioni;
- le regole di `CLAUDE.md`.

Nel database ci sono già:

- `users`, con `role` e i campi del passo 1 (vedi §7);
- `cities`, `disciplines` (passo 2);
- `sessions`, `passkeys` e le tabelle tecniche di Laravel (`cache`, `jobs`, reset password).

---

## 1. Principi

| Regola                                         | Come la applichiamo                                                   | Perché                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Prezzi                                         | `integer` in centesimi (`4500` = 45,00 €)                             | Niente errori di arrotondamento                                       |
| Momenti nel tempo (inizio seduta, scadenze)    | `timestamptz` in UTC                                                  | Una sola verità, convertita in `Europe/Rome` solo per mostrarla       |
| Orari di lavoro ricorrenti ("lunedì 18–21")    | giorno della settimana + `time` **ora di Roma**                       | "Le 18" restano le 18 anche col cambio dell'ora legale                |
| Stati (prenotazione, profilo…)                 | colonna testo + vincolo `CHECK`, letta da un enum PHP                 | Come già `UserRole`: leggibile e controllato dal database             |
| Liste che il team modifica (discipline, città) | **tabelle**                                                           | Si gestiscono da "Admin · Discipline e città" senza toccare il codice |
| Dati sulla salute                              | **mai**: né colonne né note                                           | Regola del progetto (GDPR art. 9)                                     |
| Cancellazione account                          | cancellazione vera + anonimizzazione di ciò che deve restare          | Il design lo promette: «le recensioni restano, ma in forma anonima»   |
| Cose sospese o nascoste                        | colonne `…_at` (`suspended_at`, `hidden_at`) invece del "soft delete" | Si vede _quando_ è successo e le query restano semplici               |
| Dati copiati nella prenotazione                | nome del servizio, prezzo, luogo al momento della prenotazione        | Se il trainer cambia prezzo, le prenotazioni passate non cambiano     |

---

## 2. Problemi trovati nel codice attuale

1. **Discipline in 5 versioni diverse.**
    - Registrazione trainer: 10 voci, con «Pesi e bodybuilding», «Postura», «Running».
    - Ricerca: 7 voci, con «Pesi».
    - Form della home: «Functional training».
    - "Completa profilo": 7 voci.

    Una tabella `disciplines`, con il suo `slug` per gli URL (`?disciplina=pilates`), le unifica.

2. **Zone in 4 versioni** (tutte di Milano). Superato: l'app è nazionale e usa solo le **città**
   (tabella `cities`, i capoluoghi di provincia). Niente quartieri.

3. **Il quiz usava dati che nessun form raccoglie** (obiettivi del trainer, fasce orarie).
   Superato: il quiz è stato tolto (ottobre 2026), e con lui la tabella `discipline_goal`.

4. **Etichette calcolate**: «Risponde di solito in 2 ore», «8 anni di esperienza», «Nuovo», «Anche
   online». Non vanno salvate come testo. Si calcolano da:
    - i tempi di risposta alle prenotazioni;
    - la fascia di esperienza;
    - il numero di recensioni;
    - i luoghi.

---

## 3. Le entità, area per area

Per ogni tabella: a cosa serve, i campi principali, da dove arrivano i dati (✍️ chi li scrive,
👁 dove si leggono).

### 3.1 Utenti e account

**`users`** (esiste già) — una riga per persona, con un solo ruolo.

| Campo                                      | Note                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `first_name`, `last_name`                  | _Scelta A_: oggi c'è solo `name`                                                  |
| `email`, `email_verified_at`, `password`   | Esistono                                                                          |
| `phone`                                    | _Scelta B_: per Telefono e WhatsApp del trainer e per i contatti dopo la conferma |
| `role`                                     | Esiste: client / trainer / admin                                                  |
| `avatar_path`                              | Foto del cliente (completa profilo)                                               |
| `terms_accepted_at`, `marketing_opt_in_at` | Consensi della registrazione (oggi non salvati)                                   |
| `notification_settings` (`jsonb`)          | Interruttori di "Notifiche": pochi valori, letti sempre insieme all'utente        |
| `password_changed_at`                      | «Cambiata l'ultima volta il…»                                                     |
| `suspended_at`                             | "Admin · Utenti" → Sospendi                                                       |

- ✍️ Registrazione, Impostazioni account, admin.
- 👁 Tutto il sito.

**`sessions`** (esiste già): con `SESSION_DRIVER=database` contiene già i "Dispositivi collegati"
(browser, IP, ultima attività). Basta leggerla.

**`social_accounts`** (più avanti, se approvate Socialite): `user_id`, `provider` (google/apple),
`provider_user_id`. Serve per «Accesso con altri account».

**`data_export_requests`**: `user_id`, `requested_at`, `completed_at`. Serve per «Scarica i miei
dati»: il GDPR dà 30 giorni e bisogna poter dimostrare quando la richiesta è stata evasa.

### 3.2 Catalogo (gestito dal team)

**`disciplines`**: `name`, `slug`, `sort`, `is_active`.

- ✍️ Admin · Discipline e città.
- 👁 Ricerca, registrazione trainer, profilo, completa profilo.

**`cities`** ✅: `name`, `slug` (URL `/personal-trainer/{slug}`), `province_code` (sigla, es. MI),
`region`, `lat`, `lng` (centro della città), `is_active`.

- I dati sono in `database/data/cities.csv`: 109 capoluoghi dall'elenco ufficiale ISTAT, con le
  coordinate da Wikidata. Li carica `CitySeeder`.
- Il team può aggiungere altre città.

### 3.3 Profilo trainer

**`trainer_profiles`**: uno per ogni utente trainer. È il cuore della ricerca.

| Gruppo                                               | Campi                                                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identità                                             | `user_id` (unico), `slug` (URL `/trainer/giulia-rossi`), `headline`, `bio`, `experience` (fascia: <2, 2–5, 5–10, >10 anni)                                                                  |
| Approvazione                                         | `status` (draft, review, changes, approved, rejected), `status_changed_at`, `approved_at`                                                                                                   |
| Visibilità                                           | `visible_in_search`, `accepts_new_clients`, `paused_until` (pausa per ferie, vedi anche `trainer_time_off`)                                                                                 |
| Regole di prenotazione                               | `notice_hours`, `booking_window_days`, `break_minutes`, `travel_minutes`, `max_sessions_per_day`, `confirm_hours`, `free_cancellation_hours`, `auto_confirm`, `allowed_hours` (1 e/o 2 ore) |
| Contatti per i clienti                               | `show_email`, `show_phone`, `show_whatsapp`, `arrival_notes`                                                                                                                                |
| **Campi calcolati** (per la ricerca veloce, vedi §4) | `rating_count`, `rating_sum`, `price_from_cents`, `next_free_slot_at`, `trains_online`, `trains_in_person`, `response_minutes`                                                              |

- ✍️ Registrazione trainer (passi 2–7), Disponibilità, Impostazioni trainer, admin (stato).
- 👁 Home, ricerca, profilo pubblico, area trainer, admin.

Tabelle collegate:

- **`trainer_profile_discipline`** (massimo 5, con `sort`): discipline del trainer.
- `trainer_profiles.city_id`: la città principale. Vuota per chi lavora solo online.
- **`trainer_profile_city`**: le altre città in cui si sposta (domicilio e parco).
- **`trainer_places`**: `type` (studio / home / park / online), `name`, `address`, `city_id`.
  **Più righe**: la registrazione permette più studi.
- **`trainer_photos`**: `path`, `caption`, `is_portrait`, `sort`.
- **`trainer_documents`**: `type` (identity / certificate), `title`, `issuer`, `year`, `path`
  (disco **privato**, link temporanei per l'admin), `verified_at`.
- **`trainer_profile_reviews`**: lo storico delle decisioni del team in "Admin · Verifica".
  Campi: `admin_id`, `decision`, `message_to_trainer`, `internal_note`, `created_at`.
    - Le «note del team» e le «modifiche richieste» finiscono qui.
    - Gli avvisi automatici («la bio contiene un numero di telefono») si calcolano: non si
      salvano.

### 3.4 Servizi e pacchetti

**`services`**: `trainer_profile_id`, `name`, `kind` (session / package), `minutes`,
`price_cents`, `price_per_hour`, `fixed_duration`, `note`, `online_only`, `package_sessions`,
`package_valid_days`, `sort`, `is_active`.

- ✍️ Registrazione (passo 4), area trainer.
- 👁 Profilo, prenotazione, ricerca (prezzo minimo).

**`client_packages`**: un pacchetto comprato. Campi: `client_id`, `trainer_profile_id`,
`service_id`, `name`, `price_cents` e `minutes` (copie), `sessions_total`, `bought_at` (la prima
seduta è confermata). Ogni seduta del pacchetto ha `bookings.client_package_id`.

- Le sedute usate **si contano** dalle prenotazioni collegate: niente contatore da tenere
  allineato.
- 👁 "I tuoi pacchetti" (cliente), "Clienti" (trainer).

### 3.5 Disponibilità

**`trainer_working_hours`**: `trainer_profile_id`, `weekday` (1–7), `starts_at` e `ends_at` di tipo
`time`, ora di Roma. Più fasce per giorno (lunedì 07–12 e 18–21).

- ✍️ Registrazione (passo 5), Disponibilità.

**`trainer_time_off`**: tutto ciò che toglie disponibilità. Campi: `trainer_profile_id`,
`starts_at`, `ends_at` (`timestamptz`), `kind`:

- `holiday`: ferie («24 dic – 6 gen»);
- `pause`: la pausa di Visibilità del profilo;
- `block`: l'ora bloccata dal calendario.

**`calendar_connections`**: `trainer_profile_id`, `provider` (google/apple), token cifrati,
`last_synced_at`.

**`external_busy_times`**: gli impegni importati da Google/Apple (`starts_at`, `ends_at`,
`external_id`). Si cancellano e si ricaricano a ogni sincronizzazione.

### 3.6 Prenotazioni (il centro di tutto)

**`bookings`**

| Gruppo                              | Campi                                                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chi                                 | `client_id` (vuoto se il cliente cancella l'account), `trainer_profile_id`, `service_id`, `client_package_id`                                                                      |
| Quando                              | `starts_at`, `ends_at`, `blocked_until` (= fine + pausa/spostamento: il trainer non è prenotabile fino a lì)                                                                       |
| Copie al momento della prenotazione | `service_name`, `price_cents`, `place_type`, `place_label`, `address` (solo a domicilio; visibile al trainer dopo la conferma)                                                     |
| Stato                               | `status` (pending, confirmed, declined, expired, cancelled), `expires_at` (solo pending), `confirmed_at`, `cancelled_at`, `cancelled_by` (client / trainer / system), `no_show_at` |
| Testo                               | `client_note` (con l'avviso «non inserire dati sulla salute»)                                                                                                                      |

- ✍️ Cliente (prenota, annulla, sposta), trainer (accetta, rifiuta, «Saltata»), sistema
  (scadenza).
- **Svolta o saltata**: non c'è uno stato `completed`. Una seduta confermata è svolta appena finisce
  (`ends_at` passato). Entro 7 giorni il trainer può segnarla «Saltata» (`no_show_at`) e togliere il
  segno. Lo stato resta `confirmed`: il cliente non lo vede. Serve solo alla percentuale di presenza
  che vedono i trainer (`App\Support\ClientAttendance`).
- 👁 Le mie prenotazioni, Prenotazione inviata, Oggi, Calendario, Clienti, Admin · Prenotazioni.

**`booking_events`**: storico di ogni prenotazione. Campi: `booking_id`, `type` (requested,
confirmed, declined, moved, cancelled…), `actor_id`, `data`, `created_at`. Serve a tre cose:

- la nota dell'admin «Dal cliente, 30 h prima»;
- il calcolo di «Risponde di solito in 2 ore»;
- ricostruire cosa è successo in caso di contestazione.

### 3.7 Recensioni, preferiti, note

**`reviews`**: `booking_id` (**unico**: una recensione per seduta, solo se svolta),
`trainer_profile_id`, `client_id` (vuoto dopo la cancellazione dell'account → «anonima»),
`rating` (1–5), `text`, `reply`, `replied_at`, `flag_reason` (avviso automatico), `hidden_at`,
`hidden_by`.

- 👁 Profilo pubblico, Recensioni (trainer), Admin · Recensioni, Passate (cliente).

**`favorites`**: chiave composta (`client_id`, `trainer_profile_id`) + `created_at`.

- 👁 Preferiti, il numero nel menu, «avvisami se si liberano orari».

**`trainer_client_notes`**: `trainer_profile_id`, `client_id`, `note`. Sono le note pratiche
della pagina Clienti («citofono Studio 3B»), **mai** dati di salute.

### 3.8 Preferenze del cliente

**`client_preferences`**: `user_id` (chiave), `city_id`, `mode` (presenza / online / entrambe),
`goal`, `times` (lista), `budget` (fascia), `discipline_ids` (lista).

- Solo obiettivi di allenamento: **niente** patologie, infortuni o farmaci.
- ✍️ Completa profilo.

### 3.9 Contatti e team

**`contact_messages`**: `user_id` (se loggato), `name`, `email`, `role`, `topic`, `message`,
`status` (new / in_progress / closed), `created_at`.

- «Richiesta privacy» si ricava da `topic = privacy`.
- ✍️ Pagina Contatti (oggi parte solo l'email).
- 👁 Admin · Messaggi.

**`contact_message_replies`**: `contact_message_id`, `admin_id`, `body`, `sent_at`.

**`admin_activity_log`**: `admin_id`, `action`, `subject_type`, `subject_id`, `description`,
`created_at`.

- 👁 Admin · Panoramica e Impostazioni («Registro attività»).

**`settings`** (chiave → valore): i valori predefiniti decisi dal team, per esempio 24 ore per
confermare e 24 ore di cancellazione gratuita.

### 3.10 Statistiche e notifiche

**`trainer_profile_views`**: `trainer_profile_id`, `date`, `views`.

- Una riga **al giorno** con un contatore: per «312 visite al profilo» basta sommare 7 righe,
  invece di contare migliaia di visite singole.

**`notifications`**: la tabella standard di Laravel. Serve per la campanella del trainer.

---

## 4. Le operazioni più frequenti, e come renderle veloci

### 4.1 Ricerca trainer (la pagina più usata)

Filtri: città (nell'URL), disciplina, presenza/online, domicilio, «disponibile oggi / entro 3 giorni / entro
la settimana», prezzo, voto ≥ 4,5. Ordina per primo slot libero, prezzo o voto. 12 per pagina.

**Il problema**: «primo slot libero» dipende da orari, ferie, prenotazioni, buffer e preavviso.
Calcolarlo per ogni trainer a ogni ricerca è troppo lento.

**La soluzione**: i **campi calcolati** su `trainer_profiles`. Così la ricerca diventa una sola
query semplice:

```sql
-- in pratica, scritta con Eloquent
WHERE status = 'approved' AND visible_in_search
  AND (paused_until IS NULL OR paused_until < now())
  AND (city_id = … OR trainer solo online OR città servita) AND EXISTS (disciplina)
  AND price_from_cents BETWEEN … AND next_free_slot_at <= …
ORDER BY next_free_slot_at
```

- `next_free_slot_at` si ricalcola **in background** (coda di Laravel), quando cambia qualcosa
  che lo influenza: una prenotazione, gli orari, le ferie, la sincronizzazione del calendario. In
  più c'è un ricalcolo periodico, perché il tempo passa e lo slot di "oggi alle 9" scade.
- `price_from_cents` si aggiorna quando cambiano i servizi.
- `rating_count` e `rating_sum` si aggiornano quando una recensione viene aggiunta o nascosta.
  La media è `rating_sum / rating_count`, quindi niente arrotondamenti accumulati.
- **Indice** principale: `(status, visible_in_search, next_free_slot_at)` più gli indici sulle
  tabelle di collegamento con discipline e città.

Con qualche centinaio di trainer (la beta) PostgreSQL risponde in pochi millisecondi
anche senza trucchi. I campi calcolati servono perché **lo slot libero** costa caro, non per il
numero di righe.

### 4.2 Slot liberi di un trainer (profilo e prenotazione)

**Si calcolano al momento, non si salvano.** Per un solo trainer e 60 giorni il calcolo è veloce:

1. parto dalle fasce di lavoro (`trainer_working_hours`), convertite da ora di Roma a UTC giorno
   per giorno, per gestire bene l'ora legale;
2. tolgo ferie, pause e blocchi (`trainer_time_off`) e gli impegni importati
   (`external_busy_times`);
3. tolgo le prenotazioni `pending` e `confirmed`, incluso il loro `blocked_until`;
4. applico preavviso minimo, finestra di prenotazione, massimo sedute al giorno e durate
   permesse.

Salvare tutti gli slot in una tabella vorrebbe dire rigenerarli a ogni modifica: più dati, più
errori.

### 4.3 Due prenotazioni sullo stesso orario: impossibile per costruzione

Due clienti possono cliccare lo stesso slot nello stesso secondo. Il controllo nel codice («è
libero?») non basta: entrambe le richieste vedrebbero "libero". La protezione va **nel database**,
con un _vincolo di esclusione_ di PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
    trainer_profile_id WITH =,
    tstzrange(starts_at, blocked_until) WITH &&
) WHERE (status IN ('pending', 'confirmed'));
```

- Vuol dire: «per lo stesso trainer, due prenotazioni attive non possono sovrapporsi».
- Se succede, PostgreSQL rifiuta la seconda e noi mostriamo lo stato **«Slot appena preso»**,
  che è già nel design.
- Laravel non ha un comando per questo: va scritto con `DB::statement()` nella migration.
- Ferie e impegni esterni li controlla il codice: lì non c'è concorrenza tra clienti.

### 4.4 Area trainer e area cliente

| Pagina                              | Query                                      | Indice                                             |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Oggi, Calendario, conteggi del mese | prenotazioni del trainer in un intervallo  | `bookings (trainer_profile_id, starts_at)`         |
| Le mie prenotazioni                 | prenotazioni del cliente, future e passate | `bookings (client_id, starts_at)`                  |
| Clienti (trainer)                   | clienti distinti, sedute, ultima/prossima  | stesso indice del trainer, raggruppato per cliente |
| Badge «3 da confermare»             | conteggio delle pending                    | indice parziale `WHERE status = 'pending'`         |

### 4.5 Lavori automatici (scheduler di Laravel)

- **Ogni minuto**: le richieste `pending` con `expires_at` passato diventano `expired`, e lo slot
  si libera. Indice parziale `(expires_at) WHERE status = 'pending'`.
- **Ogni sera**: promemoria per le sedute di domani, solo a chi lo ha attivato in
  `notification_settings`.
- **Ogni mattina alle 7**: «Riepilogo della giornata» per i trainer.
- **Dopo la fine di una seduta confermata**: il trainer segna «Svolta» o «Assente», e da lì il
  cliente può lasciare la recensione.

### 4.6 Admin

I contatori (profili da verificare, messaggi nuovi, recensioni segnalate, prenotazioni) sono
semplici `COUNT` con indici parziali sugli stati. Con i volumi della beta non serve altro.

---

## 5. Cancellazioni e GDPR

| Cosa succede                  | Effetto sui dati                                                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Il cliente elimina l'account  | `users` cancellato. Prenotazioni future annullate (con avviso al trainer). Prenotazioni passate tenute con `client_id` vuoto. Recensioni tenute **anonime**. Preferiti, preferenze, note del trainer su di lui: cancellati. |
| Il trainer chiude il profilo  | Profilo, servizi, orari, foto, documenti e **recensioni ricevute** cancellati (come dice il design). Prenotazioni future annullate con avviso ai clienti. L'utente resta, e torna cliente.                                  |
| Admin sospende un utente      | Solo `suspended_at`: non può accedere, i dati restano.                                                                                                                                                                      |
| Admin nasconde una recensione | `hidden_at` + `hidden_by`: sparisce dal profilo e dalla media, ma resta per eventuali contestazioni.                                                                                                                        |
| «Scarica i miei dati»         | Riga in `data_export_requests`, poi un job prepara il file.                                                                                                                                                                 |

---

## 6. Scelte (decise: tutte come raccomandato)

|     | Scelta                            | Opzioni                                                    | Deciso                                                                                                                            |
| --- | --------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A   | Nome e cognome                    | una colonna `name` (oggi) / `first_name` + `last_name`     | **Due colonne**: i form li chiedono separati, il design mostra «Giulia R.», e dividere un nome come "Lorenzo De Simone" è ambiguo |
| B   | Telefono                          | non salvarlo / `users.phone`                               | **Salvarlo** (facoltativo per il cliente, consigliato per il trainer): sblocca Telefono, WhatsApp e «Chiama»                      |
| C   | Distanza                          | solo città / coordinate + calcolo della distanza / PostGIS | **Coordinate** (`lat`, `lng`) sulle città, per le distanze tra città e per «usa la mia posizione». PostGIS solo se servirà di più |
| D   | Più studi per trainer             | uno solo / più                                             | **Più**: la registrazione già lo permette                                                                                         |
| E   | Pagamenti                         | fuori piattaforma / online                                 | **Fuori piattaforma** nella beta, come dice il design («il pagamento lo concordi tu»): salviamo solo il prezzo indicativo         |
| F   | Stati                             | testo + CHECK / tabelle                                    | **Testo + CHECK** con enum PHP (come `UserRole`); **tabelle** solo per discipline e città                                         |
| G   | Soft delete                       | `deleted_at` ovunque / cancellazione vera + `…_at` mirati  | **Cancellazione vera** + `suspended_at` / `hidden_at`: più semplice e più rispettoso del GDPR                                     |
| H   | Impostazioni notifiche            | colonne booleane / `jsonb`                                 | **`jsonb`** su `users`: sono 4 voci per il cliente e 5 per il trainer, lette sempre insieme                                       |
| I   | Registro attività admin           | tabella nostra / libreria (spatie/activitylog)             | **Tabella nostra**: serve poco, e niente librerie nuove                                                                           |
| J   | Obiettivi del trainer per il quiz | chiederli al trainer / ricavarli dalle discipline          | **Superata**: il quiz è stato tolto, e con lui `discipline_goal`                                                                  |

---

## 7. Ordine proposto delle migration

Ogni passo funziona da solo, ha i suoi test e sostituisce i dati d'esempio di alcune pagine.

1. ✅ **`users`** (`2026_10_10_000001_update_users_for_accounts`):
    - `first_name` / `last_name` (copiati dai `name` esistenti, poi `name` tolto), `phone`,
      `avatar_path`, i consensi, `notification_settings`, `password_changed_at`, `suspended_at`.
2. ✅ **Catalogo** (`2026_10_10_000000_create_catalog_tables`):
    - `cities`, `disciplines`, caricati da `CatalogSeeder` (`discipline_goal` è stata tolta col quiz);
    - sblocca la ricerca per città e Admin · Discipline e città.
3. ✅ **Profili trainer** (`2026_10_11_000000_create_trainer_profile_tables`):
    - tabelle `trainer_profiles` (con `city_id`), `trainer_profile_discipline`, `trainer_profile_city`,
      `trainer_places`, `services`, `trainer_photos`, `trainer_documents`,
      `trainer_profile_reviews`, più **`trainer_working_hours`**, anticipata dal passo 4 perché la
      registrazione chiede gli orari;
    - lo stato `draft` non c'è: serve solo per «Salva e continua dopo», ancora da fare;
    - gli slot liberi si calcolano dagli orari (`App\Support\TrainerSlots`); `next_free_slot_at`
      si aggiorna al salvataggio, all'approvazione e ogni ora (`trainers:refresh-slots`);
    - i trainer d'esempio, solo in locale, li crea `DemoTrainerSeeder`.
4. **Disponibilità**:
    - tabelle `trainer_time_off`, `calendar_connections`, `external_busy_times`;
    - sblocca la pagina Disponibilità, i blocchi del calendario e gli slot del profilo.
5. **Prenotazioni** (in parte, `2026_10_15_000000_create_bookings_tables`):
    - ✅ estensione `btree_gist`, `bookings` con il vincolo anti-sovrapposizione (solo su
      PostgreSQL), `booking_events`;
    - ✅ pulsante Prenota (`App\Actions\Bookings\CreateBooking`), Prenotazione inviata, Le mie
      prenotazioni, annullamento, scadenza (`bookings:expire`, ogni minuto), Conferma/Rifiuta in
      Oggi; gli slot liberi tolgono le prenotazioni attive;
    - ✅ `client_packages` (`2026_10_18_000000_create_client_packages_table`) e
      `bookings.client_package_id`: prenotare un pacchetto lo crea con la prima seduta, è comprato
      (`bought_at`) quando quella seduta è confermata; «Il tuo pacchetto» nel profilo prenota le
      altre a 0 €. Niente `valid_until`: i pacchetti non scadono;
    - ✅ area trainer: Panoramica, Richieste, Calendario, Clienti leggono dal database;
    - da fare: Admin · Prenotazioni.
6. **Dopo la seduta** (in parte):
    - ✅ `favorites` (`2026_10_15_000001_create_favorites_table`): il cuore e la pagina Preferiti;
    - ✅ `reviews` (`2026_10_17_000001_create_reviews_table`), per ora solo in lettura: il profilo
      pubblico mostra le ultime 3, le barre per stella (che filtrano) e tutte le recensioni
      ordinabili. `TrainerProfile::refreshRating()` ricalcola `rating_count` / `rating_sum`. Le
      recensioni d'esempio le crea `DemoTrainerSeeder`, senza prenotazione (`booking_id` vuoto);
    - ✅ il cliente scrive la recensione da «Le mie prenotazioni» (`ClientReviewController`): una per
      seduta svolta e non segnata «Saltata»; numeri di telefono, link ed email finiscono in
      `flag_reason` per il team;
    - da fare: «Svolta / Assente» del trainer, la risposta del trainer, Admin · Recensioni,
      `trainer_client_notes`.
7. **Il resto**:
    - tabelle `client_preferences`, `contact_messages`, `contact_message_replies`,
      `admin_activity_log`, `settings`, `trainer_profile_views`, `notifications`,
      `data_export_requests`.

---

## 8. Copertura delle schermate

| Pagina                                    | Tabelle                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, Ricerca                             | trainer_profiles (campi calcolati), disciplines, cities, trainer_places                                                                      |
| Profilo trainer                           | trainer_profiles, services, trainer_places, trainer_photos, trainer_documents, reviews, slot calcolati                                       |
| Contatti                                  | contact_messages                                                                                                                             |
| Privacy, Termini, Cookie, 404             | nessuna (testi statici)                                                                                                                      |
| Accedi, Registrati, Completa profilo      | users, client_preferences                                                                                                                    |
| Registrazione trainer                     | users, trainer_profiles e tabelle collegate, services, trainer_working_hours, trainer_documents                                              |
| Le mie prenotazioni, Prenotazione inviata | bookings, client_packages, favorites, reviews                                                                                                |
| Preferiti                                 | favorites, trainer_profiles                                                                                                                  |
| Impostazioni (cliente e trainer)          | users, sessions, social_accounts, data_export_requests, trainer_profiles, trainer_time_off                                                   |
| Area trainer: Oggi, Calendario, Clienti   | bookings, booking_events, trainer_time_off, external_busy_times, trainer_client_notes, client_packages, trainer_profile_views, notifications |
| Area trainer: Disponibilità, Recensioni   | trainer_working_hours, trainer_time_off, trainer_profiles (regole), reviews                                                                  |
| Admin                                     | trainer_profile_reviews, contact_messages, bookings, users, reviews, disciplines, cities, settings, admin_activity_log                       |
