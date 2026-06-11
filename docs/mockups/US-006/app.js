/* ============================================================
   AcquaApp — US-006 Login Mockup — Prototype interactions
   ============================================================ */

const btnSignIn    = document.getElementById('btn-google-signin');
const accessDenied = document.getElementById('access-denied');

const protoIdle    = document.getElementById('proto-idle');
const protoLoading = document.getElementById('proto-loading');
const protoDenied  = document.getElementById('proto-denied');

/* ── State machine ── */
const STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  DENIED: 'denied',
};

let currentState = STATES.IDLE;

function applyState(state) {
  currentState = state;

  // Reset all
  btnSignIn.classList.remove('is-loading');
  accessDenied.hidden = true;

  // Google icon (restore or spinner)
  updateButtonIcon(state === STATES.LOADING);

  switch (state) {
    case STATES.IDLE:
      btnSignIn.disabled = false;
      btnSignIn.querySelector('.btn-google__label').textContent = 'Accedi con Google';
      break;

    case STATES.LOADING:
      btnSignIn.classList.add('is-loading');
      btnSignIn.disabled = true;
      btnSignIn.querySelector('.btn-google__label').textContent = 'Accesso in corso…';
      // Auto-advance to denied after 1.8s for demo purposes
      setTimeout(() => applyState(STATES.DENIED), 1800);
      break;

    case STATES.DENIED:
      btnSignIn.disabled = false;
      btnSignIn.querySelector('.btn-google__label').textContent = 'Accedi con Google';
      accessDenied.hidden = false;
      break;
  }
}

function updateButtonIcon(showSpinner) {
  const iconSlot = btnSignIn.querySelector('.btn-google__icon');
  if (showSpinner) {
    iconSlot.innerHTML = `
      <circle cx="10" cy="10" r="7" stroke="#bbb" stroke-width="2" fill="none" stroke-dasharray="22 22" stroke-linecap="round"/>
    `;
    // Ensure it's an SVG with correct viewBox
    iconSlot.setAttribute('viewBox', '0 0 20 20');
  } else {
    // Restore Google logo
    iconSlot.innerHTML = `
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.8h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.32z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.08v2.58A10 10 0 0 0 10 20z" fill="#34A853"/>
      <path d="M4.41 11.92A5.97 5.97 0 0 1 4.1 10c0-.67.12-1.32.31-1.92V5.5H1.08A10 10 0 0 0 0 10c0 1.61.39 3.14 1.08 4.5l3.33-2.58z" fill="#FBBC05"/>
      <path d="M10 3.97c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.95.99 12.7 0 10 0A10 10 0 0 0 1.08 5.5l3.33 2.58C5.2 5.72 7.4 3.97 10 3.97z" fill="#EA4335"/>
    `;
  }
}

/* ── Wrap button text in a span for easy mutation ── */
(function wrapButtonLabel() {
  const btn = btnSignIn;
  const children = Array.from(btn.childNodes);
  let labelNode = null;
  children.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      labelNode = node;
    }
  });
  if (labelNode) {
    const span = document.createElement('span');
    span.className = 'btn-google__label';
    span.textContent = labelNode.textContent.trim();
    btn.replaceChild(span, labelNode);
  }
})();

/* ── Main button click — simulate loading then denied ── */
btnSignIn.addEventListener('click', () => {
  if (currentState === STATES.IDLE || currentState === STATES.DENIED) {
    applyState(STATES.LOADING);
  }
});

/* ── Prototype controls ── */
protoIdle.addEventListener('click', () => applyState(STATES.IDLE));
protoLoading.addEventListener('click', () => applyState(STATES.LOADING));
protoDenied.addEventListener('click', () => applyState(STATES.DENIED));
