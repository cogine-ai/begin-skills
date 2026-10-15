(function () {
  'use strict';
  const model = window.BreakawayPace;
  const fields = ['distance', 'pace', 'start'];
  const el = id => document.getElementById(id);
  let stored = null, storageNotice = '';
  try {
    const raw = localStorage.getItem(model.STORAGE_KEY);
    if (raw) {
      stored = model.parseRecord(raw);
      if (!stored) storageNotice = 'The kept worksheet could not be read. Prepare and keep a new sheet to replace it.';
    }
  } catch (_) { storageNotice = 'Browser storage is unavailable. You can still prepare a sheet and download its text.'; }
  let state = model.initial(stored, storageNotice);
  const query = new URLSearchParams(window.location.search);
  let supplied = false;
  fields.forEach(field => {
    if (query.has(field)) { state = model.transition(state, { type: 'edit', field, value: query.get(field) }); supplied = true; }
  });
  if (supplied) {
    // The query is a one-time editing entry; a plain reload should recover kept work.
    try { history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (_) { /* The input and kept snapshot remain distinct even without history access. */ }
  }
  function render(syncFields) {
    fields.forEach(field => {
      if (syncFields && el(field).value !== state.inputs[field]) el(field).value = state.inputs[field];
      const error = state.errors[field];
      el(field).setAttribute('aria-invalid', error ? 'true' : 'false');
      el(field + '-error').textContent = error || '';
      el(field + '-error').hidden = !error;
    });
    el('form-status').textContent = state.feedback;
    el('form-status').classList.toggle('has-error', Object.keys(state.errors).length > 0);
    const sheet = state.prepared;
    el('pace-sheet').dataset.state = sheet ? (state.stale ? 'stale' : 'current') : 'empty';
    el('sheet-badge').textContent = sheet ? (state.stale ? 'Stale — inputs changed' : 'Current prepared sheet') : 'Not prepared';
    el('sheet-status').textContent = sheet ? (state.stale ? 'This is your previous successful sheet. Prepare the edited inputs to replace it.' : 'Prepared from your current inputs. Ready to keep or download.') : 'Prepare the inputs to see moving duration and finish time.';
    el('sheet-content').hidden = !sheet;
    if (sheet) {
      el('sheet-distance').textContent = sheet.distance + ' km';
      el('sheet-pace').textContent = sheet.pace + ' km/h';
      el('sheet-start').textContent = sheet.start;
      el('sheet-duration').textContent = sheet.duration;
      el('sheet-duration-readable').textContent = sheet.durationLabel;
      el('sheet-finish').textContent = sheet.finish;
      el('sheet-day').textContent = sheet.nextDay ? 'Next day' : 'Same day';
      el('sheet-formula').textContent = sheet.distance + ' ÷ ' + sheet.pace + ' × 60 = ' + sheet.duration + ' min (rounded)';
    }
    el('keep').disabled = !model.isCurrent(state);
    el('download').disabled = !model.isCurrent(state);
    el('restore').disabled = !state.kept;
    el('keep-status').textContent = state.keepFeedback;
    el('keep-status').classList.toggle('has-error', state.keepError);
  }
  function dispatch(event, syncFields) { state = model.transition(state, event); render(Boolean(syncFields)); }
  fields.forEach(field => el(field).addEventListener('input', () => dispatch({ type: 'edit', field, value: el(field).value })));
  el('pace-form').addEventListener('submit', event => {
    event.preventDefault();
    dispatch({ type: 'prepare' });
    const firstError = fields.find(field => state.errors[field]);
    if (firstError) el(firstError).focus();
  });
  el('keep').addEventListener('click', () => {
    if (!model.isCurrent(state)) return;
    const record = model.createRecord(state.prepared);
    try { localStorage.setItem(model.STORAGE_KEY, JSON.stringify(record)); dispatch({ type: 'keep-success', record }); }
    catch (_) { dispatch({ type: 'keep-failure' }); }
  });
  el('restore').addEventListener('click', () => dispatch({ type: 'restore' }, true));
  el('reset').addEventListener('click', () => {
    let storageFailed = false;
    try { localStorage.removeItem(model.STORAGE_KEY); } catch (_) { storageFailed = true; }
    dispatch({ type: 'reset', storageFailed }, true);
    el('distance').focus();
  });
  el('download').addEventListener('click', () => {
    if (!model.isCurrent(state)) return;
    let url;
    try {
      const blob = new Blob([model.text(state.prepared)], { type: 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'breakaway-pace-sheet.txt';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      dispatch({ type: 'download' });
    } catch (_) { if (url) URL.revokeObjectURL(url); dispatch({ type: 'download-failure' }); }
  });
  render(true);
})();
