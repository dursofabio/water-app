# AcquaApp — CLAUDE.md

Documentazione per sviluppatori e agenti AI che lavorano su questo progetto.

## Comandi di Sviluppo

| Comando | Descrizione |
|---------|-------------|
| `ng serve` | Avvia il dev server su `http://localhost:4200` con live reload |
| `ng test` | Esegue la suite di test Vitest in modalità watch |
| `ng test --watch=false` | Esegue i test una volta sola (CI-friendly) |
| `ng build` | Build di produzione nella cartella `dist/` |

## Struttura delle Directory

```
water-app/
├── src/
│   ├── app/
│   │   ├── features/          # Feature modules organizzati per dominio
│   │   │   └── dashboard/     # Dashboard placeholder
│   │   ├── app.ts             # AppComponent (root)
│   │   ├── app.config.ts      # Configurazione applicazione (providers)
│   │   ├── app.routes.ts      # Definizione delle rotte
│   │   └── app.html           # Template root
│   ├── styles.scss            # Stili globali e tema Angular Material
│   ├── index.html             # Entry point HTML
│   └── main.ts                # Bootstrap applicazione
├── docs/                      # Documentazione, PRD, mockup
├── .archetipo/                # Configurazione e backlog ARchetipo
├── angular.json               # Configurazione Angular CLI
├── package.json               # Dipendenze e script npm
└── tsconfig.json              # Configurazione TypeScript
```

## Stack Tecnologico

- **Framework:** Angular 22 (standalone components)
- **UI:** Angular Material 22 (tema Material 3)
- **Stili:** SCSS
- **Test:** Vitest (via `@angular/build`)
- **Deploy:** Firebase Hosting (`firebase deploy`)

## Agent skills

- Usare la skill `angular-developer` per generare o modificare codice Angular e per decisioni architetturali su componenti, services, Signals, `resource`, forms, dependency injection, routing, accessibilità, animazioni, styling, testing e Angular CLI.
- Prima di dare indicazioni o scrivere codice Angular, verificare la versione del progetto; per questo repo la base corrente è Angular 22.
- Dopo modifiche al codice Angular, eseguire `ng build` e correggere eventuali errori prima di considerare il lavoro completato.

## Pattern Angular per codice asincrono e AI-ready

Quando si scrive nuovo codice Angular, seguire la guida ufficiale
`https://angular.dev/ai/design-patterns`:

- Preferire Signals per lo stato locale e derivato (`signal`, `computed`, `linkedSignal` quando serve mantenere o comporre valori precedenti).
- Per dati asincroni usare `resource`, `httpResource` o `rxResource` invece di gestire manualmente loading/error/value nel componente.
- Separare sempre input live e valore inviato quando una richiesta deve partire solo su submit.
- Collocare la resource nel componente che usa direttamente il dato; spostarla in un service solo se lo stato deve essere condiviso.
- Esporre in template gli stati di loading, errore e retry tramite API della resource (`isLoading`, `status`, `error`, `reload`).
- Usare `input.required()` e `computed()` nei componenti presentazionali quando i valori visualizzati derivano dagli input.
