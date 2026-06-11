const cards = document.querySelectorAll('.balance-card');

cards.forEach((card) => {
  const front = card.querySelector('.balance-card__front');
  const back = card.querySelector('.balance-card__back');
  const close = card.querySelector('.balance-card__close');

  front.addEventListener('click', () => {
    card.classList.add('is-flipped');
    front.setAttribute('aria-expanded', 'true');
    back.setAttribute('aria-hidden', 'false');
  });

  close.addEventListener('click', () => {
    card.classList.remove('is-flipped');
    front.setAttribute('aria-expanded', 'false');
    back.setAttribute('aria-hidden', 'true');
    front.focus();
  });
});
