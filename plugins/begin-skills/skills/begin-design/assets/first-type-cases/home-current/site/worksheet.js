(function () {
  'use strict';
  const M = window.HomeCurrent;
  const $ = id => document.getElementById(id);
  const ids = { name: 'appliance', watts: 'watts', hours: 'hours', days: 'days', rate: 'rate', note: 'note' };
  let state = M.initial();
  let storageAvailable = true;
  let storageProblem = '';
  let openingMessage = 'Ready to prepare the room heater example.';
  try {
    const text = localStorage.getItem(M.STORAGE_KEY);
    if (text !== null) {
      const recovered = M.restore(JSON.parse(text));
      if (recovered) {
        state = recovered;
        openingMessage = 'Recovered kept version ' + M.versionLabel(state.prepared.version) + ' for ' + state.prepared.input.name + '.';
      } else {
        storageProblem = 'The kept record could not be recovered. Reset removes it and starts again.';
        openingMessage = storageProblem;
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) storageProblem = 'The kept record could not be recovered. Reset removes it and starts again.';
    else { storageAvailable = false; storageProblem = 'Browser storage is unavailable. You can prepare and download a sheet.'; }
    openingMessage = storageProblem;
  }
  if (new URLSearchParams(window.location.search).get('example') === 'heater') {
    // An explicit example link changes selected work, while retaining recoverable kept work.
    for (const [field, value] of Object.entries(M.defaults())) state = M.edit(state, field, value);
    const address = new URL(window.location.href);
    address.searchParams.delete('example');
    window.history.replaceState(null, '', address.pathname + address.search + address.hash);
    openingMessage = 'Room heater example inputs selected. Prepare to make its sheet; the earlier kept copy remains recoverable.';
  }
  function announce(message) { $('feedback').textContent = message; }
  function fill() { for (const field of M.fields) $(ids[field]).value = state.input[field]; }
  function clearErrors() {
    for (const field of M.fields) {
      $(ids[field]).removeAttribute('aria-invalid');
      $(ids[field] + '-error').textContent = '';
    }
  }
  function paint() {
    const current = M.isCurrent(state);
    const p = state.prepared;
    $('empty-result').hidden = Boolean(p);
    $('prepared-result').hidden = !p;
    $('result-status').textContent = p ? (current ? 'Current' : 'Stale') : 'Not prepared';
    $('result-status').dataset.state = p ? (current ? 'current' : 'stale') : 'empty';
    $('sheet-version').textContent = p ? 'Prepared version ' + M.versionLabel(p.version) : 'Monthly worksheet';
    $('stale-note').hidden = !p || current;
    if (p) {
      const i = p.input;
      $('result-appliance').textContent = i.name;
      $('result-energy').textContent = M.energy(p.wattHours);
      $('result-cost').textContent = M.money(p.costCents);
      for (const field of ['watts', 'hours', 'days', 'rate']) $('result-' + field).textContent = i[field];
      $('energy-working').textContent = i.watts + ' watts × ' + i.hours + ' hours/day × ' + i.days + ' days ÷ 1000 = ' + M.energy(p.wattHours) + ' kWh';
      $('cost-working').textContent = M.energy(p.wattHours) + ' kWh × ' + i.rate + ' cents/kWh ÷ 100 = USD ' + M.money(p.costCents) + ' · rounded to cents';
      $('result-note-area').hidden = !i.note;
      $('result-note').textContent = i.note;
    }
    $('keep').disabled = !current || !storageAvailable;
    $('download').disabled = !current;
    $('restore').disabled = !state.kept;
    $('action-help').textContent = !p ? 'Prepare a sheet to enable keeping and downloading.' : !current ? 'Inputs changed. Prepare again to keep or download this work.' : !storageAvailable ? 'Current sheet can be downloaded. Browser keeping is unavailable.' : 'This prepared sheet is current. Keep it here or download its text.';
    if (state.kept) {
      const k = state.kept.prepared;
      $('kept-status').textContent = 'Kept version ' + M.versionLabel(k.version) + ' · ' + k.input.name + ' · ' + M.energy(k.wattHours) + ' kWh · USD ' + M.money(k.costCents);
    } else $('kept-status').textContent = storageProblem || 'No kept sheet in this browser.';
  }
  for (const field of M.fields) {
    $(ids[field]).addEventListener('input', () => {
      const wasCurrent = M.isCurrent(state);
      state = M.edit(state, field, $(ids[field]).value);
      $(ids[field]).removeAttribute('aria-invalid');
      $(ids[field] + '-error').textContent = '';
      paint();
      if (wasCurrent && !M.isCurrent(state)) announce('Inputs changed. The previous prepared sheet is stale. Prepare again to use this work.');
      else if (!state.prepared) announce('Inputs changed. Prepare the sheet when ready.');
      else announce('Inputs changed. The previous prepared sheet stays stale until you prepare again.');
    });
  }
  $('energy-form').addEventListener('submit', event => {
    event.preventDefault();
    clearErrors();
    const result = M.prepare(state);
    if (!result.ok) {
      for (const [field, error] of Object.entries(result.errors)) {
        $(ids[field]).setAttribute('aria-invalid', 'true');
        $(ids[field] + '-error').textContent = error;
      }
      paint();
      announce('Correct the marked entries, then prepare again. Your editable inputs and previous prepared sheet are preserved.');
      $(ids[Object.keys(result.errors)[0]]).focus();
      return;
    }
    state = result.state;
    paint();
    announce('Prepared current version ' + M.versionLabel(state.prepared.version) + ' for ' + state.prepared.input.name + ': ' + M.energy(state.prepared.wattHours) + ' kWh and USD ' + M.money(state.prepared.costCents) + '.');
  });
  $('keep').addEventListener('click', () => {
    const saved = M.record(state);
    if (!saved) { announce('Prepare your current inputs before keeping the sheet.'); return; }
    try {
      localStorage.setItem(M.STORAGE_KEY, JSON.stringify(saved));
      state = { ...state, kept: saved };
      storageAvailable = true; storageProblem = ''; paint();
      announce('Kept version ' + M.versionLabel(saved.prepared.version) + ' in this browser. Reload recovers this sheet.');
    } catch (_) {
      storageAvailable = false; storageProblem = 'Browser keeping failed. Download the current sheet to retain it.';
      paint(); announce(storageProblem);
    }
  });
  $('restore').addEventListener('click', () => {
    const recovered = M.restore(state.kept);
    if (!recovered) { announce('No recoverable kept sheet is available.'); return; }
    state = recovered; fill(); clearErrors(); paint();
    announce('Restored kept version ' + M.versionLabel(state.prepared.version) + ' and its inputs. The sheet is current.');
  });
  $('download').addEventListener('click', () => {
    if (!M.isCurrent(state)) { announce('Prepare your current inputs before downloading.'); return; }
    const p = state.prepared;
    const url = URL.createObjectURL(new Blob([M.summary(p)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url;
    link.download = 'home-current-v' + M.versionLabel(p.version) + '.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Downloaded current version ' + M.versionLabel(p.version) + ' with its inputs, calculation and note.');
  });
  $('reset').addEventListener('click', () => {
    let cleared = true;
    try { localStorage.removeItem(M.STORAGE_KEY); storageAvailable = true; storageProblem = ''; }
    catch (_) { cleared = false; storageAvailable = false; storageProblem = 'Browser storage could not be cleared. A previous stored sheet may return on reload.'; }
    state = M.initial(); fill(); clearErrors(); paint();
    announce(cleared ? 'Worksheet reset. Prepared and kept versions cleared; the room heater example is ready.' : 'The open worksheet was reset. ' + storageProblem);
    $('appliance').focus();
  });
  fill(); paint(); announce(openingMessage);
  $('prepare').disabled = false;
})();
