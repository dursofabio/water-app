/* ============================================================
   AcquaApp — US-012  Modifica e cancellazione pagamenti
   Prototype interaction script
   ============================================================ */

'use strict';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

/* ---- Shared helpers ---- */

function initials(name) {
  return (name || '').slice(0, 2).toUpperCase();
}

/* ================================================================
   LIST PAGE — index.html
   ================================================================ */

(function initListPage() {
  const deleteDialog = document.getElementById('delete-dialog');
  if (!deleteDialog) return; // not the list page

  const dialogName    = document.getElementById('dialog-name');
  const dialogMeta    = document.getElementById('dialog-meta');
  const dialogAmount  = document.getElementById('dialog-amount');
  const dialogAvatar  = document.getElementById('dialog-avatar');
  const cancelBtn     = document.getElementById('cancel-delete');
  const confirmBtn    = document.getElementById('confirm-delete');
  const deleteBtnLabel   = document.getElementById('delete-btn-label');
  const deleteBtnSpinner = document.getElementById('delete-btn-spinner');
  const successToast  = document.getElementById('success-toast');

  let targetRow = null;

  /* Open dialog */
  document.querySelectorAll('[data-delete]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const name   = btn.dataset.name   || '';
      const date   = btn.dataset.date   || '';
      const amount = btn.dataset.amount || '';
      const note   = btn.dataset.note   || '';

      if (dialogName)   dialogName.textContent   = name;
      if (dialogAvatar) dialogAvatar.textContent  = initials(name);
      if (dialogAmount) dialogAmount.textContent  = amount;
      if (dialogMeta)   dialogMeta.textContent    = note ? date + ' · ' + note : date;

      targetRow = btn.closest('[data-payment-id]');
      deleteDialog.hidden = false;
      document.body.style.overflow = 'hidden';
      cancelBtn && cancelBtn.focus();
    });
  });

  /* Close without action */
  cancelBtn && cancelBtn.addEventListener('click', closeDialog);

  /* Click outside dialog to close */
  deleteDialog.addEventListener('click', function(e) {
    if (e.target === deleteDialog) closeDialog();
  });

  /* Escape key to close */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !deleteDialog.hidden) closeDialog();
  });

  /* Confirm deletion */
  confirmBtn && confirmBtn.addEventListener('click', function() {
    /* Simulate async delete with spinner */
    deleteBtnLabel   && (deleteBtnLabel.hidden   = true);
    deleteBtnSpinner && (deleteBtnSpinner.hidden = false);
    confirmBtn.disabled = true;

    setTimeout(function() {
      /* Remove row from DOM */
      if (targetRow) {
        targetRow.style.transition = 'opacity 0.25s, transform 0.25s';
        targetRow.style.opacity    = '0';
        targetRow.style.transform  = 'translateX(16px)';
        setTimeout(function() { targetRow && targetRow.remove(); }, 260);
      }

      closeDialog();
      showToast();

      /* Reset spinner */
      deleteBtnLabel   && (deleteBtnLabel.hidden   = false);
      deleteBtnSpinner && (deleteBtnSpinner.hidden = true);
      if (confirmBtn) confirmBtn.disabled = false;
    }, 900);
  });

  function closeDialog() {
    deleteDialog.hidden = true;
    document.body.style.overflow = '';
    targetRow = null;
  }

  function showToast() {
    if (!successToast) return;
    successToast.classList.add('toast--visible');
    setTimeout(function() { successToast.classList.remove('toast--visible'); }, 3200);
  }
})();


/* ================================================================
   EDIT PAGE — edit.html
   ================================================================ */

(function initEditPage() {
  const form = document.getElementById('payment-form');
  if (!form) return; // not the edit page

  /* Detect create vs edit mode from URL query param (?mode=new) */
  const isCreate = new URLSearchParams(window.location.search).get('mode') === 'new';

  /* Update labels for create mode */
  if (isCreate) {
    const pageTitle   = document.getElementById('page-title');
    const mainHeading = document.getElementById('main-heading');
    const modeEyebrow = document.getElementById('mode-eyebrow');
    const pageSubtitle= document.getElementById('page-subtitle');
    const submitLabel = document.getElementById('submit-label');
    const editBadge   = document.getElementById('edit-badge');

    if (pageTitle)    pageTitle.textContent    = 'Nuovo pagamento';
    if (mainHeading)  mainHeading.textContent  = 'Registra pagamento';
    if (modeEyebrow)  modeEyebrow.textContent  = 'EP-004 · Gestione pagamenti';
    if (pageSubtitle) pageSubtitle.textContent = 'Inserisci un pagamento ricevuto. Il saldo si aggiorna automaticamente su Firestore.';
    if (submitLabel)  submitLabel.textContent  = 'Registra pagamento';
    if (editBadge)    editBadge.style.display  = 'none';

    /* Clear pre-filled values */
    const dateInput   = document.getElementById('payment-date');
    const amountInput = document.getElementById('payment-amount');
    const noteArea    = document.getElementById('payment-note');
    if (dateInput)   dateInput.value   = new Date().toISOString().slice(0, 10);
    if (amountInput) amountInput.value = '';
    if (noteArea)    noteArea.value    = '';

    /* Deselect all person cards */
    document.querySelectorAll('.person-card').forEach(function(card) {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
  }

  /* ---- Person card toggle ---- */
  document.querySelectorAll('.person-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.person-card').forEach(function(c) {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      updatePreview();
    });
  });

  /* ---- Preview live update ---- */
  const amountInput = document.getElementById('payment-amount');
  const noteArea    = document.getElementById('payment-note');
  const charCount   = document.getElementById('char-count');

  amountInput && amountInput.addEventListener('input', updatePreview);
  noteArea    && noteArea.addEventListener('input', function() {
    updatePreview();
    if (charCount) charCount.textContent = noteArea.value.length + '/200';
  });

  function updatePreview() {
    const selected   = document.querySelector('.person-card.selected');
    const personName = selected ? selected.querySelector('.person-card__name').textContent : '—';
    const amount     = parseFloat((amountInput && amountInput.value) || '0') || 0;
    const note       = noteArea ? noteArea.value.trim() : '';

    const previewPerson = document.getElementById('preview-person');
    const previewAmount = document.getElementById('preview-amount');
    const previewNoteText = document.getElementById('preview-note-text');
    const previewNoteWrap = document.getElementById('preview-note-wrap');

    if (previewPerson) previewPerson.textContent = personName;
    if (previewAmount) previewAmount.textContent = amount > 0 ? eur.format(amount) : '€—';
    if (previewNoteText) previewNoteText.textContent = note || '(nessuna nota)';
    if (previewNoteWrap) previewNoteWrap.style.opacity = note ? '1' : '0.45';
  }

  updatePreview();

  /* ---- Form submit ---- */
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const submitBtn  = document.getElementById('submit-btn');
    const submitLabel= document.getElementById('submit-label');
    const successOverlay = document.getElementById('success-overlay');
    const successPersonName = document.getElementById('success-person-name');

    const selected   = document.querySelector('.person-card.selected');
    const personName = selected ? selected.querySelector('.person-card__name').textContent : 'la persona';

    if (submitBtn)  { submitBtn.disabled = true; submitBtn.style.opacity = '0.65'; }
    if (submitLabel) submitLabel.textContent = 'Salvataggio…';

    setTimeout(function() {
      if (successPersonName) successPersonName.textContent = personName;
      if (successOverlay)    { successOverlay.style.display = 'flex'; }
      if (submitBtn)         { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
      if (submitLabel)       submitLabel.textContent = isCreate ? 'Registra pagamento' : 'Salva modifiche';
    }, 900);
  });
})();
