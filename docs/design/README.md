# Design di MioPersonal

Cartella per le **nuove** schermate di riferimento. Quelle originali sono già state ricostruite
in React e tolte da qui.

## Aggiungere un design

- Metti qui i file esportati (una schermata per file; `-mobile` per la versione da telefono) e
  aggiorna l'elenco qui sotto.
- Sono un riferimento visivo da **ricostruire** con componenti React + shadcn/ui e classi
  Tailwind: non copiare l'HTML né gli stili inline.
- I colori sono quelli del tema in `resources/css/app.css`: usa le classi del tema
  (`bg-primary`, `text-muted-foreground`…), mai colori scritti a mano.
- Testi dell'interfaccia in italiano, esattamente come nel design; codice e nomi in inglese.
- `{{nome}}` sono segnaposti: nell'app diventano dati veri passati dal backend tramite Inertia.

## Schermate da fare

_Nessuna, per ora._

## Le schermate originali

Sono nella storia di git. Per riaverle in locale:

```bash
git checkout 0895b19 -- docs/design
```
