# US-019 - Mockup UI/UX con Taste Skill v2

## Design Read

Reading this as: dashboard operativa mobile-first per residenti e Fabio, con linguaggio dark Material 3, gerarchia immediata sul saldo e dettaglio del calcolo come secondo livello informativo.

## Scelte visuali

- Tema scuro preservato, con palette bloccata su base oceano scuro e un solo accento ciano coerente con AcquaApp.
- La prima schermata mostra tutte le persone con una card ciascuna: nessuna persona viene privilegiata come default.
- Ogni card contiene sia saldo sia calcolo: fronte per importo/stato, retro al tap/click per carichi, pagamenti e saldo.
- La barra in basso alla card suggerisce la presenza di un secondo livello informativo senza creare una sezione separata.
- Forma coerente: raggio 18px per card e pannelli principali, 12px per avatar, pill solo per chip e stato.

## Tradeoff

- La vista principale privilegia la comparazione tra persone rispetto a una singola card hero, per evitare ambiguita su quale saldo sia piu importante.
- Il flip e piu memorabile di un accordion, ma l'implementazione reale dovra rispettare `prefers-reduced-motion` e mantenere un fallback accessibile.
- Le liste movimenti restano sotto il riepilogo per non rubare priorita alla risposta principale.
- Le micro-interazioni sono volutamente leggere e riproducibili in Angular/Material senza introdurre nuove dipendenze.
- Con `prefers-reduced-motion: reduce`, la card non ruota in 3D: il fronte viene nascosto e il retro appare direttamente.

## Hard Pre-Flight Check Taste Skill

- Color consistency lock: PASS. Accento unico ciano; stati saldo limitati a debito, credito, pari.
- Shape consistency lock: PASS. Raggi documentati e applicati con regola stabile.
- Page theme lock: PASS. Nessuna landing page, nessun tema generico o AI-purple.
- No nested cards: PASS. Pannelli e righe non annidano card decorative.
- No manual decorative SVG: PASS. L'unico SVG e il simbolo prodotto gia coerente con i mockup precedenti.
- Mobile-first hierarchy: PASS. Su mobile saldo/stato e aggiornamento dati appaiono prima del dettaglio.
- Desktop verification: PASS. Screenshot Playwright generato in `docs/test-results/US-019-desktop.png` a 1280x720.
- Mobile verification: PASS. Screenshot Playwright generato in `docs/test-results/US-019-mobile.png` a 390x844.
- Flip verification: PASS. Screenshot Playwright generato in `docs/test-results/US-019-mobile-flip.png`.

## File

- `index.html`: mockup navigabile.
- `shared.css`: token, layout base e top bar.
- `dashboard-taste.css`: composizione dashboard e componenti.
- `app.js`: interazione flip fronte/retro delle card persona.
