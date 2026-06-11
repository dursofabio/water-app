const paymentsPanel = document.querySelector('#payments-panel');
const paymentsList = document.querySelector('#payments-list');
const emptyState = document.querySelector('#empty-state');
const toggleEmpty = document.querySelector('#toggle-empty');
const addPayment = document.querySelector('#add-payment');
const lastUpdate = document.querySelector('#last-update');

document.querySelectorAll('.load-row').forEach((row) => {
  const button = row.querySelector('.load-summary');
  const detail = row.querySelector('.load-detail');

  button.addEventListener('click', () => {
    const isOpen = row.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    detail.hidden = !isOpen;
  });
});

toggleEmpty.addEventListener('click', () => {
  const showEmpty = paymentsList.hidden === false || !paymentsList.hidden;
  paymentsList.hidden = showEmpty;
  emptyState.hidden = !showEmpty;
  paymentsPanel.classList.toggle('is-empty', showEmpty);
  toggleEmpty.setAttribute('aria-pressed', String(showEmpty));
});

addPayment.addEventListener('click', () => {
  paymentsList.hidden = false;
  emptyState.hidden = true;
  toggleEmpty.setAttribute('aria-pressed', 'false');

  const row = document.createElement('article');
  row.className = 'payment-row is-new';
  row.dataset.person = 'Fernando';
  row.innerHTML = `
    <time datetime="2026-06-11">11 giu</time>
    <span class="payer"><span class="payer-avatar">Fe</span>Fernando<small>Appena registrato</small></span>
    <strong>&euro;50,00</strong>
  `;

  paymentsList.prepend(row);

  while (paymentsList.children.length > 10) {
    paymentsList.lastElementChild.remove();
  }

  lastUpdate.textContent = '11 giu 2026, 09:31';

  window.setTimeout(() => {
    row.classList.remove('is-new');
  }, 1200);
});
