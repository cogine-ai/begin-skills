(function () {
  'use strict';
  const M = window.Cloudline;
  const byId = id => document.getElementById(id);
  const controls = {title: byId('report-title'), note: byId('report-note'), threshold: byId('threshold')};
  const days = Array.from({length: 7}, (_, i) => byId(`day-${i + 1}`));
  const storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key)
  };
  let state = M.createState();
  let showErrors = false;
  function readInput() { return {title: controls.title.value, note: controls.note.value, threshold: controls.threshold.value, values: days.map(input => input.value)}; }
  function fillInput() {
    Object.keys(controls).forEach(key => { controls[key].value = state.input[key]; });
    days.forEach((input, i) => { input.value = state.input.values[i]; });
  }
  function feedback(message, error = false) {
    byId('form-feedback').textContent = message;
    byId('form-feedback').classList.toggle('error', error);
  }
  function renderErrors() {
    const all = {...controls};
    days.forEach((input, i) => { all[`day${i + 1}`] = input; });
    Object.entries(all).forEach(([key, input]) => {
      const message = showErrors ? state.errors[key] : null;
      const target = byId(`${key}-error`);
      target.textContent = message || '';
      target.hidden = !message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    });
  }
  function renderResult() {
    const prepared = state.prepared;
    const usable = M.canUsePrepared(state);
    byId('result-empty').hidden = Boolean(prepared);
    byId('prepared-result').hidden = !prepared;
    byId('download-exact').disabled = !usable;
    byId('keep-work').disabled = !usable;
    byId('result-status').textContent = prepared ? (state.stale ? 'Earlier analysis · stale' : 'Current analysis') : 'Not prepared';
    byId('result-status').classList.toggle('is-stale', Boolean(prepared && state.stale));
    byId('stale-notice').hidden = !state.stale;
    byId('analysis-sheet').classList.toggle('is-stale', state.stale);
    byId('result-action-note').textContent = usable ? 'Download saves the exact report as UTF-8 text. Keeping deliberately replaces the browser copy.' : (prepared ? 'Prepare valid current inputs again to enable keeping and downloading.' : 'These actions become available after a valid preparation.');
    if (!prepared) return;
    const a = prepared.analysis;
    byId('prepared-title').textContent = a.title;
    byId('prepared-total').textContent = a.total.toFixed(1);
    byId('prepared-mean').textContent = a.mean.toFixed(2);
    byId('prepared-maximum').textContent = a.maximum.toFixed(1);
    byId('prepared-max-dates').textContent = a.maxDates.join(' · ');
    byId('prepared-count-label').textContent = `Days strictly above ${a.threshold.toFixed(1)} mm`;
    byId('prepared-count').textContent = a.aboveThreshold;
    const readings = byId('prepared-readings');
    readings.replaceChildren();
    a.values.forEach((value, i) => {
      const row = document.createElement('p');
      row.className = 'prepared-reading';
      const date = document.createElement('span');
      date.textContent = M.DATES[i];
      const amount = document.createElement('strong');
      amount.textContent = `${value.toFixed(1)} mm`;
      row.append(date, amount);
      readings.append(row);
    });
    byId('prepared-note').textContent = a.note || 'No note supplied.';
    byId('export-text').textContent = prepared.text;
  }
  function render() { renderErrors(); renderResult(); }
  function recoverCopy(initial = false) {
    const recovered = M.recover(storage);
    byId('copy-status').textContent = recovered.ok ? (initial ? 'Kept copy restored on reload.' : recovered.message) : recovered.message;
    if (!recovered.ok) return;
    state = recovered.state;
    showErrors = false;
    fillInput(); render();
    feedback(initial ? 'Restored the exact kept inputs and analysis. You can continue from this report.' : recovered.message);
  }
  byId('analysis-form').addEventListener('input', () => {
    state = M.edit(state, readInput());
    if (state.prepared) showErrors = true;
    render();
    if (state.prepared) feedback('Current inputs changed. The earlier analysis stays visible; prepare again to update it.', Object.keys(state.errors).length > 0);
    else feedback('Input updated. Prepare analysis when the title and all seven readings are ready.');
  });
  byId('analysis-form').addEventListener('submit', event => {
    event.preventDefault();
    state = M.prepare(state);
    showErrors = true;
    render();
    if (Object.keys(state.errors).length) {
      feedback('Analysis was not prepared. Correct the marked fields. Any earlier analysis remains visible and cannot be kept or downloaded.', true);
      const firstKey = Object.keys(state.errors)[0];
      const first = firstKey.startsWith('day') ? days[Number(firstKey.slice(3)) - 1] : controls[firstKey];
      if (first) first.focus();
    } else feedback('Analysis prepared from the current inputs. Review the complete report, then download or keep it.');
  });
  byId('load-example').addEventListener('click', () => {
    state = M.loadExample(state); showErrors = false; fillInput(); render();
    feedback(state.prepared ? 'Example inputs loaded. The earlier analysis remains stale until you prepare again.' : 'Example loaded: A week above the ridge. Choose Prepare analysis to calculate this record.');
  });
  byId('keep-work').addEventListener('click', () => {
    const result = M.keep(state, storage);
    byId('copy-status').textContent = result.message;
  });
  byId('recover-work').addEventListener('click', () => recoverCopy());
  byId('reset-work').addEventListener('click', () => {
    state = M.reset(); showErrors = false; fillInput(); render();
    feedback('Current work reset. The title, note, readings and prepared output are cleared; the threshold returns to 5.0 mm. Any kept copy is preserved.');
  });
  byId('forget-work').addEventListener('click', () => {
    const result = M.forget(storage);
    byId('copy-status').textContent = result.message;
  });
  byId('download-exact').addEventListener('click', () => {
    if (!M.canUsePrepared(state)) return;
    const blob = new Blob([state.prepared.text], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'cloudline-analysis.txt';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback('Requested the exact text download: cloudline-analysis.txt. Your browser controls where the file is saved.');
  });
  fillInput(); render(); recoverCopy(true);
})();
