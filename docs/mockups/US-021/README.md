# US-021 - UX admin mobile-first per operazioni ricorrenti

## Design Read

Reading this as: area admin operativa per Fabio da telefono, non dashboard marketing. La priorita e ridurre attrito nelle azioni ricorrenti mantenendo orientamento tra carichi, pagamenti, configurazione e dashboard pubblica.

## Direzione visuale

- Continuita con US-019/US-020: base oceano scuro, accento ciano, card/pannelli compatti e nessun layout da landing.
- Navigazione admin esplicita: top bar con ritorno alla dashboard pubblica, quick actions sopra il contenuto, bottom nav mobile per le sezioni principali.
- Form carico in un flusso verticale leggibile: dettagli, pesi, preview costi, azioni sticky.
- Preview costi trattata come oggetto di confronto, con importo totale e quote per persona visibili prima del salvataggio.
- Liste admin con gerarchia separata: contenuto del movimento, importo, azione primaria di modifica e azione distruttiva distinta.

## Tradeoff

- Il mockup mostra una schermata composita invece di quattro pagine separate per evidenziare il sistema di navigazione e la coerenza tra superfici.
- Il bottom nav e previsto solo per viewport mobile; su desktop diventa un controllo sticky alto per non duplicare pattern di app mobile.
- Le icone sono simboli testuali nel mockup statico; l'implementazione Angular dovrebbe usare icone Material/lucide coerenti con il progetto.
- La palette resta vicina a US-019 per non introdurre una nuova direzione estetica in EP-007.

## Taste Skill v2 checklist

- Mobile-first hierarchy: PASS. Azioni ricorrenti e CTA principali sono raggiungibili nel primo scroll.
- Color consistency lock: PASS. Accento ciano dominante, energia solo come stato semantico locale.
- Shape consistency lock: PASS. Raggi 8px/12px coerenti con UI operativa.
- Page theme lock: PASS. Tema scuro operativo, niente hero marketing o decorazioni generiche.
- No nested cards: PASS. I pannelli contengono righe e controlli, non card decorative annidate.
- Touch targets: PASS. Bottoni e input principali >= 44px.
- Form clarity: PASS. Label, helper text, validita bozza e azioni sticky sono visibili.
- CRUD action clarity: PASS. Modifica e cancellazione sono separate e la cancellazione usa colore danger.

## File

- `index.html`: prototipo navigabile.
- `shared.css`: token, top bar, bottoni e bottom nav.
- `admin-mobile.css`: layout admin, form, preview, liste e responsive.
