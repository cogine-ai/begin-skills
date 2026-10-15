(function () {
  'use strict';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const model = window.LanternState.create(storage);
  const byId = id => document.getElementById(id);
  const list = byId('event-list');
  const selector = byId('event-select');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const retryButton = byId('simulate-retry');
  const resetButton = byId('reset-samples');
  const live = byId('live-message');
  const setText = (id, text) => { byId(id).textContent = text; };
  const params = new URLSearchParams(window.location.search);
  if (window.LanternState.filters.includes(params.get('filter'))) model.setFilter(params.get('filter'));
  else if (params.get('event')) model.setFilter('All');
  if (params.get('event')) model.select(params.get('event'));
  // Entry links apply once. Reload then resumes the actual selected local state.
  if (params.has('event') || params.has('filter')) {
    params.delete('event'); params.delete('filter');
    const suffix = params.toString();
    try { window.history.replaceState(null, '', window.location.pathname + (suffix ? '?' + suffix : '') + window.location.hash); } catch { /* Restricted history does not prevent inspection. */ }
  }
  function render(message) {
    const state = model.snapshot();
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter)));
    document.querySelectorAll('[data-count]').forEach(item => { item.textContent = state.counts[item.dataset.count]; });
    setText('visible-count', `${state.visible.length} ${state.visible.length === 1 ? 'event' : 'events'}`);
    list.replaceChildren();
    selector.replaceChildren();
    state.visible.forEach(event => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'event-button';
      button.dataset.event = event.id;
      button.setAttribute('aria-pressed', String(event.id === state.selectedId));
      button.setAttribute('aria-label', `${event.id}, ${event.type}, ${event.status}, response ${event.response}, attempt ${event.attempt}`);
      const type = document.createElement('strong'); type.textContent = event.type;
      const id = document.createElement('span'); id.className = 'event-id'; id.textContent = event.id;
      const status = document.createElement('span'); status.className = 'status'; status.dataset.status = event.status; status.textContent = event.status;
      const meta = document.createElement('span'); meta.className = 'event-meta'; meta.textContent = `HTTP ${event.response} / ${event.duration} ms / attempt ${event.attempt}`;
      button.append(type, id, status, meta); li.append(button); list.append(li);
      const option = document.createElement('option'); option.value = event.id; option.textContent = `${event.id} · ${event.type} · ${event.status}`; option.selected = event.id === state.selectedId; selector.append(option);
    });
    selector.disabled = state.visible.length === 0;
    byId('mobile-selector').hidden = state.visible.length === 0;
    byId('empty-stream').hidden = state.visible.length !== 0;
    setText('empty-title', state.filter === 'All' ? 'No events in this view.' : `No ${state.filter.toLowerCase()} events.`);
    byId('event-detail').hidden = !state.selected;
    byId('detail-empty').hidden = Boolean(state.selected);
    byId('outside-filter').hidden = !state.outsideFilter;
    if (state.selected) {
      const event = state.selected;
      setText('detail-id', event.id); setText('detail-type', event.type);
      setText('detail-status', event.status); byId('detail-status').dataset.status = event.status;
      setText('detail-response', event.response); setText('detail-duration', event.duration); setText('detail-attempt', event.attempt);
      setText('detail-payload', JSON.stringify(event.payload, null, 2));
      retryButton.disabled = event.status === 'Delivered';
      setText('retry-help', event.status === 'Delivered' ? 'This event is already Delivered. Choose a Failed or Retrying event to simulate a retry.' : 'Simulate one local attempt: Delivered, response 200, 96 ms, and attempt +1. No webhook is sent.');
      if (state.outsideFilter) setText('outside-text', `${event.id} is now ${event.status} and no longer matches ${state.filter}. Its result stays open.`);
    } else { retryButton.disabled = true; }
    setText('storage-note', state.storage.available ? (state.storage.saved ? 'Saved in this browser. Reload keeps this sample state.' : 'Browser storage available. Changes will be saved here.') : 'Storage unavailable — changes last for this page only.');
    if (message) live.textContent = message;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    model.setFilter(button.dataset.filter);
    const state = model.snapshot();
    render(`${state.filter}: ${state.visible.length} ${state.visible.length === 1 ? 'event' : 'events'}.${state.selected ? ` Selected ${state.selected.id}.` : ' Show all events or reset samples to continue.'}`);
  }));
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-event]');
    if (!button || !model.select(button.dataset.event)) return;
    const selected = model.snapshot().selected;
    render(`Selected ${selected.id}, ${selected.type}, ${selected.status}.`);
    list.querySelector(`[data-event="${selected.id}"]`)?.focus();
  });
  selector.addEventListener('change', () => {
    if (!model.select(selector.value)) return;
    const selected = model.snapshot().selected;
    render(`Selected ${selected.id}, ${selected.type}, ${selected.status}.`);
  });
  retryButton.addEventListener('click', () => {
    const result = model.retry();
    if (!result.ok) { render(result.reason); byId('detail-type').focus(); return; }
    const state = model.snapshot();
    render(`${result.id} simulated retry complete: Delivered, response 200, 96 ms, attempt ${result.attempt}. ID and payload unchanged.${result.outsideFilter ? ` It no longer matches ${state.filter}; its result stays open. Choose Show all events.` : ''}`);
    byId('detail-type').focus();
  });
  document.querySelectorAll('[data-show-all]').forEach(button => button.addEventListener('click', () => {
    model.setFilter('All');
    render(`Showing all 4 events. Selected ${model.snapshot().selected.id}.`);
    byId('detail-type').focus();
  }));
  resetButton.addEventListener('click', () => {
    model.reset();
    render('Samples reset. All 4 original records restored in order. All selected; inspecting event_1044.');
    byId('detail-type').focus();
  });
  resetButton.disabled = false;
  const state = model.snapshot();
  render(state.storage.recovered ? 'Saved sample data was invalid. The four original records were restored.' : state.storage.saved ? 'Saved sample state loaded. Inspect a record or reset the originals.' : 'Sample stream ready. Choose a Failed or Retrying event to simulate a retry.');
})();
