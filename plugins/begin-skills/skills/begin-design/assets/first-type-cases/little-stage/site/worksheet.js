(function () {
  'use strict';
  const model = window.LittleStageBudget;
  const storageKey = 'little-stage.ticket-budget.v1';
  const ids = ['budget-form', 'show-options', 'adults', 'students', 'note', 'show-error', 'adults-error', 'students-error', 'party-error', 'note-error', 'error-summary', 'result-status', 'empty-result', 'prepared-result', 'result-show', 'result-date', 'result-duration', 'result-adults', 'result-students', 'result-adult-line', 'result-student-line', 'result-party', 'result-total', 'prepared-note', 'result-note', 'keep', 'export', 'action-help', 'storage-status', 'restore', 'reset', 'forget'];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const radios = Array.from(document.querySelectorAll('input[name="show"]'));
  let state = model.create();
  let kept = null;
  let message = 'No kept budget in this browser.';
  let storageFailed = false;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const recovered = model.decode(raw);
      if (recovered) {
        state = recovered;
        kept = model.snapshot(recovered);
        message = `Restored your kept ${kept.partySize}-ticket budget for ${kept.show.title}, USD${kept.total}.`;
      } else {
        message = 'The kept copy could not be read. Your worksheet starts fresh. Prepare and keep a new budget to replace it.';
        storageFailed = true;
      }
    }
  } catch {
    message = 'This browser could not read local storage. You can still prepare and download a budget.';
    storageFailed = true;
  }

  const url = new URL(window.location.href);
  const patch = {};
  const requestedShow = url.searchParams.get('show');
  if (requestedShow && Object.hasOwn(model.shows, requestedShow)) patch.show = requestedShow;
  for (const name of ['adults', 'students']) if (url.searchParams.has(name)) patch[name] = url.searchParams.get(name);
  if (Object.keys(patch).length) {
    state = model.edit(state, patch);
    message = kept ? 'The link filled your draft choices. Your kept budget remains available; prepare this draft before keeping it.' : 'The link filled your draft choices. Prepare the ticket budget to see this visit’s total.';
    for (const name of ['show', 'adults', 'students']) url.searchParams.delete(name);
    try { window.history.replaceState(null, '', url); } catch { /* A file URL can restrict history updates. */ }
  }

  function syncFields() {
    for (const radio of radios) radio.checked = radio.value === state.input.show;
    for (const name of ['adults', 'students', 'note']) el[name].value = state.input[name];
  }

  function readFields() {
    return { show: radios.find(radio => radio.checked)?.value || '', adults: el.adults.value, students: el.students.value, note: el.note.value };
  }

  function render() {
    const current = model.isCurrent(state);
    for (const name of ['show', 'adults', 'students', 'party', 'note']) el[`${name}-error`].textContent = state.errors[name] || '';
    for (const name of ['adults', 'students']) el[name].setAttribute('aria-invalid', state.errors[name] || state.errors.party ? 'true' : 'false');
    el.note.setAttribute('aria-invalid', state.errors.note ? 'true' : 'false');
    for (const radio of radios) radio.setAttribute('aria-invalid', state.errors.show ? 'true' : 'false');
    el['error-summary'].textContent = Object.keys(state.errors).length ? 'The budget could not be prepared. Correct the marked entries and try again.' : '';
    el.keep.disabled = !current;
    el.export.disabled = !current;
    el.restore.disabled = !kept;
    el.forget.disabled = !kept;
    el['empty-result'].hidden = Boolean(state.prepared);
    el['prepared-result'].hidden = !state.prepared;
    el['result-status'].classList.toggle('current', current);
    el['result-status'].classList.toggle('stale', Boolean(state.prepared && !current));
    el['result-status'].textContent = current ? 'Prepared · Current' : state.prepared ? 'Stale · Prepare again to use your edits' : 'Not prepared';
    if (state.prepared) {
      const sheet = state.prepared;
      el['result-show'].textContent = sheet.show.title;
      el['result-date'].textContent = `${sheet.show.date} · ${sheet.show.time}`;
      el['result-duration'].textContent = `${sheet.show.minutes} minutes`;
      el['result-adults'].textContent = sheet.adults;
      el['result-students'].textContent = sheet.students;
      el['result-adult-line'].textContent = `USD${sheet.adultLine}`;
      el['result-student-line'].textContent = `USD${sheet.studentLine}`;
      el['result-party'].textContent = `${sheet.partySize} ${sheet.partySize === 1 ? 'ticket' : 'tickets'}`;
      el['result-total'].textContent = sheet.total;
      el['prepared-note'].hidden = !sheet.note;
      el['result-note'].textContent = sheet.note;
    }
    el['action-help'].textContent = current ? 'Keep this preparation for reload, or download its current text. Keeping replaces the last kept copy.' : state.prepared ? 'The previous preparation is shown above. Keeping and downloading are blocked until you prepare again.' : 'Prepare a budget to enable keeping and downloading.';
    el['storage-status'].textContent = message;
    el['storage-status'].classList.toggle('failure', storageFailed);
  }

  function onEdit() {
    state = model.edit(state, readFields());
    message = kept ? `Your kept budget for ${kept.show.title}, USD${kept.total}, is still available. These edits have not been kept.` : 'These edits have not been kept. Prepare a budget, then keep it for reload.';
    render();
  }
  for (const radio of radios) radio.addEventListener('change', onEdit);
  for (const name of ['adults', 'students', 'note']) el[name].addEventListener('input', onEdit);
  el['budget-form'].addEventListener('submit', function (event) {
    event.preventDefault();
    state = model.prepare(model.edit(state, readFields()));
    if (model.isCurrent(state)) message = kept ? 'The prepared budget is current. Keep it to replace your previous kept copy, or download this version.' : 'Your current budget is ready. Keep it for reload or download its text.';
    render();
    if (Object.keys(state.errors).length) {
      if (state.errors.show) radios[0].focus();
      else if (state.errors.adults || state.errors.party) el.adults.focus();
      else if (state.errors.students) el.students.focus();
      else el.note.focus();
    }
  });
  el.keep.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    try {
      const nextKept = model.snapshot(state);
      localStorage.setItem(storageKey, JSON.stringify(nextKept));
      kept = nextKept;
      storageFailed = false;
      message = `Kept ${kept.partySize} ${kept.partySize === 1 ? 'ticket' : 'tickets'} for ${kept.show.title}, USD${kept.total}. Reload will restore this budget and note.`;
    } catch {
      storageFailed = true;
      message = 'Keeping failed because browser storage is unavailable. Your current budget is still here; download its text to keep a file.';
    }
    render();
  });
  el.export.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    const objectUrl = URL.createObjectURL(new Blob([model.text(state)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `little-stage-${state.prepared.show.id}-${state.prepared.partySize}-tickets.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    message = `The current ${state.prepared.partySize}-ticket budget was passed to your browser for download. Keeping is a separate action.`;
    render();
  });
  el.restore.addEventListener('click', function () {
    if (!kept) return;
    state = model.recover(kept);
    message = `Restored your kept budget for ${kept.show.title}, USD${kept.total}, and discarded the draft edits.`;
    syncFields();
    render();
    radios.find(radio => radio.checked).focus();
  });
  el.reset.addEventListener('click', function () {
    state = model.create();
    message = kept ? 'Worksheet reset to 1 adult for The Borrowed Moon. Your kept budget is still available to restore.' : 'Worksheet reset to 1 adult for The Borrowed Moon. No kept budget is available.';
    syncFields();
    render();
    radios[0].focus();
  });
  el.forget.addEventListener('click', function () {
    try {
      localStorage.removeItem(storageKey);
      kept = null;
      storageFailed = false;
      message = 'The kept copy was removed from this browser. Your visible worksheet and downloaded files remain.';
    } catch {
      storageFailed = true;
      message = 'The browser could not remove the kept copy. It may return after reload. Your visible worksheet is still here.';
    }
    render();
  });
  syncFields();
  render();
})();
