/* ============================================================
   AcquaApp — US-008 Mockup interactions
   Reactive preview: pesi + prezzi → costo per persona in tempo reale
   ============================================================ */

'use strict';

// Persone con avatar e ID
const PEOPLE = [
  { id: 'fabio',    name: 'Fabio',    av: 'Fa' },
  { id: 'fernando', name: 'Fernando', av: 'Fe' },
  { id: 'nino',     name: 'Nino',     av: 'Ni' },
  { id: 'daniele',  name: 'Daniele',  av: 'Da' },
];

// ---- Lettura valori form ----

function getWeights() {
  return PEOPLE.map(p => {
    const input = document.querySelector(`[data-person="${p.id}"]`);
    const val = input ? parseFloat(input.value) : 0;
    return { ...p, weight: isNaN(val) || val < 0 ? 0 : val };
  });
}

function getPrices() {
  const water  = parseFloat(document.getElementById('price-water').value)  || 0;
  const energy = parseFloat(document.getElementById('price-energy').value) || 0;
  return { water, energy };
}

// ---- Calcolo costi ----

function calcBreakdown(weights, prices) {
  const totalWeight = weights.reduce((s, p) => s + p.weight, 0);
  const pricePerUnit = prices.water + prices.energy;
  return weights.map(p => ({
    ...p,
    cost:  totalWeight > 0 ? (p.weight / totalWeight) * pricePerUnit : 0,
    share: totalWeight > 0 ? (p.weight / totalWeight * 100).toFixed(1) : '0.0',
  }));
}

// ---- Formattazione ----

function fmt(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

// ---- Aggiornamento preview ----

function updatePreview() {
  const weights = getWeights();
  const prices  = getPrices();
  const totalWeight = weights.reduce((s, p) => s + p.weight, 0);
  const breakdown   = calcBreakdown(weights, prices);
  const totalAmount = breakdown.reduce((s, p) => s + p.cost, 0);

  // Totale generale
  document.getElementById('preview-total-amount').textContent = fmt(totalAmount);

  // Snapshot prezzi
  document.getElementById('snap-water').textContent  = fmt(prices.water);
  document.getElementById('snap-energy').textContent = fmt(prices.energy);

  // Breakdown righe
  const container = document.getElementById('preview-breakdown');
  container.innerHTML = '';
  breakdown.forEach(p => {
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <div class="breakdown-row__person">
        <span class="avatar" aria-hidden="true">${p.av}</span>
        <div>
          <div style="font-size:.875rem;font-weight:500;">${p.name}</div>
          <div class="breakdown-row__weight">peso ${p.weight} kg</div>
        </div>
      </div>
      <div class="breakdown-row__right">
        <div class="breakdown-row__cost">${fmt(p.cost)}</div>
        <div class="breakdown-row__share">${p.share}%</div>
      </div>
    `;
    container.appendChild(row);
  });

  // Validazione pesi
  const validationEl   = document.getElementById('weights-validation');
  const totalWeightEl  = document.getElementById('total-weight-label');
  const submitBtn      = document.getElementById('submit-btn');

  const hasBadWeight = weights.some(p => p.weight < 0);

  totalWeightEl.textContent = totalWeight + ' kg';

  if (totalWeight <= 0 || hasBadWeight) {
    validationEl.className = 'validation-msg validation-msg--error';
    validationEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      ${hasBadWeight ? 'I pesi non possono essere negativi.' : 'La somma dei pesi deve essere maggiore di zero.'}
    `;
    submitBtn.disabled = true;
  } else {
    validationEl.className = 'validation-msg validation-msg--ok';
    validationEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Totale pesi: <strong style="margin-left: 4px; font-family: var(--font-mono);">${totalWeight} kg</strong>
    `;
    submitBtn.disabled = false;
  }
}

// ---- Listener input reattivi ----

document.querySelectorAll('[data-person]').forEach(input => {
  input.addEventListener('input', updatePreview);
});

document.querySelectorAll('[data-price]').forEach(input => {
  input.addEventListener('input', updatePreview);
});

// ---- Submit form (prototipo) ----

document.getElementById('load-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const weights  = getWeights();
  const prices   = getPrices();
  const totalWeight = weights.reduce((s, p) => s + p.weight, 0);
  if (totalWeight <= 0) return;

  const breakdown = calcBreakdown(weights, prices);
  const totalAmount = breakdown.reduce((s, p) => s + p.cost, 0);

  const dateEl   = document.getElementById('load-date');
  const paidByEl = document.getElementById('paid-by');

  // Mostra overlay successo
  const overlay  = document.getElementById('success-overlay');
  const details  = document.getElementById('success-details');

  const paidByName = paidByEl.options[paidByEl.selectedIndex]?.text || '—';
  const dateLabel  = dateEl.value
    ? new Date(dateEl.value + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  details.innerHTML = `
    <strong>${dateLabel}</strong> — pagato da <strong>${paidByName}</strong><br>
    Totale: <strong>${fmt(totalAmount)}</strong> su <strong>${totalWeight} kg</strong> pesi.<br>
    <br>
    Prezzi snapshot: acqua ${fmt(prices.water)}, energia ${fmt(prices.energy)}.
  `;

  overlay.hidden = false;
  overlay.removeAttribute('hidden');
  document.getElementById('success-ok').focus();
});

// ---- Annulla ----

document.getElementById('cancel-btn').addEventListener('click', function() {
  window.history.back();
});

// ---- Chiudi overlay ----

document.getElementById('success-ok').addEventListener('click', function() {
  document.getElementById('success-overlay').hidden = true;
  document.getElementById('load-form').reset();
  // Ripristina i valori di default dei pesi
  PEOPLE.forEach(p => {
    const input = document.querySelector(`[data-person="${p.id}"]`);
    if (input) input.value = 1;
  });
  document.getElementById('price-water').value  = 35;
  document.getElementById('price-energy').value = 10;
  updatePreview();
});

// ---- Init ----

updatePreview();
