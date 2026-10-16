export const STORAGE_KEY = 'canopy.inspection-desk.v1';
export const STATUSES = Object.freeze(['Due', 'Watch', 'Complete']);
export const MAX_NOTE = 4000;
export const MAX_BACKUP_BYTES = 512 * 1024;
export const BASE_RECORDS = Object.freeze([
  { id: 'T-1042', species: 'London plane', location: '18 Pearson Road', place: 'Pearson Road', status: 'Due', inspected: '18 Sep 2026', note: 'Check the replaced guard' },
  { id: 'T-1043', species: 'Silver birch', location: '22 Pearson Road', place: 'Pearson Road', status: 'Watch', inspected: '23 Sep 2026', note: 'New stake needs adjustment' },
  { id: 'T-1044', species: 'Field maple', location: 'Crane Court north', place: 'Crane Court', status: 'Complete', inspected: '12 Oct 2026', note: 'Watering bag removed' },
  { id: 'T-1045', species: 'Small-leaved lime', location: 'East Jetty entrance', place: 'East Jetty', status: 'Due', inspected: '02 Sep 2026', note: 'Seasonal inspection' },
  { id: 'T-1046', species: 'Rowan', location: '7 Lock Lane', place: 'Lock Lane', status: 'Watch', inspected: '01 Oct 2026', note: 'Recheck support ties' },
  { id: 'T-1047', species: 'Hornbeam', location: 'Pump House square', place: 'Pump House', status: 'Complete', inspected: '10 Oct 2026', note: 'Guard refitted' },
  { id: 'T-1048', species: 'Wild cherry', location: '11 Lock Lane', place: 'Lock Lane', status: 'Due', inspected: '15 Sep 2026', note: 'Inspect after planting work' },
  { id: 'T-1049', species: 'Ginkgo', location: 'North Basin walk', place: 'North Basin', status: 'Watch', inspected: '28 Sep 2026', note: 'Review mulch clearance' },
  { id: 'T-1050', species: 'Common alder', location: 'Warehouse 2 courtyard', place: 'Warehouse 2', status: 'Complete', inspected: '13 Oct 2026', note: 'Follow-up recorded' },
].map(Object.freeze));
const ids = BASE_RECORDS.map(r => r.id);
export const isId = id => ids.includes(id);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const exactKeys = (v, keys) => Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
const validNote = value => typeof value === 'string' && value.length <= MAX_NOTE;
const validTime = v => v === null || typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const validDraft = value => object(value) && exactKeys(value, ['status', 'note']) && STATUSES.includes(value.status) && validNote(value.note);
export function initialState() {
  return { version: 1, selectedId: 'T-1042', query: '', filter: 'All', edits: Object.fromEntries(BASE_RECORDS.map(r => [r.id, { status: r.status, note: r.note, editedAt: null }])), drafts: {} };
}
export function validateState(value) {
  if (!object(value) || !exactKeys(value, ['version', 'selectedId', 'query', 'filter', 'edits', 'drafts']) || value.version !== 1 || !isId(value.selectedId) || typeof value.query !== 'string' || value.query.length > 120 || !['All', ...STATUSES].includes(value.filter) || !object(value.edits) || !exactKeys(value.edits, ids) || !object(value.drafts)) throw new Error('This is not a valid CANOPY backup.');
  for (const id of ids) {
    const edit = value.edits[id];
    if (!object(edit) || !exactKeys(edit, ['status', 'note', 'editedAt']) || !STATUSES.includes(edit.status) || !validNote(edit.note) || !validTime(edit.editedAt)) throw new Error('A saved record has invalid note, status or time.');
  }
  for (const [id, draft] of Object.entries(value.drafts)) if (!isId(id) || !validDraft(draft)) throw new Error('A saved draft is invalid.');
  return structuredClone(value);
}
export function parseState(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_BACKUP_BYTES || new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error('Saved workspace data is invalid or too large.');
  return validateState(JSON.parse(raw));
}
export function recordsFor(state) { return BASE_RECORDS.map(r => ({ ...r, ...state.edits[r.id] })); }
export function recordFor(state, id = state.selectedId) { return recordsFor(state).find(r => r.id === id); }
export function queryRecords(state) {
  const q = state.query.trim().toLowerCase();
  return recordsFor(state).filter(r => !q || `${r.id} ${r.species} ${r.location}`.toLowerCase().includes(q));
}
export function filteredRecords(state) { return queryRecords(state).filter(r => state.filter === 'All' || r.status === state.filter); }
export function countsFor(records) { return Object.fromEntries(['All', ...STATUSES].map(status => [status, status === 'All' ? records.length : records.filter(r => r.status === status).length])); }
export function setDraft(state, id, draft) {
  if (!isId(id) || !validDraft(draft)) throw new Error('Use a supported status and a note of at most 4,000 characters.');
  return { ...state, drafts: { ...state.drafts, [id]: { ...draft } } };
}
export function cancelDraft(state, id) { const drafts = { ...state.drafts }; delete drafts[id]; return { ...state, drafts }; }
export function saveDraft(state, id, now = new Date().toISOString()) {
  if (!isId(id) || !validTime(now) || now === null) throw new Error('Invalid record or local edit time.');
  const draft = state.drafts[id];
  if (!validDraft(draft)) throw new Error('There are no valid changes to save.');
  const next = cancelDraft(state, id);
  return { ...next, edits: { ...next.edits, [id]: { ...draft, editedAt: now } } };
}
export function companions(state, id = state.selectedId) {
  const current = recordFor(state, id);
  return recordsFor(state).filter(r => r.id !== id && r.place === current.place);
}
