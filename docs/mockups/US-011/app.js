/**
 * AcquaApp — US-011 Payment Form Mockup
 * Prototype interaction: person selection, live preview, validation, success overlay.
 */

(function () {
  const form = document.getElementById('payment-form');
  const personCards = document.querySelectorAll('.person-card');
  const amountInput = document.getElementById('payment-amount');
  const noteInput = document.getElementById('payment-note');
  const charCount = document.getElementById('char-count');
  const dateInput = document.getElementById('payment-date');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const successOverlay = document.getElementById('success-overlay');
  const backToAdminBtn = document.getElementById('back-to-admin-btn');

  // Preview elements
  const previewPerson = document.getElementById('preview-person');
  const previewAmount = document.getElementById('preview-amount');
  const previewNoteWrap = document.getElementById('preview-note-wrap');
  const previewNoteText = document.getElementById('preview-note-text');
  const amountValidation = document.getElementById('amount-validation');
  const successPersonName = document.getElementById('success-person-name');

  let selectedPerson = { id: 'fernando', name: 'Fernando' };

  // Person selection
  personCards.forEach((card) => {
    card.addEventListener('click', () => {
      personCards.forEach((c) => {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      selectedPerson = {
        id: card.dataset.person,
        name: card.querySelector('.person-card__name').textContent,
      };
      updatePreview();
    });
  });

  // Amount live update
  amountInput.addEventListener('input', updatePreview);
  noteInput.addEventListener('input', () => {
    const len = noteInput.value.length;
    charCount.textContent = `${len}/200`;
    updatePreview();
  });

  function updatePreview() {
    const amount = parseFloat(amountInput.value) || 0;

    // Person
    previewPerson.textContent = selectedPerson.name;

    // Amount
    if (amount > 0) {
      previewAmount.textContent = '€' + amount.toFixed(2).replace('.', ',');
      amountValidation.className = 'validation-msg validation-msg--ok';
      amountValidation.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Importo valido: <strong style="margin-left: 4px; font-family: var(--font-mono);">€${amount.toFixed(2).replace('.', ',')}</strong>
      `;
    } else {
      previewAmount.textContent = '€0,00';
      amountValidation.className = 'validation-msg validation-msg--error';
      amountValidation.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        L'importo deve essere maggiore di zero
      `;
    }

    // Note preview
    const note = noteInput.value.trim();
    if (note) {
      previewNoteWrap.style.display = 'flex';
      previewNoteText.textContent = note;
    } else {
      previewNoteWrap.style.display = 'none';
    }

    // Submit state
    const isValid = amount > 0 && !!dateInput.value && !!selectedPerson.id;
    submitBtn.disabled = !isValid;
  }

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput.value) || 0;
    if (!amount || !dateInput.value || !selectedPerson.id) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" style="animation: spin 0.8s linear infinite">
        <circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="10"/>
      </svg>
      Salvataggio...
    `;

    // Simulate async save
    setTimeout(() => {
      successPersonName.textContent = selectedPerson.name;
      successOverlay.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Salva pagamento
      `;
    }, 900);
  });

  // Cancel
  cancelBtn.addEventListener('click', () => {
    window.history.back();
  });

  // Back to admin from success
  backToAdminBtn.addEventListener('click', () => {
    successOverlay.style.display = 'none';
    // Reset form
    form.reset();
    personCards.forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    selectedPerson = { id: '', name: '' };
    amountInput.value = '';
    noteInput.value = '';
    charCount.textContent = '0/200';
    updatePreview();
  });

  // Initial render
  updatePreview();

  // Spin keyframe for loading state
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
})();
