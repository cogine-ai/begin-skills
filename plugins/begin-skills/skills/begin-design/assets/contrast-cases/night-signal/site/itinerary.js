'use strict';
(function () {
  const M = window.NightSignal;
  const form = document.querySelector('#session-form');
  const boxes = Array.from(form.querySelectorAll('input[name="session"]'));
  const note = document.querySelector('#field-note');
  const selectionStatus = document.querySelector('#selection-status');
  const panel = document.querySelector('#prepared-panel');
  const resultStatus = document.querySelector('#result-status');
  const resultContent = document.querySelector('#result-content');
  const resultTitle = document.querySelector('#result-title');
  const keepButton = document.querySelector('#keep-itinerary');
  const downloadButton = document.querySelector('#download-itinerary');
  const reloadButton = document.querySelector('#reload-itinerary');
  const forgetButton = document.querySelector('#forget-itinerary');
  const confirmation = document.querySelector('#forget-confirm');
  const feedback = document.querySelector('#storage-feedback');
  let revision = 0;
  let preparedRevision = -1;
  let prepared = null;
  let kept = null;
  let hasStored = false;

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function ids() { return boxes.filter(box => box.checked).map(box => box.value); }
  function current() { return prepared !== null && preparedRevision === revision; }
  function tell(text) { feedback.textContent = text; }
  function setChoices(sessionIds, fieldNote) {
    boxes.forEach(box => { box.checked = sessionIds.includes(box.value); });
    note.value = fieldNote;
  }
  function renderSelection() {
    const chosen = ids();
    const clashes = M.conflicts(chosen);
    selectionStatus.replaceChildren();
    selectionStatus.classList.toggle('has-error', clashes.length > 0);
    boxes.forEach(box => {
      const label = box.closest('.session-choice');
      label.classList.toggle('is-selected', box.checked);
      label.classList.toggle('is-conflict', clashes.some(c => c.first === box.value || c.second === box.value));
    });
    document.querySelector('#note-count').textContent = note.value.length + ' / ' + M.NOTE_LIMIT;
    if (clashes.length) {
      selectionStatus.append(node('p', '', 'These choices overlap. Keep one session from each pair.'));
      clashes.forEach(c => {
        const day = M.DAYS.find(d => d.id === c.day);
        selectionStatus.append(node('p', '', day.short + ' · ' + c.firstName + ' + ' + c.secondName + ': ' + M.time(c.start) + '–' + M.time(c.end) + ' / ' + c.minutes + ' minutes overlap.'));
      });
    } else {
      selectionStatus.append(node('p', '', chosen.length ? chosen.length + (chosen.length === 1 ? ' session selected. No overlaps. Ready to prepare.' : ' sessions selected. No overlaps. Ready to prepare.') : 'Choose at least one session to prepare an itinerary.'));
    }
  }
  function renderResult() {
    panel.classList.toggle('is-prepared', !!prepared);
    panel.classList.toggle('is-stale', !!prepared && !current());
    resultStatus.textContent = !prepared ? 'Not prepared' : current() ? 'Current · ready to keep or download' : 'Out of date · prepare again';
    keepButton.disabled = !current();
    downloadButton.disabled = !current();
    if (!prepared) return;
    resultContent.replaceChildren();
    const totals = node('dl', 'itinerary-totals');
    [['Sessions', prepared.sessionCount, 'selected'], ['Session time', prepared.sessionMinutes, 'minutes'], ['Between sessions', prepared.gapMinutes, 'minutes']].forEach(([label, value, unit]) => {
      const group = node('div');
      const amount = node('dd', '', String(value));
      amount.append(node('small', '', unit));
      group.append(node('dt', '', label), amount);
      totals.append(group);
    });
    resultContent.append(totals);
    prepared.days.forEach(day => {
      const section = node('section', 'result-day');
      section.append(node('h3', '', day.label));
      const list = node('ol', 'itinerary-list');
      day.sessions.forEach((session, index) => {
        const row = node('li', 'itinerary-session');
        const stamp = node('time', '', session.start + '–' + session.end);
        stamp.dateTime = day.date + 'T' + session.start;
        const text = node('div');
        text.append(node('strong', '', session.name), node('span', '', session.minutes + ' minutes · ' + session.station));
        row.append(stamp, text);
        list.append(row);
        if (day.gaps[index]) {
          const gap = day.gaps[index];
          list.append(node('li', 'itinerary-gap', gap.start + '–' + gap.end + ' · ' + gap.minutes + ' minutes between sessions'));
        }
      });
      section.append(list, node('p', 'day-span', 'Day span ' + day.start + '–' + day.end));
      resultContent.append(section);
    });
    if (prepared.note) {
      const fieldNote = node('section', 'result-note');
      fieldNote.append(node('h3', '', 'My field note'), node('p', '', prepared.note));
      resultContent.append(fieldNote);
    }
    resultContent.append(node('p', 'sheet-boundary', 'Venue local time · breaks count within each day, excluding overnight. A personal plan for a fictional event; no place is reserved.'));
  }
  function renderKept() {
    reloadButton.disabled = !kept;
    forgetButton.disabled = !hasStored;
    const summary = document.querySelector('#saved-summary');
    if (kept) {
      const stamp = new Date(kept.savedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      summary.textContent = 'Kept: ' + kept.itinerary.sessionCount + ' sessions · ' + kept.itinerary.sessionMinutes + ' session minutes. Kept ' + stamp + ' (this browser’s time).';
    } else summary.textContent = hasStored ? 'A stored version is unreadable. You can forget it and keep a fresh plan.' : 'No itinerary is kept in this browser.';
  }
  function readKept() {
    try {
      const raw = window.localStorage.getItem(M.STORAGE_KEY);
      hasStored = raw !== null;
      kept = hasStored ? M.parseSaved(raw) : null;
      renderKept();
      if (hasStored && !kept) tell('The kept data is unreadable. Choose fresh sessions, or forget that stored version.');
      return true;
    } catch (_) {
      tell('Browser storage could not be read. You can still prepare and download your itinerary.');
      return false;
    }
  }
  function restore(plan) {
    setChoices(plan.sessionIds, plan.note);
    revision += 1;
    prepared = plan;
    preparedRevision = revision;
    confirmation.hidden = true;
    renderSelection();
    renderResult();
  }
  function edited() {
    revision += 1;
    confirmation.hidden = true;
    tell('');
    renderSelection();
    renderResult();
  }
  boxes.forEach(box => box.addEventListener('change', edited));
  note.addEventListener('input', edited);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = M.prepare(ids(), note.value);
    renderSelection();
    if (!result.ok) {
      selectionStatus.classList.add('has-error');
      selectionStatus.prepend(node('p', '', result.error));
      selectionStatus.focus();
      renderResult();
      return;
    }
    prepared = result.itinerary;
    preparedRevision = revision;
    tell('');
    renderResult();
    resultTitle.focus();
  });
  document.querySelector('#clear-choices').addEventListener('click', () => {
    setChoices([], '');
    edited();
    selectionStatus.focus();
  });
  keepButton.addEventListener('click', () => {
    if (!current()) { tell('Prepare the current choices before keeping.'); return; }
    const record = M.makeSaved(prepared);
    if (!record) { tell('This result could not be kept. Prepare it again.'); return; }
    try {
      const raw = JSON.stringify(record);
      window.localStorage.setItem(M.STORAGE_KEY, raw);
      if (window.localStorage.getItem(M.STORAGE_KEY) !== raw) throw new Error('Storage readback failed');
      kept = record;
      hasStored = true;
      renderKept();
      tell('This prepared version is kept in this browser. Later edits will not replace it automatically.');
    } catch (_) { tell('Browser storage could not be written. Your current result is still here; download text for a separate copy.'); }
  });
  downloadButton.addEventListener('click', () => {
    if (!current()) { tell('Prepare the current choices before downloading.'); return; }
    try {
      const blob = new Blob([M.exportText(prepared)], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = node('a');
      link.href = url;
      link.download = 'night-signal-itinerary.txt';
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      tell('Download requested: night-signal-itinerary.txt. Check your browser’s downloads list.');
    } catch (_) { tell('The download could not be started. Check this browser’s download permissions and try again.'); }
  });
  reloadButton.addEventListener('click', () => {
    if (!readKept() || !kept) return;
    restore(kept.itinerary);
    resultTitle.focus();
    tell('The kept version has replaced your current choices, note and prepared result.');
  });
  forgetButton.addEventListener('click', () => {
    confirmation.hidden = false;
    document.querySelector('#confirm-forget').focus();
  });
  document.querySelector('#cancel-forget').addEventListener('click', () => {
    confirmation.hidden = true;
    forgetButton.focus();
  });
  document.querySelector('#confirm-forget').addEventListener('click', () => {
    try {
      window.localStorage.removeItem(M.STORAGE_KEY);
      if (window.localStorage.getItem(M.STORAGE_KEY) !== null) throw new Error('Removal readback failed');
      kept = null;
      hasStored = false;
      confirmation.hidden = true;
      renderKept();
      tell('The kept version is forgotten. Your current choices and result remain on the page.');
      document.querySelector('#keep-title').setAttribute('tabindex', '-1');
      document.querySelector('#keep-title').focus();
    } catch (_) { tell('Browser storage could not be changed. The kept version has not been confirmed removed. Try again when storage is available.'); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== M.STORAGE_KEY && event.key !== null) return;
    if (readKept()) tell(kept ? 'The kept version changed in another tab. Your current work stays here; reload the kept version to use it.' : hasStored ? 'Another tab left unreadable kept data. Your current work stays here.' : 'The kept version was removed in another tab. Your current work stays here.');
  });
  if (readKept() && kept) restore(kept.itinerary);
  const choiceParameter = new URLSearchParams(window.location.search).get('choose');
  if (choiceParameter !== null) {
    const choiceIds = choiceParameter.split(',');
    if (!M.validate(choiceIds, '')) {
      setChoices(choiceIds, '');
      revision += 1;
      tell('The linked session choices are ready. Any kept version remains available below.');
    } else tell('The link contained an unrecognized choice. Select from the six listed sessions.');
  }
  renderSelection();
  renderResult();
  renderKept();
})();
