(function () {
  'use strict';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const model = window.Pressline.create(storage);
  const byId = id => document.getElementById(id);
  const text = (id, value) => { byId(id).textContent = value; };
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
  const hours = value => String(Number(value.toFixed(6)));
  const shortDate = value => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', timeZone:'UTC'}).format(new Date(value + 'T00:00:00Z'));
  const fullDate = value => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'}).format(new Date(value + 'T00:00:00Z'));
  const formFields = {status: byId('edit-status'), due: byId('edit-due'), hours: byId('edit-hours')};
  let draft = null;
  const params = new URLSearchParams(window.location.search);
  if (window.Pressline.statuses.includes(params.get('status'))) model.setFilters({status:params.get('status'), search:'', owner:'All'});
  if (params.get('job')) model.inspect(params.get('job'));
  if (params.has('status') || params.has('job')) {
    params.delete('status'); params.delete('job');
    try { window.history.replaceState(null, '', window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash); } catch { /* Local files can restrict history. */ }
  }
  function renderTotals() {
    const state = model.snapshot();
    document.querySelectorAll('[data-summary]').forEach(node => { node.textContent = hours(state.summary[node.dataset.summary]); });
  }
  function renderQueue() {
    const state = model.snapshot();
    const selected = new Set(state.selectedIds);
    let html = '';
    state.groups.forEach(group => {
      const groupHours = group.jobs.reduce((sum, job) => sum + job.hours, 0);
      html += `<tr class="group-row"><td colspan="8"><div class="group-label"><span>${escape(group.status)}</span><small>${group.jobs.length}</small><span class="group-hours">${hours(groupHours)} h in group</span></div></td></tr>`;
      group.jobs.forEach(job => {
        const inspected = job.id === state.inspectedId;
        html += `<tr class="job-row${inspected ? ' inspected' : ''}${selected.has(job.id) ? ' marked' : ''}" data-row="${job.id}"><td class="mark-column"><label class="mark-target"><input type="checkbox" data-mark="${job.id}" aria-label="Select ${job.id}, ${escape(job.title)}"${selected.has(job.id) ? ' checked' : ''}></label></td><td class="job-id">${job.id}</td><td class="job-title-cell"><button type="button" class="job-open" data-open="${job.id}" aria-controls="job-record" aria-pressed="${inspected}" aria-label="Open ${job.id}, ${escape(job.title)}">${escape(job.title)}</button></td><td class="client-cell">${escape(job.client)}</td><td class="owner-cell">${job.owner}</td><td class="due-cell"><time datetime="${job.due}">${shortDate(job.due)}</time></td><td class="status-cell"><span class="status" data-status="${job.status}">${job.status}</span></td><td class="hours-cell">${hours(job.hours)}</td></tr>`;
      });
    });
    byId('job-rows').innerHTML = html;
    text('visible-count', `${state.visible.length} of ${state.summary.total} jobs`);
    text('selected-count', `${selected.size} selected`);
    text('visible-hours', `${hours(state.visible.reduce((sum, job) => sum + job.hours, 0))} h in this view`);
    byId('clear-selection').hidden = selected.size === 0;
    byId('select-visible').disabled = state.visible.length === 0;
    byId('select-visible').checked = state.visible.length > 0 && selected.size === state.visible.length;
    byId('select-visible').indeterminate = selected.size > 0 && selected.size < state.visible.length;
    byId('job-table-region').hidden = state.visible.length === 0;
    byId('empty-results').hidden = state.visible.length !== 0;
    const scope = [state.filters.search.trim() ? `“${state.filters.search.trim()}”` : '', state.filters.status !== 'All' ? state.filters.status : '', state.filters.owner !== 'All' ? `owner ${state.filters.owner}` : ''].filter(Boolean).join(' · ');
    text('empty-reason', `No matches for ${scope || 'this view'}. Your twelve jobs are still on the desk.`);
    byId('job-search').value = state.filters.search;
    byId('status-filter').value = state.filters.status;
    byId('owner-filter').value = state.filters.owner;
    byId('clear-filters').disabled = !state.filters.search && state.filters.status === 'All' && state.filters.owner === 'All';
    renderOutsideNotice();
  }
  function renderOutsideNotice() {
    const state = model.snapshot();
    byId('outside-filter').hidden = !state.outsideFilter;
    if (!state.outsideFilter) return;
    const job = state.inspected;
    const reasons = [];
    if (state.filters.status !== 'All' && job.status !== state.filters.status) reasons.push(`Its status is ${job.status}; the filter is ${state.filters.status}.`);
    if (state.filters.owner !== 'All' && job.owner !== state.filters.owner) reasons.push(`Its owner is ${job.owner}; the filter is ${state.filters.owner}.`);
    if (state.filters.search.trim() && !window.Pressline.matches(job, {...state.filters, status:'All', owner:'All'})) reasons.push(`It does not match the search “${state.filters.search.trim()}”.`);
    text('outside-message', `${job.id} is outside this view. ${reasons.join(' ')} The saved record stays open.`);
  }
  function showErrors(errors = {}) {
    Object.entries(formFields).forEach(([key, field]) => {
      const error = byId(key + '-error');
      error.hidden = !errors[key]; error.textContent = errors[key] || '';
      field.setAttribute('aria-invalid', String(Boolean(errors[key])));
    });
  }
  function isDirty() {
    const saved = model.snapshot().inspected;
    return draft && (draft.status !== saved.status || draft.due !== saved.due || draft.hours !== String(saved.hours));
  }
  function renderDraftState() {
    const dirty = isDirty();
    text('draft-state', dirty ? 'Unsaved changes' : 'Saved record');
    byId('draft-state').classList.toggle('dirty', Boolean(dirty));
    text('draft-help', dirty ? 'Unsaved edits do not change the queue.' : 'Save to update the queue and totals.');
    byId('save-record').disabled = !dirty;
    byId('cancel-edit').disabled = !dirty;
  }
  function renderRecord() {
    const job = model.snapshot().inspected;
    text('record-id', job.id); text('record-title', job.title); text('record-client', job.client); text('record-owner', job.owner);
    text('record-status', job.status); byId('record-status').dataset.status = job.status;
    draft = {status:job.status, due:job.due, hours:String(job.hours)};
    Object.entries(formFields).forEach(([key, field]) => { field.value = draft[key]; field.disabled = false; });
    showErrors(); renderDraftState(); renderOutsideNotice();
  }
  function renderStorage() {
    const state = model.snapshot();
    text('storage-note', state.storage.available ? 'Saved changes resume here after reload. Drafts and checkboxes last for this visit.' : 'Browser storage unavailable. Changes last for this page only; reload restores the original sample.');
  }
  function announce(message) { text('live-message', message); renderStorage(); }
  function clearFilters() {
    model.setFilters({search:'', status:'All', owner:'All'}); renderQueue();
    announce(`Showing all twelve jobs. Checkboxes cleared; ${model.snapshot().inspectedId} remains open.`);
  }
  byId('job-search').addEventListener('input', event => {
    model.setFilters({search:event.target.value}); renderQueue();
    announce(`${model.snapshot().visible.length} matching jobs. Checkbox selection cleared.`);
  });
  ['status','owner'].forEach(key => byId(key + '-filter').addEventListener('change', event => {
    model.setFilters({[key]:event.target.value}); renderQueue();
    announce(`${model.snapshot().visible.length} matching jobs. Checkbox selection cleared.`);
  }));
  byId('clear-filters').addEventListener('click', clearFilters);
  document.querySelectorAll('[data-clear-filters]').forEach(button => button.addEventListener('click', clearFilters));
  byId('job-rows').addEventListener('click', event => {
    const button = event.target.closest('[data-open]');
    if (!button) return;
    const id = button.dataset.open;
    const before = model.snapshot().inspectedId;
    const discarded = before !== id && isDirty();
    model.inspect(id);
    if (before !== id) renderRecord();
    renderQueue();
    announce(`Opened ${id}, ${model.snapshot().inspected.title}.${discarded ? ' Previous unsaved draft discarded.' : ''}`);
    byId('record-title').focus({preventScroll:true});
    if (window.matchMedia('(max-width:1050px)').matches) byId('job-record').scrollIntoView({block:'start', behavior:'auto'});
  });
  byId('job-rows').addEventListener('change', event => {
    const checkbox = event.target.closest('[data-mark]');
    if (!checkbox) return;
    const id = checkbox.dataset.mark;
    model.mark(id, checkbox.checked); renderQueue();
    byId('job-rows').querySelector(`[data-mark="${id}"]`)?.focus({preventScroll:true});
    announce(`${model.snapshot().selectedIds.length} jobs selected. Open record unchanged.`);
  });
  byId('select-visible').addEventListener('change', event => { model.markVisible(event.target.checked); renderQueue(); announce(`${model.snapshot().selectedIds.length} jobs selected.`); });
  byId('clear-selection').addEventListener('click', () => { model.clearMarks(); renderQueue(); announce('Checkbox selection cleared. Open record unchanged.'); byId('select-visible').focus({preventScroll:true}); });
  Object.values(formFields).forEach(field => field.addEventListener('input', () => {
    draft = {status:formFields.status.value, due:formFields.due.value, hours:formFields.hours.value};
    showErrors(); renderDraftState();
  }));
  // Some hosts emit change without input for a native date or select control.
  Object.values(formFields).forEach(field => field.addEventListener('change', () => {
    draft = {status:formFields.status.value, due:formFields.due.value, hours:formFields.hours.value};
    showErrors(); renderDraftState();
  }));
  byId('record-form').addEventListener('submit', event => {
    event.preventDefault();
    const id = model.snapshot().inspectedId;
    const result = model.save(id, draft);
    if (!result.ok) {
      showErrors(result.errors); const first = Object.keys(result.errors)[0]; formFields[first]?.focus();
      announce('The job was not saved. Correct the marked field and save again.'); return;
    }
    renderTotals(); renderQueue(); renderRecord();
    const job = model.snapshot().inspected;
    announce(`Saved ${id}: ${job.status}, due ${fullDate(job.due)}, ${hours(job.hours)} estimated hours.${result.outsideFilter ? ' It no longer matches the current filters and stays open.' : ''}${result.persisted ? '' : ' Browser storage is unavailable; this change lasts for this page only.'}`);
  });
  byId('cancel-edit').addEventListener('click', () => { const id = model.snapshot().inspectedId; renderRecord(); announce(`Draft cancelled. Saved values for ${id} restored.`); });
  byId('reset-sample').addEventListener('click', () => {
    model.reset(); renderTotals(); renderQueue(); renderRecord();
    announce('Original sample restored: 12 jobs, 10 active, 6 due, 2 blocked, 39 hours. Filters and checkboxes cleared. P-1049 is open.');
  });
  ['reset-sample','job-search','status-filter','owner-filter'].forEach(id => { byId(id).disabled = false; });
  renderTotals(); renderQueue(); renderRecord();
  const state = model.snapshot();
  announce(state.storage.recovered ? 'Saved sample data was invalid. The original twelve jobs were restored.' : state.storage.saved ? 'Saved sample loaded. Open a job title to inspect its record.' : 'Sample desk ready. P-1049 is open; use a checkbox to select a job.');
})();
