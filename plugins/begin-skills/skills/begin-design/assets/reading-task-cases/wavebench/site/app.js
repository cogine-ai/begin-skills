(function () {
  'use strict';
  const M = window.WavebenchModel;
  const session = new M.Session();
  const $ = id => document.getElementById(id);
  const ids = { title: 'project-title', amplitude: 'amplitude', frequency: 'frequency', phase: 'phase', offset: 'offset', note: 'note' };
  const storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key)
  };
  let kept = M.readStored(storage);
  let lastPlot = { parameters: M.validate(M.FIXTURE).parameters, title: M.FIXTURE.title };
  function signed(number) { return number > 0 ? `+${Number(number.toFixed(6))}` : String(Number(number.toFixed(6))); }
  function envelope(parameters) { return `Envelope ${signed(parameters.offset - parameters.amplitude)} to ${signed(parameters.offset + parameters.amplitude)} · fixed axis −2 to +2`; }
  function loadFields() {
    for (const field of M.FIELDS) $(ids[field]).value = session.inputs[field];
    for (const field of Object.keys(M.LIMITS)) $(`${field}-slider`).value = session.inputs[field];
  }
  function storageUI(message) {
    $('recover').disabled = kept.status !== 'available';
    $('forget').disabled = !['available', 'corrupt'].includes(kept.status);
    const defaults = {
      empty: 'No kept copy. Nothing is saved automatically.',
      available: 'A kept copy is available. Recover it only when you want to replace the current work.',
      corrupt: 'The kept copy is damaged. It cannot be recovered; you can forget it.',
      denied: 'Browser storage is unavailable. Your current work remains here; download a prepared record to keep it.'
    };
    $('storage-status').textContent = message || defaults[kept.status];
  }
  function updateLive(checked) {
    const numericValid = Object.keys(checked.parameters).length === 4;
    if (numericValid) {
      lastPlot = { parameters: checked.parameters, title: session.inputs.title.trim() ? session.inputs.title : 'Unnamed signal' };
      WavebenchPlot($('live-plot'), lastPlot.parameters, lastPlot.title);
      $('live-plot-title').textContent = lastPlot.title;
      $('live-plot-envelope').textContent = envelope(lastPlot.parameters);
    }
    $('live-status').textContent = numericValid ? 'Live input · all four parameters valid' : 'Last valid plot · the marked numeric input is invalid';
    $('live-status').classList.toggle('invalid', !numericValid);
  }
  function update() {
    const checked = M.validate(session.inputs);
    for (const field of M.FIELDS) {
      const error = checked.errors[field];
      $(ids[field]).setAttribute('aria-invalid', error ? 'true' : 'false');
      if ($(`${field}-error`)) $(`${field}-error`).textContent = error || '';
      if (field in M.LIMITS && checked.parameters[field] !== undefined) $(`${field}-slider`).value = checked.parameters[field];
    }
    updateLive(checked);
    $('prepare').disabled = !checked.ok;
    const count = Object.keys(checked.errors).length;
    $('form-status').textContent = count ? `Correct ${count} ${count === 1 ? 'field' : 'fields'} to prepare. The earlier record remains unchanged.` : session.stale ? 'Inputs are valid. Prepare again to replace the stale record.' : session.prepared ? 'Current record prepared. You can download or keep it.' : 'Ready to prepare this signal.';
    const ready = session.canUse();
    $('download').disabled = !ready;
    $('keep').disabled = !ready;
    const state = $('prepared-state');
    state.textContent = !session.prepared ? 'Nothing prepared' : session.stale ? 'Stale · prepare again' : 'Current prepared record';
    state.classList.toggle('current', ready);
    state.classList.toggle('stale', Boolean(session.prepared && session.stale));
    $('result-status').textContent = !session.prepared ? 'Prepare a current record to use these actions.' : session.stale ? 'This is your earlier snapshot. Any edit, including a reverted edit, requires preparation again before download or keep.' : 'This snapshot matches your current input. Keep is deliberate; download uses the complete text below.';
  }
  function renderRecord(record) {
    $('empty-result').hidden = true; $('prepared-content').hidden = false;
    $('prepared-title').textContent = record.inputs.title;
    $('prepared-note').textContent = record.inputs.note || 'No note entered.';
    $('prepared-amplitude').textContent = String(record.parameters.amplitude);
    $('prepared-frequency').textContent = `${record.parameters.frequency} Hz`;
    $('prepared-phase').textContent = `${record.parameters.phase} degrees`;
    $('prepared-offset').textContent = String(record.parameters.offset);
    $('record-plot-title').textContent = record.inputs.title;
    $('record-plot-envelope').textContent = envelope(record.parameters);
    WavebenchPlot($('record-plot'), record.parameters, record.inputs.title);
    for (const [id, rows] of [['samples-first', record.samples.slice(0, 8)], ['samples-last', record.samples.slice(8)]]) {
      const body = $(id); body.replaceChildren();
      for (const sample of rows) {
        const row = document.createElement('tr');
        for (const value of [String(sample.i).padStart(2, '0'), M.fixed(sample.t), M.fixed(sample.y)]) {
          const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
        }
        body.append(row);
      }
    }
    const sampleStart = record.text.lastIndexOf('Samples: 16, t = i / 16 seconds, i = 0…15\n');
    const rawSamples = document.createElement('span');
    rawSamples.className = 'raw-sample-grid';
    rawSamples.tabIndex = 0;
    rawSamples.setAttribute('role', 'region');
    rawSamples.setAttribute('aria-label', 'Exact sample grid; scroll horizontally to inspect complete lines');
    rawSamples.setAttribute('aria-describedby', 'exact-scroll-hint');
    rawSamples.textContent = record.text.slice(sampleStart);
    $('exact-text').replaceChildren(document.createTextNode(record.text.slice(0, sampleStart)), rawSamples);
  }
  for (const field of M.FIELDS) {
    $(ids[field]).addEventListener('input', event => { session.edit(field, event.target.value); update(); });
  }
  for (const field of Object.keys(M.LIMITS)) {
    $(`${field}-slider`).addEventListener('input', event => {
      const value = String(Number(event.target.value));
      $(ids[field]).value = value; session.edit(field, value); update();
    });
  }
  $('signal-form').addEventListener('submit', event => {
    event.preventDefault();
    const prepared = session.prepare();
    if (prepared.ok) { renderRecord(prepared.record); update(); $('prepared-result').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    else { update(); const first = Object.keys(prepared.errors)[0]; if (first) $(ids[first]).focus(); }
  });
  $('download').addEventListener('click', () => {
    if (!session.canUse()) { update(); return; }
    try {
      const url = URL.createObjectURL(new Blob([session.prepared.text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'wavebench-signal-setup.txt';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('result-status').textContent = 'The complete UTF-8 text download was requested. Check your browser’s downloads.';
    } catch (_) { $('result-status').textContent = 'This browser could not create a download. The complete exact text remains below for copying.'; }
  });
  $('keep').addEventListener('click', () => {
    if (!session.canUse()) { update(); return; }
    const result = M.writeStored(storage, session.prepared);
    if (result.ok) {
      kept = M.readStored(storage); storageUI('Kept this complete setup in this browser. Recover can restore it after a reload.');
      $('result-status').textContent = 'Browser copy kept, including the full name, note, parameters and exact sample text.';
    } else {
      kept = M.readStored(storage); storageUI('The browser could not keep this copy. Your prepared record remains on screen; use Download exact text.');
      $('result-status').textContent = 'Keep failed. The current prepared record is still available for download.';
    }
  });
  $('recover').addEventListener('click', () => {
    if (kept.status !== 'available' || !session.recover(kept.record)) return;
    loadFields(); renderRecord(session.prepared); update();
    storageUI('Recovered the exact kept setup. It replaced the current inputs and prepared record.');
    $('result-status').textContent = 'Recovered the full kept record. Its name, note, parameters and sample text are current.';
  });
  $('reset').addEventListener('click', () => {
    session.reset(); loadFields(); update();
    storageUI(kept.status === 'available' ? 'Starting example restored. The kept browser copy is still available for recovery.' : undefined);
    $('form-status').textContent = session.prepared ? 'Starting inputs restored. The earlier record is stale; prepare the example again.' : 'Starting example restored. Ready to prepare.';
  });
  $('forget').addEventListener('click', () => {
    const result = M.forgetStored(storage);
    kept = M.readStored(storage);
    storageUI(result.ok ? 'Forgot WAVEBENCH’s kept browser copy. Current inputs and prepared work remain on screen.' : 'The browser could not forget this copy. Current work remains on screen.');
  });
  loadFields(); update(); storageUI();
})();
