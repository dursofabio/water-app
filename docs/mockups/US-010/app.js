const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const people = ['Fabio', 'Fernando', 'Nino', 'Daniele'];

function renderPreview() {
  const rows = document.querySelector('#rows');
  const total = document.querySelector('#preview-total');
  const weights = [...document.querySelectorAll('[data-weight]')].map((input) => Number(input.value) || 0);
  const water = Number(document.querySelector('#water')?.value) || 35;
  const energy = Number(document.querySelector('#energy')?.value) || 10;
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const totalAmount = water + energy;

  if (!rows || !total) return;

  total.textContent = totalWeight > 0 ? eur.format(totalAmount) : '-';
  rows.innerHTML = people.map((name, index) => {
    const cost = totalWeight > 0 ? (weights[index] / totalWeight) * totalAmount : 0;
    return `<div class="row"><span>${name} · ${weights[index]} kg</span><strong>${totalWeight > 0 ? eur.format(cost) : '-'}</strong></div>`;
  }).join('');
}

document.querySelectorAll('input').forEach((input) => input.addEventListener('input', renderPreview));
renderPreview();

const dialog = document.querySelector('#delete-dialog');
document.querySelectorAll('[data-delete]').forEach((button) => {
  button.addEventListener('click', () => {
    if (dialog) dialog.hidden = false;
  });
});

document.querySelector('#cancel-delete')?.addEventListener('click', () => {
  if (dialog) dialog.hidden = true;
});

document.querySelector('#confirm-delete')?.addEventListener('click', () => {
  if (dialog) dialog.hidden = true;
  document.querySelector('.load-row')?.remove();
});
