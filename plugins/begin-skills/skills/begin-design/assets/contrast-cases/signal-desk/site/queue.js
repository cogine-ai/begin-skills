(function () {
  'use strict';
  const S = window.SignalDesk, V = window.SignalView;
  const $ = id => document.getElementById(id);
  let storage = null;
  try { storage = window.localStorage; } catch {}
  const model = S.create(storage);
  let selectedId = 'SD-01';
  const filters = {day: 'all', editor: 'all'};
  const fields = {editor: $('edit-editor'), day: $('edit-day'), slot: $('edit-slot'), minutes: $('edit-minutes')};
  const message = value => { $('live-message').textContent = value; };
  const rev = n => String(n).padStart(2, '0');
  function draft() { return Object.fromEntries(Object.entries(fields).map(([key, el]) => [key, el.value])); }
  function selected() { return model.snapshot().queue.find(r => r.id === selectedId); }
  function dirty() {
    const r = selected(), f = draft();
    return f.editor !== r.editor || f.day !== String(r.day) || f.slot !== r.slot || f.minutes !== String(r.minutes);
  }
  function matches(r) { return (filters.day === 'all' || r.day === Number(filters.day)) && (filters.editor === 'all' || r.editor === filters.editor); }
  function clearErrors() {
    $('field-errors').hidden = true;
    $('field-errors').textContent = '';
    for (const el of Object.values(fields)) el.removeAttribute('aria-invalid');
  }
  function fillEditor() {
    const r = selected();
    $('record-id').textContent = r.id;
    $('record-title').textContent = r.title;
    $('record-strand').textContent = r.strand;
    $('record-picker').value = r.id;
    for (const [key, el] of Object.entries(fields)) { el.value = r[key]; el.disabled = false; }
    clearErrors();
  }
  function renderRows(s) {
    const visible = S.ordered(s.queue).filter(matches);
    const issueIds = new Set(s.issues.flatMap(i => i.ids));
    $('queue-rows').innerHTML = visible.map(r => V.row(r, true, r.id === selectedId, issueIds.has(r.id))).join('');
    $('visible-count').textContent = `${visible.length} of ${s.count} episodes`;
    $('visible-minutes').textContent = `${visible.reduce((sum, r) => sum + r.minutes, 0)} min in this view`;
    $('empty-queue').hidden = visible.length !== 0;
    $('clear-filters').disabled = filters.day === 'all' && filters.editor === 'all';
    $('outside-view').textContent = visible.some(r => r.id === selectedId) ? 'A draft stays here until you apply it' : `${selectedId} is outside this filtered view. Show all to see its row.`;
  }
  function renderPlan(s) {
    const pending = dirty();
    const ready = s.current && !pending;
    const state = s.prepared ? (ready ? 'current' : 'stale') : 'empty';
    $('prepared-state').dataset.state = state;
    $('prepared-area').dataset.state = state;
    $('prepared-state').textContent = state === 'current' ? 'Current' : state === 'stale' ? 'Stale' : 'Not prepared';
    $('plan-output').hidden = !s.prepared;
    $('plan-output').textContent = s.prepared ? s.prepared.text : '';
    if (!s.prepared) $('prepared-hint').textContent = pending ? 'Apply or cancel the episode draft, then prepare the queue.' : 'Prepare the applied queue to make a text plan you can keep or download.';
    else if (pending) $('prepared-hint').textContent = `Unapplied edits in ${selectedId}. The text below remains prepared revision ${rev(s.prepared.revision)}. Apply or cancel the edits before using it.`;
    else if (!s.current) $('prepared-hint').textContent = `Queue revision ${rev(s.revision)} has changed. The text below remains prepared revision ${rev(s.prepared.revision)}. Prepare the current plan again before keeping or downloading.`;
    else $('prepared-hint').textContent = `${s.count} episodes / ${s.total} estimated edit minutes / revision ${rev(s.revision)}. This text matches the applied queue.`;
    $('prepare-plan').disabled = pending || s.issues.length > 0;
    $('prepare-plan').classList.toggle('primary', !ready);
    $('prepare-help').textContent = pending ? 'Apply or cancel the open draft before preparing. Checks below describe the applied queue.' : s.issues.length ? `${s.issues.length} assignment issues in the applied queue. Resolve both slot clashes and daily overloads before preparing.` : 'No slot clashes. Every editor is within the 240-minute daily limit.';
    $('issues-list').hidden = s.issues.length === 0;
    $('issues-list').innerHTML = s.issues.map(i => `<li>${V.esc(i.text)}</li>`).join('');
    $('keep-plan').disabled = !ready || !s.storage.available;
    $('download-plan').disabled = !ready;
    $('reload-plan').disabled = !s.storage.available || !s.storage.kept || s.storage.invalid;
    $('forget-plan').disabled = !s.storage.available || !s.storage.kept;
    $('local-state').textContent = s.storage.invalid ? 'Unreadable local copy' : s.storage.kept ? 'Local copy exists' : 'Not kept locally';
    $('local-state').dataset.state = s.storage.invalid ? 'issues' : s.storage.kept ? 'current' : 'empty';
    $('storage-note').textContent = !s.storage.available ? 'Local storage is unavailable. You can edit, prepare and download during this open session, but cannot keep or recover a browser copy.' : s.storage.invalid ? 'A local copy does not match this example and could not be loaded. Forget local copy removes it. The original week opened without replacing that unreadable copy.' : s.storage.kept ? 'One prepared plan is kept in this browser. Later edits remain in the open session until you keep a current version. Reloading the queue page restores the last kept plan.' : 'No copy is kept. Edits and prepared text last only while this page remains open. Keep locally explicitly stores one current plan.';
  }
  function renderDraft() {
    const pending = dirty();
    $('draft-state').textContent = pending ? 'Unapplied edits' : 'Matches queue';
    $('apply-record').disabled = !pending;
    $('cancel-edit').disabled = !pending;
    $('draft-help').textContent = pending ? 'Apply to update the queue. A prepared plan cannot be used during an open edit.' : 'Choose a field to revise this episode. Apply it to update the queue.';
    const f = draft();
    $('move-earlier').disabled = !S.move(f.day, f.slot, -1);
    $('move-later').disabled = !S.move(f.day, f.slot, 1);
    renderPlan(model.snapshot());
  }
  function renderAll() {
    const s = model.snapshot();
    $('total-episodes').textContent = String(s.count).padStart(2, '0');
    $('total-minutes').textContent = String(s.total);
    $('checks-summary').textContent = s.issues.length ? `${s.issues.length} assignment issues` : 'All assignments fit';
    $('checks-summary').classList.toggle('has-issues', s.issues.length > 0);
    $('queue-revision').textContent = `Queue revision ${rev(s.revision)}`;
    renderRows(s);
    V.renderLoads($('queue-loads'), s.loads);
    renderDraft();
  }
  function openRecord(id, jump) {
    if (!model.snapshot().queue.some(r => r.id === id)) return;
    if (id !== selectedId && dirty()) {
      $('record-picker').value = selectedId;
      message(`Apply or cancel the unapplied ${selectedId} edits before opening another episode.`);
      $('draft-help').textContent = 'Apply to queue or Cancel edits before opening another episode.';
      $('episode-editor').scrollIntoView({block: 'start'});
      $('apply-record').focus({preventScroll: true});
      return;
    }
    if (id !== selectedId) { selectedId = id; fillEditor(); }
    renderAll();
    if (jump && window.matchMedia('(max-width:960px)').matches) {
      $('episode-editor').scrollIntoView({block: 'start'});
      $('record-title').focus({preventScroll: true});
    }
    message(`Opened ${selectedId}, ${selected().title}.`);
  }
  $('queue-rows').addEventListener('click', e => { const button = e.target.closest('[data-open]'); if (button) openRecord(button.dataset.open, true); });
  $('record-picker').addEventListener('change', e => openRecord(e.target.value, false));
  for (const el of Object.values(fields)) {
    el.addEventListener('input', () => { clearErrors(); renderDraft(); });
    el.addEventListener('change', () => { clearErrors(); renderDraft(); if (dirty()) message(`${selectedId} has unapplied edits. Apply or cancel before preparing or using a prepared plan.`); });
  }
  $('record-form').addEventListener('submit', e => {
    e.preventDefault();
    const result = model.apply(selectedId, draft());
    if (!result.ok) {
      $('field-errors').textContent = Object.values(result.errors).join(' ');
      $('field-errors').hidden = false;
      const first = Object.keys(result.errors).find(key => fields[key]);
      for (const key of Object.keys(result.errors)) if (fields[key]) fields[key].setAttribute('aria-invalid', 'true');
      if (first) fields[first].focus();
      message('The episode was not applied. Correct the marked field; the queue has not changed.');
      return;
    }
    fillEditor(); renderAll();
    const s = model.snapshot();
    message(result.changed ? `${selectedId} applied to queue revision ${rev(s.revision)}. ${s.total} estimated edit minutes across all six episodes. ${s.issues.length ? `${s.issues.length} assignment issues need attention below.` : 'All assignments fit.'}` : `${selectedId} already matches the queue. No new revision was made.`);
  });
  $('cancel-edit').addEventListener('click', () => { fillEditor(); renderAll(); message(`Unapplied ${selectedId} edits canceled. The queue and prepared text are unchanged.`); });
  function moveDraft(delta) {
    const f = draft(), next = S.move(f.day, f.slot, delta);
    if (!next) return;
    fields.day.value = String(next.day); fields.slot.value = next.slot;
    clearErrors(); renderDraft();
    message(`${selectedId} draft moved to ${S.days[next.day].name} ${S.slots[next.slot].toLowerCase()}. Apply to queue to commit this move.`);
  }
  $('move-earlier').addEventListener('click', () => moveDraft(-1));
  $('move-later').addEventListener('click', () => moveDraft(1));
  function showAll() {
    filters.day = 'all'; filters.editor = 'all';
    $('day-filter').value = 'all'; $('editor-filter').value = 'all';
    renderAll(); message('All six episodes are visible. The applied queue is unchanged.');
  }
  $('day-filter').addEventListener('change', e => { filters.day = e.target.value; renderAll(); message('The day filter changed the visible rows. Whole-queue totals and prepared text are unchanged.'); });
  $('editor-filter').addEventListener('change', e => { filters.editor = e.target.value; renderAll(); message('The editor filter changed the visible rows. Whole-queue totals and prepared text are unchanged.'); });
  $('clear-filters').addEventListener('click', showAll);
  $('show-all').addEventListener('click', showAll);
  $('prepare-plan').addEventListener('click', () => {
    if (dirty() || !model.prepare()) return;
    renderAll();
    message(`Current plan prepared from queue revision ${rev(model.snapshot().revision)}. You can keep it locally or download the text.`);
    $('plan-output').focus({preventScroll: true});
  });
  $('keep-plan').addEventListener('click', () => {
    if (dirty()) return;
    const success = model.keep(); renderAll();
    message(success ? `Current revision ${rev(model.snapshot().revision)} kept locally. Reload restores this queue and prepared plan.` : 'The browser could not keep this plan. Download the current text to retain it.');
  });
  $('download-plan').addEventListener('click', () => {
    const s = model.snapshot(); if (!s.current || dirty()) return;
    const url = URL.createObjectURL(new Blob([s.prepared.text + '\n'], {type: 'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `signal-desk-week-42-r${rev(s.revision)}.txt`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message(`Downloaded current revision ${rev(s.revision)} as ${anchor.download}. No team message was sent.`);
  });
  $('reload-plan').addEventListener('click', () => {
    if (!model.reload()) { renderAll(); message('No readable kept plan could be reloaded. The open queue is unchanged.'); return; }
    selectedId = 'SD-01'; filters.day = 'all'; filters.editor = 'all';
    $('day-filter').value = 'all'; $('editor-filter').value = 'all';
    fillEditor(); renderAll();
    message(`Kept revision ${rev(model.snapshot().revision)} restored. Open drafts and unkept changes were discarded.`);
  });
  $('forget-plan').addEventListener('click', () => {
    const success = model.forget(); renderAll();
    message(success ? 'Local copy forgotten. Your open queue and prepared text remain here. Reloading the page starts from the original week.' : 'The browser could not remove the local copy. Your open queue is unchanged.');
  });
  $('restore-example').addEventListener('click', () => {
    model.restore(); selectedId = 'SD-01'; filters.day = 'all'; filters.editor = 'all';
    $('day-filter').value = 'all'; $('editor-filter').value = 'all';
    fillEditor(); renderAll();
    message('Original 840-minute example week restored. There is no prepared plan. Any kept local copy is still available.');
  });
  for (const id of ['day-filter','editor-filter','record-picker','restore-example']) $(id).disabled = false;
  fillEditor(); renderAll();
  const starting = model.snapshot();
  if (starting.storage.invalid) message('The stored copy could not be recognized. The original week is open; use Forget local copy to remove the unreadable copy.');
  else if (starting.storage.kept) message(`Kept revision ${rev(starting.revision)} loaded. Choose an episode to edit or download its current plan.`);
})();
