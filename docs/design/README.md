# Design di MioPersonal

Schermate finali del frontend, esportate dal design su Claude (57 file). Sono il **riferimento visivo** per costruire le pagine React: non vanno copiate nel codice dell'app né servite agli utenti.

## Come leggere i file

- Ogni file `.dc.html` è una schermata. Le versioni `-mobile` sono la stessa schermata su telefono.
- `{{nome}}` sono segnaposti: nell'app diventano dati veri passati dal backend tramite Inertia.
- Il blocco `<script>` in fondo (classe `Component extends DCLogic`) contiene la logica finta della demo e i dati di esempio. Serve a capire il comportamento atteso, non a essere copiato.
- I file richiamano `support.js`, il motore del tool di design, che non è incluso: aperti nel browser non si vedono correttamente. Per vederli, usate il design su Claude.
- I token di colore e il font sono in `tokens.css`, identici in tutte le schermate.

## Regole per Claude Code

- Ricostruisci ogni schermata con componenti React + shadcn/ui e classi Tailwind; non copiare gli stili inline.
- Usa i token del tema, mai colori scritti a mano.
- Testi dell'interfaccia in italiano, esattamente come nel design; codice e nomi in inglese.
- Se una schermata mostra un dato che non esiste in `docs/schema.dbml`, fermati e chiedi.

## Elenco schermate

| Schermata | Desktop | Mobile |
| --- | --- | --- |
| Completa il profilo | `Completa-profilo.dc.html` | `Completa-profilo-mobile.dc.html` |
| Prenotazione inviata | `Conferma.dc.html` | `Conferma-mobile.dc.html` |
| Le mie prenotazioni | `Dashboard-cliente.dc.html` | `Dashboard-cliente-mobile.dc.html` |
| Dashboard trainer — calendario | `Dashboard-trainer-calendario.dc.html` | `Dashboard-trainer-calendario-mobile.dc.html` |
| Dashboard trainer — clienti | `Dashboard-trainer-clienti.dc.html` | `Dashboard-trainer-clienti-mobile.dc.html` |
| Dashboard trainer — disponibilità e regole | `Dashboard-trainer-disponibilita.dc.html` | `Dashboard-trainer-disponibilita-mobile.dc.html` |
| Dashboard trainer — oggi | `Dashboard-trainer.dc.html` | `Dashboard-trainer-mobile.dc.html` |
| Accedi | `Login.dc.html` | `Login-mobile.dc.html` |
| Home | `Main.dc.html` | `Home-mobile.dc.html` |
| Profilo trainer | `Profilo.dc.html` | `Profilo-mobile.dc.html` |
| Quiz — domanda 1 di 7 | `Quiz-domanda-1.dc.html` | `Quiz-domanda-1-mobile.dc.html` |
| Quiz — domanda 2 di 7 | `Quiz-domanda-2.dc.html` | `Quiz-domanda-2-mobile.dc.html` |
| Quiz — domanda 3 di 7 | `Quiz-domanda-3.dc.html` | `Quiz-domanda-3-mobile.dc.html` |
| Quiz — domanda 4 di 7 | `Quiz-domanda-4.dc.html` | `Quiz-domanda-4-mobile.dc.html` |
| Quiz — domanda 5 di 7 | `Quiz-domanda-5.dc.html` | `Quiz-domanda-5-mobile.dc.html` |
| Quiz — domanda 6 di 7 | `Quiz-domanda-6.dc.html` | `Quiz-domanda-6-mobile.dc.html` |
| Quiz — domanda 7 di 7 | `Quiz-domanda-7.dc.html` | `Quiz-domanda-7-mobile.dc.html` |
| Quiz — introduzione | `Quiz-intro.dc.html` | `Quiz-intro-mobile.dc.html` |
| Quiz — risultati | `Quiz-risultati.dc.html` | `Quiz-risultati-mobile.dc.html` |
| Registrazione cliente | `Registrazione-cliente.dc.html` | `Registrazione-cliente-mobile.dc.html` |
| Ricerca trainer | `Ricerca.dc.html` | `Ricerca-mobile.dc.html` |
| Stati di sistema | `Stati-di-sistema.dc.html` | — |
| Registrazione trainer — passo 1 | `Trainer-passo-1.dc.html` | `Trainer-passo-1-mobile.dc.html` |
| Registrazione trainer — passo 2 | `Trainer-passo-2.dc.html` | `Trainer-passo-2-mobile.dc.html` |
| Registrazione trainer — passo 3 | `Trainer-passo-3.dc.html` | `Trainer-passo-3-mobile.dc.html` |
| Registrazione trainer — passo 4 | `Trainer-passo-4.dc.html` | `Trainer-passo-4-mobile.dc.html` |
| Registrazione trainer — passo 5 | `Trainer-passo-5.dc.html` | `Trainer-passo-5-mobile.dc.html` |
| Registrazione trainer — passo 6 | `Trainer-passo-6.dc.html` | `Trainer-passo-6-mobile.dc.html` |
| Registrazione trainer — passo 7 | `Trainer-passo-7.dc.html` | `Trainer-passo-7-mobile.dc.html` |
