(function () {
  'use strict';
  const core = window.AldermereStay;
  const byId = id => document.getElementById(id);
  const fields = ['arrival', 'departure', 'guests', 'note'];
  let state = core.initial();

  function clearErrors() {
    fields.forEach(field => {
      byId(field).removeAttribute('aria-invalid');
      byId(field + '-error').hidden = true;
      byId(field + '-error').textContent = '';
    });
  }
  function setFields() {
    fields.forEach(field => { byId(field).value = state.input[field]; });
  }
  function render() {
    const input = state.input, cost = core.estimate(input);
    byId('review-arrival').textContent = core.dateLabel(input.arrival);
    byId('review-departure').textContent = core.dateLabel(input.departure);
    byId('review-guests').textContent = core.guestLabel(input.guests);
    byId('estimate-total').textContent = cost ? core.money(cost.total) : '—';
    byId('estimate-basis').textContent = cost ? cost.nights + (cost.nights === 1 ? ' night' : ' nights') + ' × USD 180' :
      input.arrival && input.departure ? 'Departure must be after a valid arrival date.' : 'Choose both dates to calculate nights.';
    const current = core.isCurrent(state), hasPrepared = Boolean(state.prepared);
    byId('prepared-state').dataset.state = current ? 'current' : hasPrepared ? 'stale' : 'empty';
    byId('prepared-state').textContent = current ? 'Current' : hasPrepared ? 'Stale — prepare again' : 'Not prepared';
    byId('prepared-message').textContent = current ? 'This summary matches the choices you prepared. Save it locally to return later.' :
      hasPrepared ? 'Your choices changed. The previous summary remains below; review the estimate and prepare again.' :
      'Review your dates and estimate, then select Prepare enquiry.';
    byId('save').disabled = !current;
    byId('download').disabled = !current;
    byId('prepared-summary').hidden = !hasPrepared;
    if (hasPrepared) {
      const prepared = state.prepared.input, preparedCost = core.estimate(prepared);
      byId('prepared-arrival').textContent = core.dateLabel(prepared.arrival);
      byId('prepared-departure').textContent = core.dateLabel(prepared.departure);
      byId('prepared-guests').textContent = core.guestLabel(prepared.guests);
      byId('prepared-cost').textContent = preparedCost.nights + (preparedCost.nights === 1 ? ' night' : ' nights') + ' × USD 180 = ' + core.money(preparedCost.total) + ' · Indicative';
      byId('prepared-note').textContent = prepared.note.trim() ? prepared.note : 'No note added';
    }
  }
  fields.forEach(field => {
    byId(field).addEventListener('input', () => {
      state = core.change(state, field, byId(field).value);
      clearErrors();
      render();
      if (state.prepared && !core.isCurrent(state)) byId('storage-message').textContent = 'Unsaved changes. Prepare and save again to keep them; reload returns the last saved enquiry.';
    });
  });
  byId('stay-form').addEventListener('submit', event => {
    event.preventDefault();
    clearErrors();
    fields.forEach(field => { state = core.change(state, field, byId(field).value); });
    const result = core.prepare(state);
    state = result.state;
    render();
    const invalid = fields.filter(field => result.errors[field]);
    invalid.forEach(field => {
      byId(field).setAttribute('aria-invalid', 'true');
      byId(field + '-error').textContent = result.errors[field];
      byId(field + '-error').hidden = false;
    });
    if (invalid.length) byId(invalid[0]).focus();
    else {
      byId('storage-message').textContent = 'Prepared for this visit. Select Save locally to keep this enquiry after reload.';
      byId('prepared-summary').focus();
    }
  });
  byId('save').addEventListener('click', () => {
    if (!core.isCurrent(state)) return;
    try {
      localStorage.setItem(core.STORAGE_KEY, core.serialize(state));
      byId('storage-message').textContent = 'Saved in this browser. Reload this page to restore your prepared enquiry.';
    } catch (_) {
      byId('storage-message').textContent = 'This browser could not save the enquiry. Your summary remains available for this visit; use Download summary to keep a copy.';
    }
  });
  byId('download').addEventListener('click', () => {
    if (!core.isCurrent(state)) return;
    try {
      const blob = new Blob([core.summaryText(state)], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aldermere-stay-enquiry.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      byId('storage-message').textContent = 'Summary download requested. Check your browser’s downloads for aldermere-stay-enquiry.txt. This does not save it for reload.';
    } catch (_) {
      byId('storage-message').textContent = 'The summary download could not start. Your current summary remains below; select and copy its text to keep it.';
    }
  });
  byId('reset').addEventListener('click', () => {
    state = core.initial();
    clearErrors();
    setFields();
    render();
    try {
      localStorage.removeItem(core.STORAGE_KEY);
      byId('storage-message').textContent = 'Reset complete. The saved enquiry was removed from this browser.';
    } catch (_) {
      byId('storage-message').textContent = 'Reset for this visit. The browser could not remove the saved enquiry, so it may return on reload. Clear this site’s stored data to remove it.';
    }
    byId('arrival').focus();
  });
  let storageMessage = 'One prepared enquiry can be saved in this browser. Unsaved edits are lost on reload.';
  try {
    const saved = localStorage.getItem(core.STORAGE_KEY);
    if (saved !== null) {
      state = core.restore(saved);
      storageMessage = 'Restored the saved enquiry from this browser. Review it before using it.';
    }
  } catch (_) {
    state = core.initial();
    storageMessage = 'A saved enquiry could not be read, or local storage is unavailable. Start with these empty dates; prepare and save again, or use Download summary.';
  }
  setFields();
  render();
  byId('storage-message').textContent = storageMessage;
  byId('stay-work').hidden = false;
})();
