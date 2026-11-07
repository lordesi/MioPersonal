# Guida: collegamento dei social dei trainer

Cosa fare, passo per passo, per attivare i pulsanti «Collega Instagram / TikTok / Facebook / YouTube» su MioPersonal. È scritta per chi gestisce il progetto, non serve saper programmare.

> Aggiornata a novembre 2026. Le console di Meta, TikTok e Google cambiano spesso nomi e menu: se qualcosa non corrisponde, cerca la voce con un nome simile. Le regole delle piattaforme vanno ricontrollate al momento di fare richiesta.

---

## 1. La situazione in breve

**Il codice è pronto e già nel progetto.** Finché non inserite le chiavi di una piattaforma, il suo pulsante «Collega» non compare. Il trainer vede solo il campo Instagram da scrivere a mano, come oggi. Il deploy si può quindi fare subito, senza rischi.

Per accendere un pulsante servono due cose:

1. **Un'app sulla console sviluppatori** della piattaforma: un account gratuito che dà un ID e una chiave segreta da mettere sul server.
2. **L'approvazione della piattaforma** (App Review). Senza, possono collegarsi solo le persone aggiunte a mano come «tester»: voi, non i trainer veri.

## 2. Si può fare senza essere una società?

Dipende dalla piattaforma.

| Piattaforma          | Senza società                       | Cosa serve                                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **YouTube** (Google) | **Sì**                              | Dominio verificato, privacy policy, un video. Google non chiede una società.                                                                                                                                                                  |
| **TikTok**           | **Probabilmente sì, da verificare** | Dominio verificato, privacy e termini sul sito, una revisione. Quando create l'app vi chiede se siete «Individual» o «Organization». Alcune guide non ufficiali dicono che per andare online serve «Organization»: lo scoprite creando l'app. |
| **Instagram**        | **No, per ora**                     | Meta chiede la **Business Verification**, cioè documenti di un'attività registrata, prima di aprire il collegamento a chi non è tester.                                                                                                       |
| **Facebook**         | **No, per ora**                     | Stessa app e stessa verifica di Instagram.                                                                                                                                                                                                    |

**Cosa significa per Instagram e Facebook.** Senza verifica, l'app Meta resta in «Standard Access» e funziona solo per gli account delle persone con un ruolo sull'app. Non è un modo realistico di aprirla a tutti i trainer. La verifica di Meta di solito richiede documenti dell'attività, come la visura camerale o il certificato di attribuzione della partita IVA. Una ditta individuale con partita IVA in genere basta; una persona fisica senza partita IVA, quasi certamente no.

**Nel frattempo il sito funziona comunque.** Il campo Instagram scritto a mano resta, e sul profilo pubblico compare l'icona che apre Instagram. Senza il segno «collegato», ma il cliente arriva lo stesso al profilo.

### Le tre strade possibili

- **A. Partire da YouTube e TikTok adesso, Meta quando avrete una partita IVA o una società.** È quella consigliata.
- **B. Aprire subito una partita IVA** (ditta individuale) per sbloccare anche Meta. È una decisione fiscale: parlatene con un commercialista. Probabilmente vi servirà comunque quando il sito inizierà a guadagnare.
- **C. Aspettare la società** e nel frattempo usare solo il campo manuale.

> Nota a parte: anche la privacy del sito ha bisogno di un «titolare del trattamento». Oggi nella pagina ci sono dei segnaposto. Può essere una persona fisica, ma va scritto chi è. Da sistemare prima del lancio, a prescindere dai social.

---

## 3. Chi fa cosa

| Cosa                                              | Chi                                                    |
| ------------------------------------------------- | ------------------------------------------------------ |
| Codice dei collegamenti, correzioni dopo le prove | Claude (già fatto; le correzioni quando provate)       |
| Commit e push su GitHub                           | Claude, quando glielo chiedete                         |
| Deploy su Ploi                                    | Voi, insieme (come sempre: Ploi non fa deploy da solo) |
| Creare gli account sviluppatore e le app          | Voi: servono i vostri account personali                |
| Inserire le chiavi nell'`.env` di Ploi            | Voi                                                    |
| Registrare i video per l'approvazione             | Voi (Claude può scrivere la scaletta)                  |
| Compilare i moduli di approvazione                | Voi (Claude può scrivere i testi)                      |
| Verifica di Meta e partita IVA / società          | Voi, con il commercialista                             |

---

## 4. Passo 0: il deploy (da fare per primo)

1. Chiedete a Claude di fare il commit delle modifiche e il push su `main`.
2. Su Ploi fate il deploy come al solito.
3. Controllate che lo script di deploy esegua `php artisan migrate --force` (c'è una tabella nuova, `trainer_social_accounts`) e la build del frontend. Se i deploy precedenti con migration sono andati bene, è già così.
4. Aprite il sito e controllate che in «Il mio profilo» di un trainer ci sia ancora il campo Instagram. Deve essere tutto come prima.

Da qui in poi tutto si fa **sul sito online**, non in locale: le piattaforme vogliono un indirizzo HTTPS vero, e Google non accetta gli indirizzi `.test`.

---

## 5. Prima di qualsiasi piattaforma: tre cose sul sito

Tutte e tre le piattaforme controllano questi punti. Conviene sistemarli una volta sola.

1. **La home pubblica** (`https://miopersonal.it`) deve essere visibile senza login e far capire cos'è il servizio. ✅ C'è già.
2. **La privacy policy** (`/privacy`) completa, **senza segnaposto**. Oggi ci sono ancora `[nome del fornitore]`, `[X] giorni` e il titolare da compilare: le piattaforme rifiutano le pagine incomplete. ⚠️ Da completare.
3. **I termini e condizioni** (`/termini`), visibili e raggiungibili dal footer senza aprire menu. ✅ Ci sono già, ma vanno ricontrollati.

La sezione sui social nella privacy è già scritta (dati raccolti, chi li vede, come scollegarli).

---

## 6. YouTube (Google): si può fare subito

### 6.1 Verificare il dominio

1. Andate su [search.google.com/search-console](https://search.google.com/search-console) con l'account Google che userete per il progetto.
2. Aggiungete la proprietà **Dominio** `miopersonal.it`.
3. Google vi dà un record **TXT**: inseritelo nei DNS del dominio, dal pannello del provider dove l'avete comprato.
4. Aspettate la conferma (da pochi minuti a qualche ora).

Questo serve anche per Google Search, quindi è utile comunque.

### 6.2 Creare l'app

1. Andate su [console.cloud.google.com](https://console.cloud.google.com). Se avete già un progetto per «Continua con Google», usate quello.
2. **API e servizi → Libreria**: cercate **YouTube Data API v3** e premete **Abilita**.
3. **API e servizi → Schermata consenso OAuth** (o «Google Auth Platform → Branding»):
    - nome app: `MioPersonal`;
    - email di assistenza: la vostra;
    - logo: quello del sito (facoltativo, ma poi va verificato anche quello);
    - dominio dell'app: home `https://miopersonal.it`, privacy `https://miopersonal.it/privacy`, termini `https://miopersonal.it/termini`;
    - domini autorizzati: `miopersonal.it`.
4. **Ambiti** (Scopes / «Accesso ai dati»): aggiungete `https://www.googleapis.com/auth/youtube.readonly`.
5. **Utenti di test**: aggiungete le vostre email.
6. **Credenziali → Crea credenziali → ID client OAuth**, tipo **Applicazione web**:
    - URI di reindirizzamento autorizzati: `https://miopersonal.it/social/youtube/callback`.
7. Copiate **ID client** e **Client secret**.

### 6.3 Inserire le chiavi su Ploi

Su Ploi: sito → **Environment**. Aggiungete:

```
YOUTUBE_CLIENT_ID=il-tuo-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=il-tuo-secret
```

Salvate e poi eseguite `php artisan config:cache` (o rifate il deploy), altrimenti il sito non vede le nuove chiavi.

### 6.4 Provare

1. Entrate sul sito con un account trainer di prova.
2. «Il mio profilo» → sezione 1 → **Social** → **Collega** accanto a YouTube.
3. Fate il login con un account Google di test **che abbia un canale YouTube con un handle** (@nome).
4. Deve comparire «Collegato · @nome». Sul profilo pubblico deve esserci l'icona di YouTube.
5. Se qualcosa va storto, copiate il messaggio d'errore (anche quello nella finestra di Google) e mandatelo a Claude.

### 6.5 Chiedere l'approvazione

Finché l'app è «In test», funziona solo per gli utenti di test (massimo 100).

1. Nella schermata consenso premete **Pubblica app** (passa a «In produzione»).
2. Google vi chiede la **verifica** per lo scope sensibile. Vi serviranno:
    - **la motivazione**, per esempio: _«Il personal trainer collega il proprio canale YouTube per mostrarne il link sul suo profilo pubblico di MioPersonal. Leggiamo solo ID e handle del canale; non pubblichiamo né modifichiamo nulla.»_;
    - **un video** (caricato su YouTube come «non in elenco») che mostri: l'indirizzo del sito nella barra, il login del trainer, il pulsante «Collega YouTube», la schermata di consenso di Google con il nome dell'app e lo scope visibili, il ritorno sul sito con «Collegato», e l'icona sul profilo pubblico.
3. Tempi: di solito qualche giorno lavorativo, a volte di più. Rispondete alle loro email: a volte chiedono piccole correzioni.

> Finché l'app è in produzione ma non ancora verificata, gli utenti vedono un avviso «App non verificata» e il limite è di 100 utenti. Va bene per le prove, non per il lancio.

---

## 7. TikTok: si prova subito

### 7.1 Creare l'account e l'app

1. Andate su [developers.tiktok.com](https://developers.tiktok.com) e accedete con un account TikTok.
2. **Manage apps → Connect an app** (o «Create app»).
3. Quando chiede **Individual / Organization**, scegliete **Individual**. **Leggete cosa dice:** se per la pubblicazione chiede un'organizzazione, scrivetelo a Claude e mettiamo TikTok in attesa insieme a Meta.
4. Compilate:
    - nome app: `MioPersonal`; icona: il logo;
    - categoria: lifestyle o simile;
    - descrizione, per esempio: _«MioPersonal è un marketplace di personal trainer. Il trainer collega il suo account TikTok per mostrare il link al suo profilo sulla pagina pubblica.»_;
    - Terms of Service URL: `https://miopersonal.it/termini`;
    - Privacy Policy URL: `https://miopersonal.it/privacy`;
    - piattaforma: **Web**, Website URL `https://miopersonal.it`.
5. **Verificate gli URL** (obbligatorio). TikTok vi fa verificare la proprietà di dominio, privacy e termini, con un record DNS o con un file da caricare. **Il record DNS sul dominio è la strada più semplice.** Se vi chiede un file da mettere sul sito, mandatelo a Claude: va messo nella cartella `public/` e rifatto il deploy.
6. **Add products → Login Kit**:
    - Redirect URI: `https://miopersonal.it/social/tiktok/callback`;
    - scope: `user.info.basic` e `user.info.profile` (il secondo serve per il nome utente).
7. In **Sandbox** aggiungete i vostri account TikTok come target/tester.
8. Copiate **Client key** e **Client secret**.

### 7.2 Chiavi su Ploi

```
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
```

Poi `php artisan config:cache` o il deploy.

### 7.3 Provare

Come per YouTube (punto 6.4), con un account TikTok di test. Deve comparire «Collegato · @nome» e l'icona sul profilo pubblico.

### 7.4 Chiedere l'approvazione

1. **Submit for review**.
2. Spiegazione di come usate Login Kit: la stessa frase della descrizione, più _«leggiamo solo open_id, nome visualizzato e nome utente; non conserviamo il token»_.
3. Video: come per Google, ma con la schermata di autorizzazione di TikTok. **Il sito nel video deve essere lo stesso dominio configurato.**
4. TikTok non dà tempi garantiti. Se rifiuta, di solito spiega il motivo: mandatelo a Claude.

---

## 8. Instagram e Facebook (Meta): quando avrete partita IVA o società

Fino ad allora potete fare solo i primi passi e le prove con i vostri account. Instagram resta comunque disponibile con il campo scritto a mano.

### 8.1 Cosa si può fare già ora (facoltativo)

1. Andate su [developers.facebook.com](https://developers.facebook.com), accedete con Facebook e registratevi come sviluppatori.
2. **Le mie app → Crea app**, tipo **Business** (obbligatorio per Instagram).
3. Aggiungete il prodotto **Instagram → API setup with Instagram login**:
    - redirect URI: `https://miopersonal.it/social/instagram/callback`;
    - permesso: `instagram_business_basic`.
4. Nei ruoli dell'app (**Ruoli app → Tester Instagram**) aggiungete il vostro account Instagram, che deve essere **professionale** (creator o business). Poi accettate l'invito dall'app Instagram.
5. Copiate **Instagram app ID** e **Instagram app secret**.
6. Su Ploi:
    ```
    INSTAGRAM_CLIENT_ID=...
    INSTAGRAM_CLIENT_SECRET=...
    ```

> ⚠️ **Attenzione:** appena mettete queste chiavi, il pulsante «Collega Instagram» compare a **tutti** i trainer, ma funziona solo per i tester. Per le prove di Meta, chiedete prima a Claude la **modalità test** (pulsante visibile solo agli admin o a una lista di email), oppure togliete le chiavi dopo le prove.

### 8.2 Quando avrete la partita IVA o la società

1. **Business Manager / Meta Business Suite** ([business.facebook.com](https://business.facebook.com)): create un **portfolio business** con i dati dell'attività.
2. **Centro sicurezza → Verifica dell'azienda**: caricate i documenti richiesti (visura camerale o certificato di partita IVA, più un documento con indirizzo, per esempio una bolletta intestata all'attività). I tempi vanno da pochi giorni a qualche settimana.
3. Collegate l'app al portfolio verificato (impostazioni dell'app → Base → portfolio business).
4. **App Review**: chiedete l'**Advanced Access** per `instagram_business_basic`, con:
    - la descrizione di come lo usate (come per TikTok);
    - il video (login trainer → «Collega Instagram» → consenso di Instagram → «Collegato» → icona sul profilo);
    - **l'URL per le istruzioni di cancellazione dei dati**: `https://miopersonal.it/privacy#conservazione` (lì è spiegato che basta premere «Scollega»).
5. Una volta approvato, mettete l'app in modalità **Live**.

### 8.3 Facebook (nella stessa app Meta)

1. Aggiungete il prodotto **Facebook Login** (o «Facebook Login for Business»):
    - redirect URI: `https://miopersonal.it/social/facebook/callback`;
    - permessi: `public_profile` e `user_link`.
2. Copiate **App ID** e **App secret** (quelli generali dell'app, diversi da quelli Instagram):
    ```
    FACEBOOK_CLIENT_ID=...
    FACEBOOK_CLIENT_SECRET=...
    ```
3. Provate con il vostro account. **Va controllato che link restituisce Facebook:** potrebbe non essere un indirizzo pubblico leggibile. Se il link non apre il profilo, ditelo a Claude: si può passare alle **Pagine Facebook**, più adatte a un trainer.
4. Nella stessa App Review di Instagram chiedete anche `user_link`.

---

## 9. Riepilogo delle chiavi da inserire su Ploi

| Piattaforma | Variabili                                        | Redirect URI da registrare                         |
| ----------- | ------------------------------------------------ | -------------------------------------------------- |
| YouTube     | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`     | `https://miopersonal.it/social/youtube/callback`   |
| TikTok      | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`      | `https://miopersonal.it/social/tiktok/callback`    |
| Instagram   | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | `https://miopersonal.it/social/instagram/callback` |
| Facebook    | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`   | `https://miopersonal.it/social/facebook/callback`  |

Dopo ogni modifica all'`.env`: `php artisan config:cache`, oppure un nuovo deploy.

**Le chiavi segrete non vanno mai** in chat pubbliche, su GitHub o negli screenshot del video. Se una finisce in giro, rigeneratela dalla console.

---

## 10. Checklist in ordine

- [ ] Claude: commit e push delle modifiche.
- [ ] Voi: deploy su Ploi e controllo che tutto sia come prima.
- [ ] Voi: completare la privacy (titolare, fornitori, tempi `[X]`) e ricontrollare i termini.
- [ ] Claude (se volete): modalità test per mostrare «Collega» solo agli admin durante le prove.
- [ ] Voi: verificare il dominio su Google Search Console.
- [ ] Voi: app Google per YouTube, chiavi su Ploi, prova, richiesta di verifica.
- [ ] Voi: app TikTok (vedere se accetta «Individual»), verifica URL, chiavi, prova, richiesta di revisione.
- [ ] Voi + commercialista: decidere su partita IVA o società.
- [ ] Voi: verifica dell'azienda su Meta, poi app Instagram + Facebook, prova, App Review.
- [ ] Claude: correzioni dopo ogni prova vera, se servono.

## 11. Cosa chiedere a Claude quando serve

- «Fai il commit e il push dei social».
- «Aggiungi la modalità test per i social».
- «Scrivimi i testi per la revisione di [piattaforma]».
- «Scrivimi la scaletta del video per [piattaforma]».
- «Collegando [piattaforma] esce questo errore: …» (incollate il messaggio, mai le chiavi).
- «TikTok vuole un'organizzazione: mettiamolo in attesa».
- «Il link di Facebook non apre il profilo: passiamo alle Pagine».

---

### Fonti (controllate a novembre 2026)

- Meta, Instagram Platform: [panoramica e livelli di accesso](https://developers.facebook.com/docs/instagram-platform/overview/), [creare un'app per Instagram](https://developers.facebook.com/documentation/development/create-an-app/other-app-types/instagram-apis.md), [access levels](https://developers.facebook.com/docs/graph-api/overview/access-levels/)
- TikTok: [creare un'app e verificare gli URL](https://developers.tiktok.com/docs/en/getting-started-create-an-app), [linee guida per la revisione](https://developers.tiktok.com/docs/en/app-review-guidelines)
- Google: [verifica degli scope sensibili](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
