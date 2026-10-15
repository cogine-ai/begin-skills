(function () {
  'use strict';
  const model = window.SundayWorksheet;
  const key = 'sunday-table.ingredient-worksheet.v1';
  const elements = Object.fromEntries([
    'worksheet-form', 'servings', 'note', 'servings-error', 'result-status',
    'empty-result', 'prepared-result', 'prepared-for', 'result-ingredients',
    'prepared-note', 'result-note', 'keep', 'export', 'action-help',
    'storage-status', 'restore', 'reset'
  ].map(id => [id, document.getElementById(id)]));
  let state = model.create();
  let kept = null;
  let message = 'No kept version in this browser.';
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const recovered = model.decodeKept(raw);
      if (recovered) {
        state = recovered;
        kept = model.snapshot(recovered);
        message = `Restored your kept ${kept.servings}-serving worksheet. Your note came back with it.`;
      } else message = 'The stored version could not be read. Prepare and keep a new worksheet, or reset it.';
    }
  } catch {
    message = 'This browser could not read local storage. You can still prepare and download a worksheet.';
  }
  const requested = new URLSearchParams(window.location.search).get('servings');
  if (requested !== null) {
    state = model.edit(state, { servings: requested });
    if (kept && String(kept.servings) !== requested) message = `The link set the draft servings to ${requested}. Your kept ${kept.servings}-serving version is still available.`;
  }
  function syncFields() {
    elements.servings.value = state.input.servings;
    elements.note.value = state.input.note;
  }
  function render() {
    const current = model.isCurrent(state);
    elements['servings-error'].textContent = state.error;
    elements.servings.setAttribute('aria-invalid', state.error ? 'true' : 'false');
    elements.keep.disabled = !current;
    elements.export.disabled = !current;
    elements.restore.disabled = !kept;
    elements['empty-result'].hidden = Boolean(state.prepared);
    elements['prepared-result'].hidden = !state.prepared;
    const status = elements['result-status'];
    status.classList.toggle('is-current', current);
    status.classList.toggle('is-stale', Boolean(state.prepared && !current));
    if (state.prepared) {
      status.textContent = current ? `Prepared for ${state.prepared.servings} servings · Current` : `Stale · Showing the last ${state.prepared.servings}-serving preparation. Prepare again to use your edits.`;
      elements['prepared-for'].textContent = model.title;
      elements['result-ingredients'].replaceChildren(...state.prepared.ingredients.map(row => {
        const tr = document.createElement('tr');
        for (const [value, className] of [[row.name, ''], [row.amount, 'amount'], [row.unit, 'unit']]) {
          const td = document.createElement('td');
          td.textContent = String(value);
          td.className = className;
          tr.appendChild(td);
        }
        return tr;
      }));
      elements['prepared-note'].hidden = !state.prepared.note;
      elements['result-note'].textContent = state.prepared.note;
    } else status.textContent = state.error ? 'Not prepared · Correct the servings field to continue.' : 'Ready when you are';
    elements['action-help'].textContent = current ? 'This prepared version is current. Keeping replaces your previous kept version; downloading creates a text file.' : state.prepared ? 'Keeping and downloading are blocked while the sheet is stale. Prepare the current inputs again.' : 'Prepare a worksheet to enable keeping and downloading.';
    elements['storage-status'].textContent = message;
  }
  for (const id of ['servings', 'note']) elements[id].addEventListener('input', function () {
    state = model.edit(state, { [id]: elements[id].value });
    if (kept) message = `Your kept ${kept.servings}-serving version is still available. These edits have not been kept.`;
    else message = 'These edits have not been kept. Prepare, then keep a version if you want it after reload.';
    render();
  });
  elements['worksheet-form'].addEventListener('submit', function (event) {
    event.preventDefault();
    state = model.edit(state, { servings: elements.servings.value, note: elements.note.value });
    state = model.prepare(state);
    if (!state.error) message = kept ? "The current sheet is separate from your kept version. Keep it to replace that version." : "This current sheet has not been kept. Keep it in this browser or download its text.";
    render();
    if (state.error) elements.servings.focus();
  });
  elements.keep.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    try {
      const nextKept = model.snapshot(state);
      localStorage.setItem(key, JSON.stringify(nextKept));
      kept = nextKept;
      message = `Kept your ${kept.servings}-serving worksheet in this browser. Reload will restore these quantities and this note.`;
    } catch {
      message = 'Keeping failed because browser storage is unavailable. Your current sheet is still here; download its text to keep a file.';
    }
    render();
  });
  elements.export.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    const url = URL.createObjectURL(new Blob([model.text(state)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sunday-table-${state.prepared.servings}-servings.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    message = `Downloaded the current ${state.prepared.servings}-serving worksheet, including its prepared note.`;
    render();
  });
  elements.restore.addEventListener('click', function () {
    if (!kept) return;
    state = model.fromKept(kept);
    message = `Restored the kept ${kept.servings}-serving version and discarded the draft edits.`;
    syncFields();
    render();
    elements.servings.focus();
  });
  elements.reset.addEventListener('click', function () {
    let cleared = true;
    try { localStorage.removeItem(key); } catch { cleared = false; }
    state = model.create();
    kept = null;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('servings');
    try { window.history.replaceState(null, '', cleanUrl); } catch { /* The worksheet also works when a file URL cannot change history. */ }
    message = cleared ? 'Worksheet reset. The input is 4 servings, the note is empty, and no kept version remains.' : 'The visible worksheet was reset, but browser storage could not be cleared. A stored version may return after reload.';
    syncFields();
    render();
    elements.servings.focus();
  });
  syncFields();
  render();
})();
