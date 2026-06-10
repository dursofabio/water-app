document.querySelectorAll('.load-row').forEach((row) => {
  const button = row.querySelector('.load-summary');
  const detail = row.querySelector('.load-detail');

  button.addEventListener('click', () => {
    const isOpen = row.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    detail.hidden = !isOpen;
  });
});
