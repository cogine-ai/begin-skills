/* Shared by the actual inspector and the executable behavior check. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'lantern.sample-stream.v1';
  const FILTERS = ['All', 'Delivered', 'Failed', 'Retrying'];
  const ORIGINALS = [
    { id: 'event_1044', type: 'invoice.paid', status: 'Delivered', response: 200, duration: 142, attempt: 1, payload: { invoice_id: 'inv_482', amount_cents: 4900, currency: 'USD' } },
    { id: 'event_1043', type: 'subscription.updated', status: 'Failed', response: 503, duration: 0, attempt: 2, payload: { subscription_id: 'sub_190', status: 'active', plan: 'studio' } },
    { id: 'event_1042', type: 'checkout.completed', status: 'Retrying', response: 429, duration: 0, attempt: 3, payload: { checkout_id: 'chk_602', total_cents: 12000, currency: 'USD' } },
    { id: 'event_1041', type: 'payment.refunded', status: 'Delivered', response: 200, duration: 87, attempt: 1, payload: { payment_id: 'pay_816', amount_cents: 2500, currency: 'USD' } }
  ];
  const copy = value => JSON.parse(JSON.stringify(value));
  const initial = () => ({ version: 1, events: copy(ORIGINALS), filter: 'All', selectedId: 'event_1044' });
  const samePayload = (value, original) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === Object.keys(original).length && Object.keys(original).every(key => value[key] === original[key]);
  function validState(value) {
    if (!value || value.version !== 1 || !FILTERS.includes(value.filter) || !Array.isArray(value.events) || value.events.length !== ORIGINALS.length) return false;
    if (value.selectedId !== null && !ORIGINALS.some(item => item.id === value.selectedId)) return false;
    return value.events.every((event, index) => {
      const original = ORIGINALS[index];
      if (!event || event.id !== original.id || event.type !== original.type || !samePayload(event.payload, original.payload)) return false;
      const unchanged = event.status === original.status && event.response === original.response && event.duration === original.duration && event.attempt === original.attempt;
      const retried = original.status !== 'Delivered' && event.status === 'Delivered' && event.response === 200 && event.duration === 96 && event.attempt === original.attempt + 1;
      return unchanged || retried;
    });
  }
  function create(storage) {
    let state = initial();
    let available = false;
    let saved = false;
    let recovered = false;
    try {
      if (!storage) throw new Error('Storage unavailable');
      const raw = storage.getItem(STORAGE_KEY);
      storage.setItem(STORAGE_KEY + '.probe', 'available');
      storage.removeItem(STORAGE_KEY + '.probe');
      available = true;
      if (raw !== null) {
        let loaded;
        try { loaded = JSON.parse(raw); } catch { loaded = null; }
        if (validState(loaded)) {
          state = copy(loaded);
          saved = true;
        } else {
          recovered = true;
          storage.removeItem(STORAGE_KEY);
        }
      }
    } catch { available = false; saved = false; }
    function persist() {
      if (!available) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        saved = true;
        return true;
      } catch { available = false; saved = false; return false; }
    }
    const matching = () => state.events.filter(item => state.filter === 'All' || item.status === state.filter);
    function snapshot() {
      const visible = matching();
      const selected = state.events.find(item => item.id === state.selectedId) || null;
      const counts = Object.fromEntries(FILTERS.map(filter => [filter, filter === 'All' ? state.events.length : state.events.filter(item => item.status === filter).length]));
      return copy({ ...state, visible, selected, counts, outsideFilter: Boolean(selected && !visible.some(item => item.id === selected.id)), storage: { available, saved, recovered } });
    }
    function setFilter(filter) {
      if (!FILTERS.includes(filter)) return false;
      state.filter = filter;
      const visible = matching();
      if (!visible.some(item => item.id === state.selectedId)) state.selectedId = visible[0]?.id || null;
      persist();
      return true;
    }
    function select(id) {
      if (!matching().some(item => item.id === id)) return false;
      state.selectedId = id;
      persist();
      return true;
    }
    function retry() {
      const selected = state.events.find(item => item.id === state.selectedId);
      if (!selected || selected.status === 'Delivered') return { ok: false, reason: 'Choose a Failed or Retrying event.' };
      selected.status = 'Delivered';
      selected.response = 200;
      selected.duration = 96;
      selected.attempt += 1;
      persist();
      return { ok: true, id: selected.id, attempt: selected.attempt, outsideFilter: !matching().some(item => item.id === selected.id) };
    }
    function reset() {
      state = initial();
      recovered = false;
      persist();
      return snapshot();
    }
    return { snapshot, setFilter, select, retry, reset };
  }
  return { create, originals: () => copy(ORIGINALS), filters: [...FILTERS], storageKey: STORAGE_KEY };
});
