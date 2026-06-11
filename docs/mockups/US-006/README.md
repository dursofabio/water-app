# Mockup US-006 — Login Google con verifica whitelist admin

Prototipo interattivo per la pagina di accesso amministratore.

## Apertura

Apri `index.html` direttamente nel browser — nessun server richiesto.

## Schermate e stati

| Stato | Descrizione |
|---|---|
| Stato iniziale | Pagina di login con pulsante "Accedi con Google" |
| Login in corso | Pulsante disabilitato + spinner + testo "Accesso in corso…" → auto-avanza a "Accesso negato" dopo 1.8s |
| Accesso negato | Banner di errore visibile sotto il pulsante (UID non in whitelist) |

## Controlli prototipo

Usa i pulsanti in basso a destra per saltare direttamente a ogni stato senza simulare il click reale.

## Direzione visiva

Coerente con il sistema dark ocean di US-003–US-005:
DM Sans + DM Mono, palette cyan-ocean, card con glass blur.
La griglia sottile di sfondo aggiunge texture "admin/tecnico" che distingue questa schermata dalla dashboard pubblica.
