/* Pressline's saved collection, filters, inspection and mark selection. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Pressline = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'pressline.production-desk.v1';
  const CLOCK = '2026-10-11';
  const DUE_THROUGH = '2026-10-15';
  const STATUSES = ['Blocked', 'In production', 'Scheduled', 'Ready for delivery'];
  const OWNERS = ['Maya', 'Theo', 'Inez'];
  const rows = [
    ['P-1041', 'Pine & Co', 'Annual reports', 'Maya', '2026-10-13', 'Scheduled', 6],
    ['P-1042', 'Rowan Cafe', 'Winter menus', 'Theo', '2026-10-12', 'In production', 2.5],
    ['P-1043', 'Vale Market', 'Kraft bags', 'Maya', '2026-10-16', 'Blocked', 4],
    ['P-1044', 'Eastline Studio', 'Event posters', 'Inez', '2026-10-15', 'Scheduled', 3.5],
    ['P-1045', 'Lyra Books', 'Bookmarks', 'Theo', '2026-10-20', 'Scheduled', 1.5],
    ['P-1046', 'Ember Events', 'Name badges', 'Inez', '2026-10-11', 'Ready for delivery', 0],
    ['P-1047', 'Cedar Cycling', 'Route flyers', 'Maya', '2026-10-12', 'In production', 5],
    ['P-1048', 'Nook & Nest', 'Product cards', 'Theo', '2026-10-17', 'In production', 3],
    ['P-1049', 'Oriel Theatre', 'Show programs', 'Inez', '2026-10-14', 'Blocked', 7],
    ['P-1050', 'Echo Foods', 'Sample cartons', 'Maya', '2026-10-18', 'Scheduled', 4.5],
    ['P-1051', 'Finch Museum', 'Visitor guides', 'Inez', '2026-10-15', 'In production', 2],
    ['P-1052', 'Solstice Lab', 'Bottle labels', 'Theo', '2026-10-21', 'Ready for delivery', 0]
  ];
  const copy = value => JSON.parse(JSON.stringify(value));
  const seed = () => rows.map(([id, client, title, owner, due, status, hours]) => ({id, client, title, owner, due, status, hours}));
  const blankFilters = () => ({search: '', status: 'All', owner: 'All'});
  const initial = () => ({version: 1, jobs: seed(), filters: blankFilters(), inspectedId: 'P-1049'});
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0,4) === '0000') return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
  }
  function validate(fields) {
    const errors = {};
    if (!STATUSES.includes(fields.status)) errors.status = 'Choose a production status.';
    if (!validDate(fields.due)) errors.due = 'Enter a valid due date.';
    if (fields.hours === '' || fields.hours === null || fields.hours === undefined || !Number.isFinite(Number(fields.hours)) || Number(fields.hours) < 0) errors.hours = 'Enter zero or more estimated hours.';
    return errors;
  }
  function matches(job, filters) {
    const query = filters.search.trim().toLowerCase();
    return (filters.status === 'All' || job.status === filters.status) &&
      (filters.owner === 'All' || job.owner === filters.owner) &&
      (!query || [job.id, job.title, job.client].some(value => value.toLowerCase().includes(query)));
  }
  function summary(jobs) {
    const active = jobs.filter(job => job.status !== 'Ready for delivery');
    return {total: jobs.length, active: active.length, due: active.filter(job => job.due >= CLOCK && job.due <= DUE_THROUGH).length, blocked: jobs.filter(job => job.status === 'Blocked').length, hours: Number(jobs.reduce((sum, job) => sum + job.hours, 0).toFixed(6))};
  }
  function validSaved(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.jobs) || value.jobs.length !== rows.length) return false;
    const f = value.filters;
    if (!f || typeof f.search !== 'string' || !['All', ...STATUSES].includes(f.status) || !['All', ...OWNERS].includes(f.owner)) return false;
    if (!rows.some(row => row[0] === value.inspectedId)) return false;
    return value.jobs.every((job, i) => {
      const [id, client, title, owner] = rows[i];
      return job && job.id === id && job.client === client && job.title === title && job.owner === owner && typeof job.hours === 'number' && !Object.keys(validate(job)).length;
    });
  }
  function create(storage) {
    let state = initial();
    let selectedIds = new Set();
    let available = false;
    let saved = false;
    let recovered = false;
    try {
      if (!storage) throw new Error('Unavailable');
      const raw = storage.getItem(KEY);
      storage.setItem(KEY + '.probe', '1');
      storage.removeItem(KEY + '.probe');
      available = true;
      if (raw !== null) {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = null; }
        if (validSaved(parsed)) { state = copy(parsed); saved = true; }
        else { storage.removeItem(KEY); recovered = true; }
      }
    } catch { available = false; }
    const visible = () => state.jobs.filter(job => matches(job, state.filters));
    function persist() {
      if (!available) return false;
      try { storage.setItem(KEY, JSON.stringify(state)); saved = true; return true; }
      catch { available = false; saved = false; return false; }
    }
    function snapshot() {
      const shown = visible();
      const inspected = state.jobs.find(job => job.id === state.inspectedId);
      const groups = STATUSES.map(status => ({status, jobs: shown.filter(job => job.status === status)})).filter(group => group.jobs.length);
      return copy({...state, visible: shown, inspected, selectedIds: [...selectedIds], groups, summary: summary(state.jobs), outsideFilter: !shown.some(job => job.id === state.inspectedId), storage: {available, saved, recovered}});
    }
    function setFilters(patch) {
      const filters = {...state.filters, ...patch};
      if (typeof filters.search !== 'string' || !['All', ...STATUSES].includes(filters.status) || !['All', ...OWNERS].includes(filters.owner)) return false;
      state.filters = filters;
      selectedIds.clear();
      persist();
      return true;
    }
    function inspect(id) {
      if (!state.jobs.some(job => job.id === id)) return false;
      state.inspectedId = id;
      persist();
      return true;
    }
    function mark(id, checked) {
      if (!visible().some(job => job.id === id)) return false;
      if (checked) selectedIds.add(id); else selectedIds.delete(id);
      return true;
    }
    function markVisible(checked) {
      selectedIds = new Set(checked ? visible().map(job => job.id) : []);
    }
    function clearMarks() { selectedIds.clear(); }
    function save(id, fields) {
      const errors = validate(fields);
      const job = state.jobs.find(item => item.id === id);
      if (!job) return {ok: false, errors: {record: 'This job could not be found.'}};
      if (Object.keys(errors).length) return {ok: false, errors};
      job.status = fields.status;
      job.due = fields.due;
      job.hours = Number(fields.hours);
      selectedIds = new Set([...selectedIds].filter(value => visible().some(item => item.id === value)));
      const persisted = persist();
      return {ok: true, persisted, outsideFilter: !matches(job, state.filters)};
    }
    function reset() { state = initial(); selectedIds.clear(); recovered = false; persist(); return snapshot(); }
    return {snapshot, setFilters, inspect, mark, markVisible, clearMarks, save, reset};
  }
  return {create, seed, summary, matches, validate, validDate, statuses: [...STATUSES], owners: [...OWNERS], storageKey: KEY, clock: CLOCK, dueThrough: DUE_THROUGH};
});
