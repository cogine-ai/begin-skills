(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LatchModel = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const PARTS = Object.freeze([
    { id: 'LP01', name: 'Round-bar pull with concealed fixing', centres: 64, min: 16, max: 24, width: 88, projection: 28 },
    { id: 'LP02', name: 'Offset pull with reversible mounting plate', centres: 96, min: 18, max: 28, width: 124, projection: 32 },
    { id: 'LP03', name: 'Long rail with two flush fixing points', centres: 128, min: 18, max: 32, width: 180, projection: 30 },
    { id: 'LP04', name: 'Recessed edge pull for a narrow cabinet front', centres: 32, min: 16, max: 22, width: 52, projection: 18 },
    { id: 'LP05', name: 'Élan loop with a brushed steel backplate', centres: 96, min: 18, max: 24, width: 116, projection: 34 },
    { id: 'LP06', name: 'Wide bow with independent end mounts', centres: 128, min: 24, max: 40, width: 164, projection: 38 }
  ].map(Object.freeze));
  const STORAGE_KEY = 'latch-parts:comparison:v1';
  const whole = (raw) => /^\d+$/.test(String(raw).trim()) && Number.isSafeInteger(Number(raw)) && Number(raw) > 0;
  function validate(centres, thickness) {
    const errors = {};
    if (!whole(centres)) errors.centres = 'Enter a positive whole number of millimetres.';
    if (!whole(thickness) || Number(thickness) > 60) errors.thickness = 'Enter a whole number from 1 to 60 mm.';
    return { valid: !Object.keys(errors).length, errors, dimensions: { centres: Number(centres), thickness: Number(thickness) } };
  }
  function matching(dimensions) {
    return PARTS.filter(p => p.centres === dimensions.centres && dimensions.thickness >= p.min && dimensions.thickness <= p.max);
  }
  function format(dimensions, ids) {
    const parts = ids.map(id => PARTS.find(p => p.id === id));
    if (parts.some(p => !p) || parts.length < 1 || parts.length > 2 || new Set(ids).size !== ids.length || parts.some(p => !matching(dimensions).includes(p))) throw new Error('Invalid comparison.');
    return [
      'LATCH PARTS — FIT COMPARISON',
      'Requested mounting centres: ' + dimensions.centres + ' mm',
      'Requested panel thickness: ' + dimensions.thickness + ' mm',
      '',
      ...parts.flatMap((p, index) => [
        p.id + ' — ' + p.name,
        'Mounting centres: ' + p.centres + ' mm',
        'Panel thickness range: ' + p.min + '–' + p.max + ' mm (inclusive)',
        'Overall width: ' + p.width + ' mm',
        'Projection: ' + p.projection + ' mm',
        ...(index < parts.length - 1 ? [''] : [])
      ]),
      '',
      'Fictional demo records. Local fit check only; no order or payment.',
      ''
    ].join('\n');
  }
  function createState() { return { valid: false, errors: {}, dimensions: null, matches: [], selected: [], prepared: null }; }
  function update(state, centres, thickness) {
    const checked = validate(centres, thickness);
    state.valid = checked.valid; state.errors = checked.errors;
    if (!checked.valid) return { changed: false, invalid: true };
    const changed = !state.dimensions || state.dimensions.centres !== checked.dimensions.centres || state.dimensions.thickness !== checked.dimensions.thickness;
    state.dimensions = checked.dimensions; state.matches = matching(checked.dimensions);
    if (changed) { state.selected = []; state.prepared = null; }
    return { changed, invalid: false };
  }
  function select(state, id) {
    if (!state.valid || !state.matches.some(p => p.id === id)) return { ok: false, message: 'Correct the dimensions before selecting a component.' };
    if (state.selected.includes(id)) state.selected = state.selected.filter(value => value !== id);
    else if (state.selected.length >= 2) return { ok: false, message: 'Compare up to two components. Remove one before adding another.' };
    else state.selected.push(id);
    state.prepared = null;
    return { ok: true };
  }
  function prepare(state) {
    if (!state.valid || !state.selected.length) return null;
    const ids = PARTS.filter(p => state.selected.includes(p.id)).map(p => p.id);
    state.prepared = { version: 1, dimensions: { ...state.dimensions }, ids, text: format(state.dimensions, ids) };
    return state.prepared;
  }
  function eligible(state) {
    return !!(state.valid && state.prepared && state.dimensions.centres === state.prepared.dimensions.centres && state.dimensions.thickness === state.prepared.dimensions.thickness);
  }
  function decode(raw) {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !value.dimensions || !Array.isArray(value.ids)) throw new Error('Unrecognized kept comparison.');
    const checked = validate(String(value.dimensions.centres), String(value.dimensions.thickness));
    if (!checked.valid) throw new Error('Invalid kept dimensions.');
    const text = format(checked.dimensions, value.ids);
    if (text !== value.text) throw new Error('Kept text does not match catalogue facts.');
    return { version: 1, dimensions: checked.dimensions, ids: [...value.ids], text };
  }
  function keep(state, storage) {
    if (!eligible(state)) return { ok: false, message: 'Prepare a comparison for valid current dimensions first.' };
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state.prepared)); return { ok: true, record: decode(JSON.stringify(state.prepared)) }; }
    catch (error) { return { ok: false, message: 'This browser could not keep the comparison. Your prepared text is still here; export it instead.' }; }
  }
  function recover(storage) {
    try { const raw = storage.getItem(STORAGE_KEY); return raw === null ? { ok: true, record: null } : { ok: true, record: decode(raw) }; }
    catch (error) { return { ok: false, message: 'The kept comparison could not be read. It may be blocked or damaged. You can try again or forget it.' }; }
  }
  function forget(storage) {
    try { storage.removeItem(STORAGE_KEY); return { ok: true }; }
    catch (error) { return { ok: false, message: 'This browser could not forget the comparison. Check its storage settings and try again.' }; }
  }
  return { PARTS, STORAGE_KEY, validate, matching, format, createState, update, select, prepare, eligible, decode, keep, recover, forget };
});
