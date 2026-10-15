(function () {
  'use strict';
  const M = window.RelayMeter;
  const $ = id => document.getElementById(id);
  let state = M.initial();
  let storageAvailable = true;
  let initialMessage = 'Choose a plan and enter monthly calls, then prepare an estimate.';
  try {
    const raw = localStorage.getItem(M.STORAGE_KEY);
    if (raw) {
      const restored = M.restore(JSON.parse(raw));
      if (restored) {
        state = restored;
        initialMessage = `Restored kept version ${version(state.prepared.version)} from this browser.`;
      } else initialMessage = 'The kept estimate could not be read. The original sample is ready; prepare to start again.';
    }
  } catch (_) {
    storageAvailable = false;
    initialMessage = 'The local estimate could not be restored. You can work on this page; browser storage may be unavailable.';
  }
  function version(value) { return String(value).padStart(2, '0'); }
  function set(id, value) { $(id).textContent = value; }
  function announce(message) { set('feedback', message); }
  function storageNote() {
    set('storage-note', storageAvailable
      ? 'Keep estimate stores one snapshot in this browser. Reload restores the last kept version; unsaved edits are discarded.'
      : 'Browser storage is unavailable. Kept work lasts for this page only. Download a current statement before leaving.');
  }
  function clearError() {
    set('requests-error', '');
    $('requests').removeAttribute('aria-invalid');
  }
  function paintCurrent() {
    const valid = M.validate(state.input);
    set('selected-plan', state.input.plan);
    set('selected-requests', valid.ok ? `${M.count(valid.calls)} calls` : 'Check call count');
    set('selection-revision', `Input revision ${version(state.revision)}`);
    const rate = M.PLANS[state.input.plan];
    set('current-base', M.money(rate.baseCents));
    set('current-included', M.count(rate.includedCalls));
    set('current-rate', `USD ${M.money(rate.blockCents)} / 1,000`);
    if (valid.ok) {
      const c = M.calculate(state.input.plan, valid.calls);
      set('current-calls', M.count(c.calls));
      set('current-excess', M.count(c.excessCalls));
      set('current-blocks', `${M.count(c.blocks)} × ${M.money(c.blockCents)}`);
      set('current-overage', M.money(c.overageCents));
      set('current-total', M.money(c.totalCents));
      set('calculation-note', c.blocks ? `${M.count(c.excessCalls)} excess calls round up to ${M.count(c.blocks)} begun 1,000-call ${c.blocks === 1 ? 'block' : 'blocks'}.` : 'Within the included allowance. The monthly base fee still applies.');
      $('current-sheet').classList.remove('invalid');
    } else {
      ['current-calls', 'current-excess', 'current-blocks', 'current-overage', 'current-total'].forEach(id => set(id, '—'));
      set('calculation-note', 'The current calculation needs a valid call count. Your last prepared statement stays below.');
      $('current-sheet').classList.add('invalid');
    }
  }
  function paintPrepared() {
    const p = state.prepared;
    const current = M.isCurrent(state);
    $('empty-prepared').hidden = Boolean(p);
    $('prepared-sheet').hidden = !p;
    $('prepared-help').hidden = !p;
    $('keep-estimate').disabled = !current;
    $('download-estimate').disabled = !current;
    if (!p) {
      set('prepared-status', 'Not prepared');
      $('prepared-status').dataset.state = 'empty';
      set('prepared-help', '');
    } else {
      set('prepared-status', current ? 'Current' : 'Stale');
      $('prepared-status').dataset.state = current ? 'current' : 'stale';
      set('prepared-version', `Version ${version(p.version)}`);
      set('prepared-plan', p.plan);
      set('prepared-calls', M.count(p.calls));
      set('prepared-included', M.count(p.includedCalls));
      set('prepared-excess', M.count(p.excessCalls));
      set('prepared-blocks', `${M.count(p.blocks)} × USD ${M.money(p.blockCents)}`);
      set('prepared-base', M.money(p.baseCents));
      set('prepared-overage', M.money(p.overageCents));
      set('prepared-total', M.money(p.totalCents));
      set('prepared-help', current ? 'This statement matches the selected values. Keep it here or download its exact summary.' : `Selected values changed after version ${version(p.version)}. Prepare again to keep or download the new estimate.`);
    }
    if (state.kept) {
      const k = state.kept.prepared;
      set('kept-note', `Last kept: version ${version(k.version)} · ${k.plan} · ${M.count(k.calls)} calls · USD ${M.money(k.totalCents)}.`);
    } else set('kept-note', 'No estimate has been kept in this browser.');
  }
  function paint() { paintCurrent(); paintPrepared(); storageNote(); }
  function fill() {
    $('requests').value = state.input.requests;
    document.querySelectorAll('[name="plan"]').forEach(input => { input.checked = input.value === state.input.plan; });
  }
  fill();
  document.querySelectorAll('[name="plan"]').forEach(input => {
    input.disabled = false;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state = M.edit(state, 'plan', input.value);
      clearError(); paint();
      announce(state.prepared ? 'Plan changed. The last prepared statement is stale; prepare the selected values again.' : `${input.value} selected. Prepare an estimate when the call count is ready.`);
    });
  });
  $('requests').disabled = false;
  $('prepare-estimate').disabled = false;
  $('reset-estimate').disabled = false;
  $('requests').addEventListener('input', () => {
    state = M.edit(state, 'requests', $('requests').value);
    clearError(); paint();
    announce(state.prepared ? 'Call count changed. The last prepared statement is stale; prepare again.' : 'Call count changed. Prepare an estimate when ready.');
  });
  $('estimate-form').addEventListener('submit', event => {
    event.preventDefault();
    const result = M.prepare(state);
    if (!result.ok) {
      set('requests-error', result.message);
      $('requests').setAttribute('aria-invalid', 'true');
      announce('Estimate not prepared. Correct the call count; prior prepared and kept work is preserved.');
      $('requests').focus(); return;
    }
    state = result.state;
    clearError(); paint();
    announce(`Prepared version ${version(state.prepared.version)}: ${state.prepared.plan}, ${M.count(state.prepared.calls)} calls, USD ${M.money(state.prepared.totalCents)} per month. Ready to keep or download.`);
  });
  $('keep-estimate').addEventListener('click', () => {
    const result = M.keep(state);
    if (!result.ok) { announce(result.message); return; }
    state = result.state;
    try { localStorage.setItem(M.STORAGE_KEY, JSON.stringify(result.record)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
    paint();
    announce(storageAvailable ? `Kept version ${version(state.prepared.version)} in this browser. Reload will restore this estimate.` : `Kept version ${version(state.prepared.version)} for this page only. Download to retain it outside the browser.`);
  });
  $('download-estimate').addEventListener('click', () => {
    if (!M.isCurrent(state)) { announce('Prepare the selected values before downloading.'); return; }
    const p = state.prepared;
    const blob = new Blob([M.summary(p)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `relay-${p.plan.toLowerCase()}-${p.calls}-v${version(p.version)}.txt`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`Downloaded the current version ${version(p.version)} summary: ${p.plan}, ${M.count(p.calls)} calls, USD ${M.money(p.totalCents)}.`);
  });
  $('reset-estimate').addEventListener('click', () => {
    try { localStorage.removeItem(M.STORAGE_KEY); } catch (_) { storageAvailable = false; }
    state = M.initial(); fill(); clearError(); paint();
    announce('Estimator reset. Basic and 18000 calls are selected. Prepared and kept work have been cleared.');
    $('requests').focus();
  });
  paint(); announce(initialMessage);
})();
