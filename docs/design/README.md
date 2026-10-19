# MioPersonal · Dashboard (redesign)

Mockup di riferimento per implementare le dashboard. Non sono codice di produzione e non vanno eseguiti: leggili come specifica.

## File

| File | Schermata | Stato |
|---|---|---|
| `trainer-dashboard.html` | Area trainer · Panoramica | ✅ fatta (`pages/trainer/today.tsx`) |
| `trainer-clienti.html` | Area trainer · Clienti | ✅ fatta (`pages/trainer/clients.tsx`) |
| `trainer-calendario.html` | Area trainer · Calendario (vista settimana e mese) | ⚠️ file mancante: il Calendario esistente è stato solo portato nel nuovo stile |
| `cliente-dashboard.html` | Area cliente · Le mie prenotazioni | ✅ fatta (`pages/client/home.tsx`) |

Le pagine dell'area trainer senza design (Richieste, Disponibilità, Servizi, Recensioni,
Sedute passate, Impostazioni, Modifica profilo, Scheda cliente) usano la stessa sidebar e le
stesse card (`components/trainer/area/panel.tsx`, `page-heading.tsx`).

L'area cliente usa la stessa struttura (`layouts/client-layout.tsx`, `components/layout/client-nav.tsx`):
Trainer preferiti e Il mio profilo (Impostazioni) non hanno un design proprio e usano le stesse card.
Del design non ci sono, per scelta: la campanella "Notifiche" (per i clienti non esistono ancora) e
"Annulla l'operazione" dopo l'annullamento (una prenotazione annullata non si ripristina).

Nel codice i colori sono le variabili del tema in `resources/css/app.css`: le superfici nere
usano i token `sidebar` (`bg-sidebar`, `bg-sidebar-accent`, `text-sidebar-muted-foreground`…).
Su telefono l'area trainer tiene header e barra di schede in basso invece della sidebar sopra.

## Come leggerli

Ogni file contiene:

- un template dentro `<x-dc>`: markup della pagina con stili inline. I valori da replicare (colori, font, dimensioni, spaziature, raggi, ombre) sono negli attributi `style="…"`;
- un blocco `<helmet><style>`: font Google (Geist) e poche regole globali (hover, focus);
- uno script `class Component extends DCLogic`: stato e dati di esempio. `renderVals()` mostra i dati e le interazioni (tab, selezione, filtri, conferma annullamento).

Sintassi del template:

- `{{nome}}` è un valore calcolato in `renderVals()`;
- `<sc-for list="{{x}}" as="y">` ripete il contenuto per ogni elemento;
- `<sc-if value="{{x}}">` lo mostra solo se la condizione è vera.

## Sistema visivo

- Font: Geist (400/500/600/700)
- Nero: `#0a0a0a` (superfici principali, sidebar, card in evidenza), `#171717` / `#262626` (livelli su nero)
- Sfondo pagina: `#f4f4f5`; card: `#ffffff` con bordo `#e4e4e7`
- Testo secondario: `#525252`; terziario: `#737373` / `#a3a3a3` su nero
- Raggi: 20–24px card, 10–14px pulsanti e righe, pill `9999px`
- Target cliccabili minimo 44px
- Layout: sidebar nera a sinistra (248px) + contenuto con max-width ~1120px; sotto ~900px la sidebar va sopra il contenuto (flex-wrap)
