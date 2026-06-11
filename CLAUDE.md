# WaterApp — CLAUDE.md

Documentazione per sviluppatori e agenti AI che lavorano su questo progetto.

## Comandi di Sviluppo

| Comando | Descrizione |
|---------|-------------|
| `npm start` | Avvia il dev server Angular su `http://localhost:4200` con live reload |
| `npm run emulators` | Avvia solo il Firestore emulator su `127.0.0.1:8080` |
| `npm run emulators:all` | Avvia tutti gli emulatori configurati, incluso Hosting |
| `ng test` | Esegue la suite di test Vitest in modalità watch |
| `ng test --watch=false` | Esegue i test una volta sola (CI-friendly) |
| `ng build` | Build di produzione nella cartella `dist/` |
| `npm run import:excel` | Importa `docs/2025_GestioneAcqua.xlsx` su Firestore emulator con document ID deterministici |
| `npm run test:import-excel` | Esegue i test parser/import idempotente dello storico Excel |

## Ambiente Locale con Firebase Emulator

In sviluppo (`npm start` / `ng serve`), l'app si connette automaticamente al Firestore emulato su `127.0.0.1:8080` tramite il flag `useEmulator: true` in `src/environments/environment.ts`. In produzione (`ng build`) usa il Firestore reale.

Non usare l'URL del Firebase Hosting emulator per verificare il frontend locale: Hosting serve la build in `dist/`, quindi usa `environment.prod.ts` e non il Firestore emulator.

## Decisioni Firestore da non perdere

- I nomi delle collection Firestore sono in inglese: `/people`, `/loads`, `/payments`, `/config`, `/admins`.
- `/people/{personId}` è la fonte di verità per le persone mostrate in dashboard. `loads` e `payments` referenziano una persona tramite `personId`; non reintrodurre liste statiche tipo `PEOPLE`.
- Il seed deve popolare anche `/people`, altrimenti la dashboard non ha persone da mostrare anche se `loads` e `payments` contengono movimenti.
- In locale usare sempre `127.0.0.1:8080` per Firestore emulator. Evitare `localhost` perché può risolversi su IPv6 `::1`, mentre l'emulatore ascolta su IPv4.
- Nel `BalanceService` evitare `collectionData` di AngularFire/RxFire: con le versioni correnti può fallire con `Expected type '_Query', but it was: a custom _CollectionReference object`. Usare `onSnapshot` e convertire lo snapshot in `Observable`.
- Quando la dashboard entra nello stato `error`, mantenere messaggi diagnostici che includano la collection fallita (`people`, `loads`, `payments`) per distinguere rules, connessione e mismatch di progetto.

**Avviare l'ambiente locale completo:**

```bash
# Terminale 1 — avvia il Firestore emulato
npm run emulators

# Terminale 2 — popola con dati di mock (mentre gli emulatori sono in esecuzione)
npm run seed

# Terminale 3 — avvia l'app
npm start
```

Aprire `http://localhost:4200` — la dashboard mostra saldi realistici per le 4 persone.

**Dati di seed inclusi:**

| Persona | Carichi | Pagamenti | Saldo | Stato |
|---------|---------|-----------|-------|-------|
| Fernando | 75 € | 100 € | -25 € | credito |
| Nino | 60 € | 30 € | +30 € | debito medio |
| Daniele | 25 € | 0 € | +25 € | debito medio |
| Fabio | 120 € | 120 € | 0 € | pari |

**Test regole Firestore** (richiede emulatori attivi):

```bash
npm run test:rules
```

## Import Storico da Excel

Lo script `npm run import:excel` legge `docs/2025_GestioneAcqua.xlsx`, verifica/crea `/people`, importa i carichi in `/loads` e gli anticipi in `/payments`.

Eseguire prima il Firestore emulator:

```bash
npm run emulators
npm run import:excel
```

Per sicurezza il comando npm imposta `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` e usa il progetto `acquaapp-dev`. I documenti importati hanno ID deterministici (`excel-load-*`, `excel-payment-*`): una seconda esecuzione si ferma se trova dati già importati. Usare `node scripts/import-excel.mjs --force` solo per sovrascrivere intenzionalmente l'import Excel esistente, mantenendo sempre `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` in locale.

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
