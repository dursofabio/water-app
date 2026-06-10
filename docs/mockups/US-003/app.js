/**
 * AcquaApp — Dashboard Mockup Prototype
 * US-003: Saldi per persona sulla dashboard pubblica
 *
 * Simulates: loading state → real-time data render → live update
 */

'use strict';

// ── Dati mockup ────────────────────────────────────────────────
// Valori fissi che simulano lo stato reale del DB.
// Saldo netto = somma costi carichi - somma pagamenti (positivo = debito, negativo = credito)

const PERSONE = [
  {
    id: 'fernando',
    nome: 'Fernando',
    iniziali: 'Fe',
    // somma carichi: €127.50, pagamenti: €40.00 → saldo: +87.50 (debito alto)
    carichiTotale: 127.50,
    pagamentiTotale: 40.00,
  },
  {
    id: 'nino',
    nome: 'Nino',
    iniziali: 'Ni',
    // somma carichi: €98.20, pagamenti: €70.00 → saldo: +28.20 (debito moderato)
    carichiTotale: 98.20,
    pagamentiTotale: 70.00,
  },
  {
    id: 'daniele',
    nome: 'Daniele',
    iniziali: 'Da',
    // somma carichi: €63.80, pagamenti: €80.00 → saldo: -16.20 (credito)
    carichiTotale: 63.80,
    pagamentiTotale: 80.00,
  },
  {
    id: 'fabio',
    nome: 'Fabio',
    iniziali: 'Fa',
    // somma carichi: €0.00, pagamenti: €0.00 → saldo: 0 (zero, gestore)
    carichiTotale: 0.00,
    pagamentiTotale: 0.00,
  },
];

// ── Helpers ────────────────────────────────────────────────────

/**
 * Formatta un importo in Euro (notazione italiana: virgola decimale)
 */
function formatEuro(valore) {
  const abs = Math.abs(valore);
  const str = abs.toFixed(2).replace('.', ',');
  return str;
}

/**
 * Calcola il saldo netto e il relativo stato semantico.
 * Saldo positivo = debito (deve pagare)
 * Saldo negativo = credito (gli devono)
 * Saldo zero     = pari
 */
function calcolaSaldo(persona) {
  const saldo = persona.carichiTotale - persona.pagamentiTotale;
  let stato;
  if (saldo > 30) stato = 'debt-high';
  else if (saldo > 0) stato = 'debt-mid';
  else if (saldo < 0) stato = 'credit';
  else stato = 'zero';

  return { saldo, stato };
}

function statoLabel(stato) {
  switch (stato) {
    case 'debt-high': return 'Debito';
    case 'debt-mid':  return 'Debito';
    case 'credit':    return 'Credito';
    case 'zero':      return 'In pari';
  }
}

// ── Costruzione card HTML ──────────────────────────────────────

function buildCard(persona, { saldo, stato }) {
  const card = document.createElement('article');
  card.className = 'balance-card is-loading';
  card.dataset.state = stato;
  card.dataset.personaId = persona.id;
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', `Saldo di ${persona.nome}`);

  // Skeleton (visibile solo durante is-loading)
  const skeleton = document.createElement('div');
  skeleton.className = 'card-skeleton';
  skeleton.innerHTML = `
    <span class="skeleton-line" style="width:40px; height:10px"></span>
    <span class="skeleton-line" style="width:80%; height:40px; margin-top:8px"></span>
    <span class="skeleton-line" style="width:60%; height:8px; margin-top:12px"></span>
  `;

  // Header row: avatar + stato
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class="card-avatar" aria-hidden="true">${persona.iniziali}</div>
    <div class="card-status-indicator">
      <span class="status-dot"></span>
      <span class="card-status-label">${statoLabel(stato)}</span>
    </div>
  `;

  // Nome
  const nome = document.createElement('p');
  nome.className = 'card-name';
  nome.textContent = persona.nome;

  // Importo principale
  const amount = document.createElement('p');
  amount.className = 'card-amount';
  amount.setAttribute('aria-label', `${formatEuro(saldo)} euro`);

  const prefix = saldo < 0 ? '−' : (saldo > 0 ? '+' : '');
  amount.innerHTML = `
    <span class="card-amount__currency" aria-hidden="true">€</span>${prefix}${formatEuro(saldo)}
  `;

  // Breakdown dettaglio
  const breakdown = document.createElement('div');
  breakdown.className = 'card-breakdown';
  breakdown.setAttribute('aria-label', 'Dettaglio calcolo');
  breakdown.innerHTML = `
    <div class="card-breakdown__row">
      <span class="card-breakdown__label">Carichi</span>
      <span class="card-breakdown__value">€${formatEuro(persona.carichiTotale)}</span>
    </div>
    <div class="card-breakdown__row">
      <span class="card-breakdown__label">Pagamenti</span>
      <span class="card-breakdown__value">€${formatEuro(persona.pagamentiTotale)}</span>
    </div>
  `;

  card.appendChild(skeleton);
  card.appendChild(header);
  card.appendChild(nome);
  card.appendChild(amount);
  card.appendChild(breakdown);

  return card;
}

// ── Render iniziale ────────────────────────────────────────────

function renderCards(container) {
  container.innerHTML = '';
  const cards = PERSONE.map(p => {
    const result = calcolaSaldo(p);
    return buildCard(p, result);
  });
  cards.forEach(c => container.appendChild(c));
  return cards;
}

// ── Simulazione loading → dati ─────────────────────────────────

function simulateLoading(cards) {
  // Dopo 1.1s simuliamo la risposta Firestore rimuovendo is-loading
  setTimeout(() => {
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.classList.remove('is-loading');
      }, i * 90); // stagger leggero
    });
  }, 1100);
}

// ── Simulazione real-time update ───────────────────────────────
// Dopo 5s, il saldo di Fernando cambia (come se arrivasse un snapshot Firestore)

function simulateRealtimeUpdate(container) {
  setTimeout(() => {
    const fernandoCard = container.querySelector('[data-persona-id="fernando"]');
    if (!fernandoCard) return;

    // Aggiorniamo il dato: Fernando paga €40 in più
    PERSONE[0].pagamentiTotale += 40;
    const result = calcolaSaldo(PERSONE[0]);

    // Flash per segnalare l'update (come un Firestore onSnapshot)
    fernandoCard.style.transition = 'background 0.15s ease';
    fernandoCard.style.background = 'rgba(6, 182, 212, 0.12)';

    setTimeout(() => {
      // Aggiorna lo stato del card
      fernandoCard.dataset.state = result.stato;

      // Aggiorna label
      const label = fernandoCard.querySelector('.card-status-label');
      if (label) label.textContent = statoLabel(result.stato);

      // Aggiorna importo
      const amount = fernandoCard.querySelector('.card-amount');
      if (amount) {
        const prefix = result.saldo < 0 ? '−' : (result.saldo > 0 ? '+' : '');
        amount.innerHTML = `
          <span class="card-amount__currency" aria-hidden="true">€</span>${prefix}${formatEuro(result.saldo)}
        `;
        amount.style.animation = 'none';
        amount.offsetHeight; // reflow
        amount.style.animation = '';
      }

      // Aggiorna breakdown
      const breakdown = fernandoCard.querySelector('.card-breakdown');
      if (breakdown) {
        breakdown.innerHTML = `
          <div class="card-breakdown__row">
            <span class="card-breakdown__label">Carichi</span>
            <span class="card-breakdown__value">€${formatEuro(PERSONE[0].carichiTotale)}</span>
          </div>
          <div class="card-breakdown__row">
            <span class="card-breakdown__label">Pagamenti</span>
            <span class="card-breakdown__value">€${formatEuro(PERSONE[0].pagamentiTotale)}</span>
          </div>
        `;
      }

      // Ripristina sfondo
      fernandoCard.style.background = '';
      setTimeout(() => {
        fernandoCard.style.transition = '';
      }, 300);

      // Aggiorna timestamp UI
      const timeEl = document.getElementById('last-update');
      if (timeEl) {
        const now = new Date();
        const opts = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        timeEl.textContent = now.toLocaleString('it-IT', opts);
      }
    }, 180);
  }, 5000);
}

// ── Empty state (collezioni vuote) ─────────────────────────────
// Aggiunge un pulsante toggle per dimostrare il caso "saldo 0 senza errori"

function addEmptyStateToggle() {
  const section = document.querySelector('.section');
  if (!section) return;

  const toggle = document.createElement('button');
  toggle.className = 'demo-toggle';
  toggle.textContent = 'Mostra stato: collezioni vuote';
  toggle.style.cssText = `
    margin-top: 1rem;
    padding: 0.4rem 1rem;
    font-size: 0.75rem;
    font-family: var(--font-sans);
    font-weight: 500;
    background: transparent;
    color: var(--text-muted, #4a7e8a);
    border: 1px solid var(--border-card, rgba(103,232,249,0.14));
    border-radius: 6px;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: color 0.2s, border-color 0.2s;
    display: block;
  `;

  let isEmpty = false;
  toggle.addEventListener('click', () => {
    isEmpty = !isEmpty;
    const grid = document.getElementById('balance-grid');
    if (!grid) return;

    const allCards = grid.querySelectorAll('.balance-card');
    allCards.forEach(card => {
      const amountEl = card.querySelector('.card-amount');
      const statusEl = card.querySelector('.card-status-label');
      const breakdownRows = card.querySelectorAll('.card-breakdown__value');

      if (isEmpty) {
        // Azzera tutto
        card.dataset.state = 'zero';
        if (amountEl) amountEl.innerHTML = '<span class="card-amount__currency" aria-hidden="true">€</span>0,00';
        if (statusEl) statusEl.textContent = 'In pari';
        breakdownRows.forEach(r => r.textContent = '€0,00');
        toggle.textContent = 'Ripristina dati esempio';
      } else {
        // Ripristina
        const persona = PERSONE.find(p => p.id === card.dataset.personaId);
        if (!persona) return;
        const result = calcolaSaldo(persona);
        card.dataset.state = result.stato;
        const prefix = result.saldo < 0 ? '−' : (result.saldo > 0 ? '+' : '');
        if (amountEl) amountEl.innerHTML = `<span class="card-amount__currency" aria-hidden="true">€</span>${prefix}${formatEuro(result.saldo)}`;
        if (statusEl) statusEl.textContent = statoLabel(result.stato);
        if (breakdownRows[0]) breakdownRows[0].textContent = `€${formatEuro(persona.carichiTotale)}`;
        if (breakdownRows[1]) breakdownRows[1].textContent = `€${formatEuro(persona.pagamentiTotale)}`;
        toggle.textContent = 'Mostra stato: collezioni vuote';
      }
    });
  });

  section.appendChild(toggle);
}

// ── Init ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('balance-grid');
  if (!grid) return;

  const cards = renderCards(grid);
  simulateLoading(cards);
  simulateRealtimeUpdate(grid);
  addEmptyStateToggle();
});
