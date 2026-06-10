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
