'use strict';

const people = [
  { id: 'fabio', name: 'Fabio', weight: 2 },
  { id: 'fernando', name: 'Fernando', weight: 1 },
  { id: 'nino', name: 'Nino', weight: 1 },
  { id: 'daniele', name: 'Daniele', weight: 1 },
];

const fmt = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

const weightsEl = document.getElementById('weights');
const rowsEl = document.getElementById('rows');
const waterEl = document.getElementById('water');
const energyEl = document.getElementById('energy');
const warningEl = document.getElementById('warning');
const pillEl = document.getElementById('balance-pill');
const totalEl = document.getElementById('preview-total');
const formulaEl = document.getElementById('formula');
const checkEl = document.getElementById('check');

weightsEl.innerHTML = people.map((person) => `
  <label class="weight">
    <span>${person.name}</span>
    <input type="number" min="0" step="0.5" value="${person.weight}" data-person="${person.id}" />
  </label>
`).join('');

function values() {
  const weights = people.map((person) => {
    const input = document.querySelector(`[data-person="${person.id}"]`);
    const weight = Math.max(0, Number.parseFloat(input.value) || 0);
    return { ...person, weight };
  });

  return {
    weights,
    water: Math.max(0, Number.parseFloat(waterEl.value) || 0),
    energy: Math.max(0, Number.parseFloat(energyEl.value) || 0),
  };
}

function render() {
  const { weights, water, energy } = values();
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const totalPrice = water + energy;
  const canCalculate = totalWeight > 0;
  const rows = weights.map((item) => ({
    ...item,
    cost: canCalculate ? (item.weight / totalWeight) * totalPrice : null,
  }));
  const previewTotal = rows.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  totalEl.textContent = canCalculate ? fmt(previewTotal) : '—';
  formulaEl.textContent = `Acqua ${fmt(water)} + energia ${fmt(energy)}`;
  checkEl.textContent = canCalculate
    ? `Totale anteprima ${fmt(previewTotal)}`
    : 'Totale non calcolabile';

  warningEl.hidden = canCalculate;
  pillEl.textContent = canCalculate ? 'Somma corretta' : 'Pesi mancanti';
  pillEl.className = canCalculate ? 'pill ok' : 'pill bad';

  rowsEl.innerHTML = rows.map((item) => `
    <div class="row">
      <span>${item.name} · ${item.weight} kg</span>
      <strong>${item.cost === null ? '—' : fmt(item.cost)}</strong>
    </div>
  `).join('');
}

document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', render);
});

render();
