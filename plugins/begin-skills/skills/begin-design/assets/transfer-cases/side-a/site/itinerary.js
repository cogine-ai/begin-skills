(function () {
  'use strict';
  const model = window.SideAItinerary;
  const form = document.getElementById('session-form');
  const inputs = Array.from(form.querySelectorAll('input[name="session"]'));
  const selectionStatus = document.getElementById('selection-status');
  const resultPanel = document.getElementById('prepared-panel');
  const resultStatus = document.getElementById('result-status');
  const resultContent = document.getElementById('result-content');
  const keepButton = document.getElementById('keep-itinerary');
  const exportButton = document.getElementById('export-itinerary');
  const reloadButton = document.getElementById('reload-itinerary');
  const savedSummary = document.getElementById('saved-summary');
  const feedback = document.getElementById('storage-feedback');
  let prepared = null, saved = null;
  function selected() { return inputs.filter(input => input.checked).map(input => input.value); }
  function setChoices(ids) { inputs.forEach(input => { input.checked = ids.includes(input.value); }); }
  function current() { return prepared && model.signature(selected()) === model.signature(prepared.sessionIds); }
  function node(tag, className, value) { const item = document.createElement(tag); if (className) item.className = className; if (value != null) item.textContent = value; return item; }
  function renderResult() {
    const isCurrent = current();
    resultPanel.classList.toggle('is-stale', !!prepared && !isCurrent);
    resultPanel.classList.toggle('is-prepared', !!prepared);
    resultContent.replaceChildren();
    if (!prepared) {
      resultStatus.textContent = 'Awaiting preparation';
      resultContent.append(node('p', 'empty-result', 'Your selected sessions, exact listening time and gaps will appear here after preparation.'));
    } else {
      resultStatus.textContent = isCurrent ? 'Prepared from your current selection' : 'Selection changed — rebuild this itinerary';
      resultContent.append(node('p', 'itinerary-date', prepared.dateLabel), node('p', 'itinerary-venue', prepared.venue + ' · venue local time'));
      const timeline = node('ol', 'itinerary-timeline');
      prepared.sessions.forEach((session, index) => {
        const row = node('li', 'timeline-session');
        row.append(node('span', 'timeline-time', session.start + '–' + session.end), node('strong', '', session.name), node('span', 'timeline-duration', session.durationMinutes + ' minutes listening'));
        timeline.append(row);
        if (prepared.gaps[index]) {
          const gap = prepared.gaps[index], gapRow = node('li', 'timeline-gap');
          gapRow.append(node('span', 'timeline-time', gap.start + '–' + gap.end), node('span', '', gap.minutes + ' minutes between sessions'));
          timeline.append(gapRow);
        }
      });
      resultContent.append(timeline);
      const totals = node('dl', 'itinerary-totals');
      [[String(prepared.listeningMinutes), 'minutes listening'], [String(prepared.gapMinutes), 'minutes between']].forEach(([value, label]) => {
        const group = node('div'); group.append(node('dt', '', label), node('dd', '', value)); totals.append(group);
      });
      resultContent.append(totals, node('p', 'itinerary-span', 'Your evening: ' + prepared.start + '–' + prepared.end));
      if (!isCurrent) resultContent.append(node('p', 'stale-help', 'This still shows the last prepared version. Prepare again to include your changed selection. Your kept version has not changed.'));
    }
    keepButton.disabled = !isCurrent;
    exportButton.disabled = !isCurrent;
  }
  function renderSaved() {
    reloadButton.disabled = !saved;
    savedSummary.textContent = saved ? 'Kept in this browser: ' + saved.itinerary.sessions.map(session => session.name).join(' + ') + '. ' + saved.itinerary.listeningMinutes + ' minutes listening, ' + saved.itinerary.gapMinutes + ' minutes between. Reloading restores this version.' : 'No itinerary is kept in this browser yet.';
  }
  function renderSelection() {
    inputs.forEach(input => input.closest('.session-choice').classList.toggle('is-selected', input.checked));
    const ids = selected(), error = model.validate(ids), overlaps = model.conflicts(ids);
    selectionStatus.classList.toggle('has-conflict', overlaps.length > 0);
    if (overlaps.length) {
      const overlap = overlaps[0];
      selectionStatus.textContent = overlap.first + ' and ' + overlap.second + ' overlap from ' + model.time(overlap.start) + ' to ' + model.time(overlap.end) + ' (' + overlap.minutes + ' minutes). Deselect one to prepare your evening.';
    } else selectionStatus.textContent = error || ids.length + ' session' + (ids.length === 1 ? '' : 's') + ' selected. These times fit together.';
    renderResult();
  }
  form.addEventListener('change', () => { feedback.textContent = ''; renderSelection(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = model.prepare(selected());
    if (!result.ok) { renderSelection(); selectionStatus.focus(); return; }
    prepared = result.itinerary;
    feedback.textContent = '';
    renderResult();
    document.getElementById('result-title').focus();
  });
  keepButton.addEventListener('click', () => {
    if (!current()) return;
    const record = model.makeSaved(prepared);
    try { localStorage.setItem(model.STORAGE_KEY, JSON.stringify(record)); saved = record; renderSaved(); feedback.textContent = 'Your current itinerary is kept in this browser. You can reload this version later.'; }
    catch (_) { feedback.textContent = 'This browser could not keep the itinerary. Your prepared version is still here; download a text copy to keep it.'; }
  });
  reloadButton.addEventListener('click', () => {
    try {
      const recovered = model.parseSaved(localStorage.getItem(model.STORAGE_KEY));
      if (!recovered) { saved = null; renderSaved(); feedback.textContent = 'A valid kept version is no longer available. Your current selection and prepared result are unchanged.'; return; }
      saved = recovered; prepared = recovered.itinerary; setChoices(prepared.sessionIds); renderSelection(); renderSaved(); feedback.textContent = 'The kept itinerary has been restored, including its session choices.';
    } catch (_) { feedback.textContent = 'This browser could not read its kept itinerary. Your current work is unchanged.'; }
  });
  exportButton.addEventListener('click', () => {
    if (!current()) return;
    const url = URL.createObjectURL(new Blob([model.text(prepared)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'side-a-13-nov-2026.txt'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = 'The text download contains your current prepared itinerary. Your kept version is unchanged.';
  });
  document.getElementById('clear-itinerary').addEventListener('click', () => {
    try { localStorage.removeItem(model.STORAGE_KEY); saved = null; prepared = null; setChoices([]); renderSelection(); renderSaved(); feedback.textContent = 'The kept itinerary was removed and your current selection was cleared.'; }
    catch (_) { feedback.textContent = 'This browser could not clear its kept version. Your current work is unchanged.'; }
  });
  try {
    const raw = localStorage.getItem(model.STORAGE_KEY);
    saved = model.parseSaved(raw);
    if (saved) { prepared = saved.itinerary; setChoices(prepared.sessionIds); feedback.textContent = 'Your kept itinerary was restored from this browser.'; }
    else if (raw) feedback.textContent = 'The stored itinerary could not be read. You can prepare a new version or clear the unreadable one.';
  } catch (_) { feedback.textContent = 'Browser storage is unavailable. You can still prepare and download an itinerary.'; }
  const requested = new URLSearchParams(window.location.search).getAll('session').filter(id => model.SESSIONS.some(session => session.id === id));
  if (requested.length) { setChoices([...new Set(requested)]); if (saved) feedback.textContent = 'The linked sessions are selected. Your kept version remains available below.'; }
  renderSelection(); renderSaved();
})();
