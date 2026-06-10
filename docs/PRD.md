# AcquaApp - Documento dei Requisiti di Prodotto

**Autore:** ARchetipo
**Data:** 2026-06-10
**Versione:** 1.0

---

## Elevator Pitch

> Per **Fabio**, che ha il problema di **gestire manualmente su Excel i costi dell'acqua condivisi tra 4 appartamenti**, **AcquaApp** è una **web app Firebase** che **automatizza il calcolo dei costi proporzionali e tiene traccia dei saldi in tempo reale**. A differenza di **un foglio Excel condiviso**, il nostro prodotto **è sempre accessibile da mobile, calcola tutto automaticamente e permette a tutti gli inquilini di vedere il proprio saldo senza dover chiedere**.

---

## Visione

AcquaApp è uno strumento semplice e affidabile che elimina la gestione manuale dei costi idrici condivisi tra appartamenti. Il gestore (Fabio) registra ogni carico della cisterna con i pesi di consumo per persona e i pagamenti ricevuti; tutti gli inquilini possono vedere in qualsiasi momento il proprio saldo aggiornato senza bisogno di accesso admin.

### Differenziatore del Prodotto

Dashboard pubblica sempre aggiornata che mostra i saldi reali per persona, con calcolo automatico basato su quote proporzionali di consumo — zero Excel, zero calcoli manuali.

---

## Personas Utente

### Persona 1: Fabio — Il Gestore

**Ruolo:** Amministratore del sistema idrico condominiale
**Età:** 35 | **Background:** Proprietario di casa, gestisce le spese comuni tra i 4 appartamenti

**Obiettivi:**
- Registrare ogni carico della cisterna velocemente (mobile-friendly)
- Sapere chi deve quanto senza fare calcoli
- Registrare i pagamenti ricevuti in modo tracciabile
- Modificare i prezzi dell'acqua e dell'energia quando cambiano

**Pain Point:**
- Aggiornare Excel a mano è lento e soggetto a errori
- Difficile condividere la situazione aggiornata con gli altri inquilini
- Calcolare manualmente le quote proporzionali è noioso

**Comportamenti e Strumenti:** Usa Excel attualmente, sempre connesso da smartphone
**Motivazioni:** Equità e trasparenza nella divisione dei costi
**Livello Tecnologico:** Alto

#### Customer Journey - Fabio

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Primo Uso | Accede con Google, vede i dati importati dall'Excel | "Finalmente tutto qui" | Sollievo | Onboarding rapido con import storico |
| Uso Regolare | Registra un nuovo carico dal telefono in 30 secondi | "Molto più veloce dell'Excel" | Soddisfazione | Form ottimizzato per mobile |
| Pagamento Ricevuto | Registra il pagamento di Fernando | "Saldo aggiornato subito" | Controllo | Notifica opzionale all'inquilino |
| Cambio Prezzo | Aggiorna il prezzo dell'acqua da 45€ a 35€ | "I vecchi carichi restano invariati" | Fiducia | Storico prezzi mantenuto per correttezza |

---

### Persona 2: Fernando/Nino/Daniele — L'Inquilino

**Ruolo:** Residente, consumatore d'acqua
**Età:** 25-40 | **Background:** Affittuari degli appartamenti, non gestiscono le spese

**Obiettivi:**
- Sapere quanto devono senza dover chiedere a Fabio
- Vedere la storia dei propri pagamenti
- Capire come è stato calcolato il proprio debito

**Pain Point:**
- Devono chiedere a Fabio ogni volta per sapere il saldo
- Non sanno se i calcoli sono giusti

**Comportamenti e Strumenti:** Accesso da browser mobile, nessuna installazione
**Motivazioni:** Trasparenza e autonomia informativa
**Livello Tecnologico:** Medio

#### Customer Journey - Fernando

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Awareness | Riceve il link della dashboard da Fabio | "Interessante, vediamo" | Curiosità | URL semplice da condividere |
| Primo Uso | Apre la dashboard, vede il suo saldo | "Devo €83 — capito subito" | Chiarezza | Card saldo visibile above the fold |
| Uso Regolare | Controlla il saldo dopo aver pagato | "Il saldo si è aggiornato" | Fiducia | Aggiornamento real-time via Firestore |
| Domanda | Vuole capire un carico specifico | "Vedo le quote di quel giorno" | Trasparenza | Dettaglio carico espandibile |

---

## Insight dal Brainstorming

> Scoperte chiave emerse durante la sessione di inception.

### Assunzioni Messe in Discussione

- **"Solo Fabio usa l'app"** → Tutti gli inquilini beneficiano della dashboard pubblica; l'accesso trasparente riduce le frizioni nei rapporti tra coinquilini.
- **"I prezzi sono fissi"** → Il prezzo è già cambiato (45€ → 35€); lo snapshot del prezzo per carico è essenziale per la correttezza storica.
- **"Basta un Excel condiviso"** → L'Excel non è mobile-friendly, richiede accesso, e non calcola in real-time il saldo netto considerando anticipi.

### Nuove Direzioni Scoperte

- Possibile estensione futura: notifiche push quando il saldo supera una soglia
- Possibile estensione: storico variazioni prezzi con grafico nel tempo
- Possibile estensione: export PDF del riepilogo mensile

---

## Scope del Prodotto

### MVP — Minimum Viable Product

1. **Dashboard pubblica** — saldi per persona (importo dovuto/credito), lista ultimi carichi, lista ultimi pagamenti
2. **Login Google OAuth2** — solo account in whitelist Firestore possono scrivere
3. **Gestione carichi** — inserimento/modifica/cancellazione carichi cisterna con pesi per persona
4. **Gestione pagamenti** — inserimento/modifica/cancellazione pagamenti per persona
5. **Configurazione prezzi** — modifica costo acqua e costo energia; snapshot al momento del carico
6. **Import storico** — script Node.js per importare dati dal file Excel 2025_GestioneAcqua.xlsx
7. **Deploy Firebase Hosting**

### Funzionalità di Crescita (Post-MVP)

- Storico variazioni prezzi con visualizzazione grafica
- Notifiche email/push al momento di aggiornamento saldo
- Export PDF del riepilogo per persona
- Gestione multi-cisterna (per futura espansione)

### Visione (Futuro)

- App mobile nativa (Angular + Capacitor)
- Gestione di più condomini/gruppi di appartamenti dallo stesso account
- Integrazione con sistemi di pagamento (Satispay, PayPal) per registrazione automatica

---

## Architettura Tecnica

> **Proposto da:** Leonardo (Architetto)

### Architettura del Sistema

Single Page Application Angular che comunica direttamente con Firebase tramite SDK client-side. Nessun backend custom: tutta la business logic vive nel frontend (calcolo saldi) e le Security Rules Firestore gestiscono autorizzazioni.

**Pattern Architetturale:** SPA + BaaS (Backend as a Service)

**Componenti Principali:**
- `LoadsService` — CRUD carichi su Firestore, snapshot prezzi al momento inserimento
- `PaymentsService` — CRUD pagamenti su Firestore
- `ConfigService` — lettura/scrittura prezzi correnti
- `BalanceService` — calcolo saldi reattivo con Angular Signals (sum loads costs - sum payments per persona)
- `AuthService` — Google OAuth2 + verifica whitelist UID in `/admins`
- `AuthGuard` — protezione rotte admin

### Stack Tecnologico

| Layer | Tecnologia | Versione | Motivazione |
|---|---|---|---|
| Linguaggio | TypeScript | 5.x | Tipizzazione forte, allineato con Angular |
| Frontend Framework | Angular | 22 | Conoscenza utente, standalone components, Signals |
| UI Components | Angular Material | 22 | Design system coerente, accessibile |
| Firebase SDK | AngularFire | latest | Integrazione RxJS/Signals con Firestore + Auth |
| Database | Cloud Firestore | - | Real-time updates, no backend, regole di sicurezza |
| Auth | Firebase Auth + Google OAuth2 | - | Login senza password, whitelist UID |
| Hosting | Firebase Hosting | - | Deploy semplice, CDN globale, HTTPS |
| Testing | Jasmine + Karma | - | Default Angular |

### Struttura del Progetto

**Pattern organizzativo:** Feature-based con Core layer

```text
water-app/
├── src/
│   └── app/
│       ├── core/
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── loads.service.ts
│       │   │   ├── payments.service.ts
│       │   │   ├── config.service.ts
│       │   │   └── balance.service.ts
│       │   └── guards/
│       │       └── auth.guard.ts
│       ├── features/
│       │   ├── dashboard/
│       │   │   ├── dashboard.component.ts
│       │   │   ├── balance-card.component.ts
│       │   │   └── loads-list.component.ts
│       │   ├── admin/
│       │   │   ├── loads-form.component.ts
│       │   │   ├── payments-form.component.ts
│       │   │   └── config-form.component.ts
│       │   └── login/
│       │       └── login.component.ts
│       └── shared/
│           └── pipes/
│               └── currency-it.pipe.ts
├── scripts/
│   └── import-excel.ts
├── firestore.rules
└── firebase.json
```

### Ambiente di Sviluppo

Node.js 22 LTS, Angular CLI 22, Firebase CLI.

**Strumenti richiesti:** `node`, `npm`, `ng` (Angular CLI), `firebase` (Firebase CLI)

### CI/CD e Deploy

**Build tool:** Angular CLI (`ng build`)

**Pipeline:** Build locale → `firebase deploy`

**Deploy:** Firebase Hosting

**Infrastruttura target:** Firebase (Google Cloud)

### Architecture Decision Records (ADR)

**ADR-001:** Snapshot prezzi per carico
I prezzi acqua/energia vengono salvati insieme al carico al momento dell'inserimento. I prezzi futuri non alterano i calcoli storici.

**ADR-002:** Whitelist UID in Firestore
Gli admin sono definiti dalla collection `/admins/{uid}`. Le Firestore Security Rules verificano l'esistenza del documento prima di permettere scritture. Questo permette di aggiungere/rimuovere admin senza modificare le rules.

**ADR-003:** Calcolo saldi lato client con Signals
`BalanceService` combina i due stream (loads + payments) con Angular Signals per un calcolo reattivo. Non viene memorizzato il saldo in Firestore per evitare inconsistenze.

**ADR-004:** Dashboard completamente pubblica
Nessun login necessario per vedere i saldi. L'URL è condivisibile con tutti gli inquilini.

---

## Requisiti Funzionali

### RF-01 — Dashboard Pubblica
- Visualizza saldo netto per ciascuna delle 4 persone (positivo = debito, negativo = credito)
- Visualizza lista ultimi 10 carichi con: data, chi ha pagato, breakdown costi per persona
- Visualizza lista ultimi 10 pagamenti con: data, persona, importo
- Aggiornamento real-time tramite Firestore subscriptions

### RF-02 — Autenticazione Admin
- Login con account Google tramite popup OAuth2
- Verifica presenza UID in Firestore `/admins` dopo login
- Reindirizzamento a `/dashboard` se UID non autorizzato
- Logout disponibile nel menu admin

### RF-03 — Gestione Carichi
- Form inserimento: data, chi ha pagato (select), pesi per le 4 persone (numerici, default 1)
- Preview calcolo costi in tempo reale prima del salvataggio
- Prezzi correnti (acqua + energia) auto-popolati da `/config`, modificabili per override
- Lista carichi con modifica e cancellazione
- Calcolo automatico: `costo_persona = (peso / somma_pesi) * (prezzo_acqua + prezzo_energia)`

### RF-04 — Gestione Pagamenti
- Form inserimento: data, persona (select), importo, nota opzionale
- Lista pagamenti con modifica e cancellazione

### RF-05 — Configurazione Prezzi
- Form modifica prezzo acqua (€) e prezzo energia (€)
- I nuovi prezzi si applicano ai carichi futuri; quelli passati mantengono lo snapshot

### RF-06 — Import Storico Excel
- Script Node.js standalone che legge `docs/2025_GestioneAcqua.xlsx`
- Importa tutti i carichi e i pagamenti (anticipi) in Firestore
- Conversione data Excel serial → timestamp JS: `(serial - 25569) * 86400000`
- Da eseguire una sola volta prima del primo utilizzo

---

## Requisiti Non Funzionali

### Sicurezza

```
Firestore Security Rules:
- /loads, /payments, /config: lettura pubblica, scrittura solo admin verificati
- /admins: lettura per utenti autenticati, scrittura solo admin
- Verifica isAdmin() = exists(/admins/{request.auth.uid})
```

- Nessun dato sensibile nel frontend (le regole Firestore proteggono i dati)
- HTTPS obbligatorio (garantito da Firebase Hosting)

### Integrazioni

- **Firebase Auth** — provider Google OAuth2
- **Cloud Firestore** — database real-time
- **Firebase Hosting** — hosting statico con CDN
- **AngularFire** — binding Angular per Firebase SDK

---

## Prossimi Passi

1. **Backlog** — Esegui `/archetipo-spec` per trasformare questo PRD in un backlog
2. **Design** — Esegui `/archetipo-design` per i mockup UI (opzionale)
3. **Validazione** — Verifica i saldi calcolati dall'import Excel contro i totali del foglio originale

---

_PRD generato tramite ARchetipo Product Inception — 2026-06-10_
_Sessione condotta da: Fabio Durso con il team ARchetipo_
