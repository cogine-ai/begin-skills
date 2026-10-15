(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SignalDesk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'signal-desk.weekly-plan.v1';
  const EDITORS = ['Avery', 'Jules', 'Noor'];
  const DAYS = [
    {short: 'Mon', name: 'Monday', date: '12 Oct', full: 'Monday 12 October'},
    {short: 'Tue', name: 'Tuesday', date: '13 Oct', full: 'Tuesday 13 October'},
    {short: 'Wed', name: 'Wednesday', date: '14 Oct', full: 'Wednesday 14 October'},
    {short: 'Thu', name: 'Thursday', date: '15 Oct', full: 'Thursday 15 October'},
    {short: 'Fri', name: 'Friday', date: '16 Oct', full: 'Friday 16 October'}
  ];
  const SLOTS = {am: 'Morning', pm: 'Afternoon'};
  const CAPACITY = 240;
  const FIXTURES = [
    {id: 'SD-01', title: 'The last night shift at North Quay', strand: 'Work & place', editor: 'Avery', day: 0, slot: 'am', minutes: 150},
    {id: 'SD-02', title: 'Where the river used to turn', strand: 'Changing landscapes', editor: 'Jules', day: 0, slot: 'am', minutes: 120},
    {id: 'SD-03', title: 'A room full of borrowed voices', strand: 'People & memory', editor: 'Avery', day: 1, slot: 'pm', minutes: 180},
    {id: 'SD-04', title: 'The woman who keeps the weather', strand: 'Quiet expertise', editor: 'Noor', day: 2, slot: 'am', minutes: 135},
    {id: 'SD-05', title: 'After the ferry stopped coming', strand: 'Changing landscapes', editor: 'Jules', day: 3, slot: 'pm', minutes: 90},
    {id: 'SD-06', title: 'Instructions for a city that never sleeps', strand: 'Work & place', editor: 'Noor', day: 4, slot: 'am', minutes: 165}
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  const seed = () => clone(FIXTURES);
  const signature = queue => JSON.stringify(queue.map(({id, editor, day, slot, minutes}) => [id, editor, day, slot, minutes]));
  const initial = () => ({queue: seed(), revision: 0, prepared: null});
  function validate(fields) {
    const errors = {};
    if (!EDITORS.includes(fields.editor)) errors.editor = 'Choose Avery, Jules or Noor.';
    if (fields.day === '' || !Number.isInteger(Number(fields.day)) || Number(fields.day) < 0 || Number(fields.day) > 4) errors.day = 'Choose a day from this fixed week.';
    if (!Object.hasOwn(SLOTS, fields.slot)) errors.slot = 'Choose Morning or Afternoon.';
    const n = Number(fields.minutes);
    if (fields.minutes === '' || fields.minutes === null || !Number.isFinite(n) || n < 15 || n > 240 || !Number.isInteger(n) || n % 15 !== 0) errors.minutes = 'Use 15–240 minutes, in steps of 15.';
    return errors;
  }
  function analyze(queue) {
    const loads = DAYS.map((day, i) => ({day: i, editors: EDITORS.map(editor => ({editor, minutes: queue.filter(r => r.day === i && r.editor === editor).reduce((s, r) => s + r.minutes, 0)}))}));
    const issues = [];
    for (let day = 0; day < DAYS.length; day++) {
      for (const editor of EDITORS) {
        for (const slot of Object.keys(SLOTS)) {
          const records = queue.filter(r => r.day === day && r.editor === editor && r.slot === slot);
          if (records.length > 1) issues.push({kind: 'clash', ids: records.map(r => r.id), text: `${records.map(r => r.id).join(' + ')} share ${editor}'s ${DAYS[day].name} ${SLOTS[slot].toLowerCase()} slot.`});
        }
        const amount = loads[day].editors.find(r => r.editor === editor).minutes;
        if (amount > CAPACITY) issues.push({kind: 'capacity', ids: queue.filter(r => r.day === day && r.editor === editor).map(r => r.id), text: `${editor} has ${amount} minutes on ${DAYS[day].name}: ${amount - CAPACITY} over the ${CAPACITY}-minute daily limit.`});
      }
    }
    return {total: queue.reduce((s, r) => s + r.minutes, 0), count: queue.length, loads, issues};
  }
  const ordered = queue => [...queue].sort((a, b) => a.day - b.day || (a.slot === b.slot ? 0 : a.slot === 'am' ? -1 : 1) || EDITORS.indexOf(a.editor) - EDITORS.indexOf(b.editor) || a.id.localeCompare(b.id));
  function planText(queue, revision) {
    const a = analyze(queue);
    const lines = ['SIGNAL DESK / WEEKLY EDIT PLAN', '12–16 October 2026', `Prepared revision ${String(revision).padStart(2, '0')}`, `${a.count} episodes / ${a.total} estimated edit minutes`, 'Capacity: 240 minutes per editor per day', 'One episode per editor in each morning/afternoon slot', ''];
    for (let day = 0; day < DAYS.length; day++) {
      lines.push(DAYS[day].full.toUpperCase());
      const records = ordered(queue).filter(r => r.day === day);
      if (!records.length) lines.push('No episodes assigned');
      for (const r of records) {
        lines.push(`${SLOTS[r.slot]} | ${r.editor} | ${r.minutes} min | ${r.id}`, r.title);
      }
      lines.push('');
    }
    lines.push('Checks: no slot clashes; all editors within daily capacity.', 'Fictional local plan. No team messages or production booking.');
    return lines.join('\n');
  }
  function validStored(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.queue) || value.queue.length !== FIXTURES.length || !Number.isInteger(value.revision) || value.revision < 0) return false;
    if (!value.queue.every((r, i) => r && r.id === FIXTURES[i].id && r.title === FIXTURES[i].title && r.strand === FIXTURES[i].strand && typeof r.day === 'number' && typeof r.minutes === 'number' && !Object.keys(validate(r)).length)) return false;
    const p = value.prepared;
    return !!p && p.revision === value.revision && p.basis === signature(value.queue) && p.text === planText(value.queue, value.revision) && analyze(value.queue).issues.length === 0;
  }
  function move(day, slot, delta) {
    const index = Number(day) * 2 + (slot === 'pm' ? 1 : 0) + delta;
    return index >= 0 && index < 10 ? {day: Math.floor(index / 2), slot: index % 2 ? 'pm' : 'am'} : null;
  }
  function create(storage) {
    let state = initial();
    let available = false, kept = false, invalid = false;
    function read() {
      try {
        const raw = storage.getItem(KEY);
        kept = raw !== null;
        let record = null;
        if (kept) { try { record = JSON.parse(raw); } catch {} }
        invalid = kept && !validStored(record);
        return kept && !invalid ? record : null;
      } catch { available = false; return null; }
    }
    try {
      if (!storage) throw new Error('No storage');
      storage.setItem(KEY + '.probe', '1');
      storage.removeItem(KEY + '.probe');
      available = true;
      const record = read();
      if (record) state = {queue: clone(record.queue), revision: record.revision, prepared: clone(record.prepared)};
    } catch { available = false; }
    function snapshot() {
      const current = !!state.prepared && state.prepared.revision === state.revision && state.prepared.basis === signature(state.queue);
      return clone({...state, ...analyze(state.queue), current, storage: {available, kept, invalid}});
    }
    function apply(id, fields) {
      const errors = validate(fields);
      if (Object.keys(errors).length) return {ok: false, errors};
      const record = state.queue.find(r => r.id === id);
      if (!record) return {ok: false, errors: {record: 'Choose an episode in this queue.'}};
      const patch = {editor: fields.editor, day: Number(fields.day), slot: fields.slot, minutes: Number(fields.minutes)};
      const changed = Object.keys(patch).some(key => patch[key] !== record[key]);
      if (changed) { Object.assign(record, patch); state.revision++; }
      return {ok: true, changed};
    }
    function prepare() {
      if (analyze(state.queue).issues.length) return false;
      state.prepared = {revision: state.revision, basis: signature(state.queue), text: planText(state.queue, state.revision)};
      return true;
    }
    function keep() {
      if (!available || !snapshot().current) return false;
      try { storage.setItem(KEY, JSON.stringify({version: 1, ...state})); kept = true; invalid = false; return true; }
      catch { available = false; return false; }
    }
    function reload() {
      if (!available) return false;
      const record = read();
      if (!record) return false;
      state = {queue: clone(record.queue), revision: record.revision, prepared: clone(record.prepared)};
      return true;
    }
    function forget() {
      if (!available) return false;
      try { storage.removeItem(KEY); kept = false; invalid = false; return true; }
      catch { available = false; return false; }
    }
    function restore() { state = initial(); }
    return {snapshot, apply, prepare, keep, reload, forget, restore};
  }
  return {create, seed, signature, validate, analyze, ordered, planText, validStored, move, editors: [...EDITORS], days: clone(DAYS), slots: {...SLOTS}, capacity: CAPACITY, storageKey: KEY};
});
