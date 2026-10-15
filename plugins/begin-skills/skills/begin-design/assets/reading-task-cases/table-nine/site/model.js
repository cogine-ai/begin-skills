(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TableNine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'table-nine.seating.v1';
  const GUESTS = [
    ['G01', 'Aida Moreno', 'Vegetarian'], ['G02', 'Noor Rahman', 'No peanuts'],
    ['G03', 'Celia Park', 'None'], ['G04', 'Lucian Bell', 'Vegan'],
    ['G05', 'Mara Ellery', 'No dairy'], ['G06', 'Émile Laurent', 'None'],
    ['G07', 'Rowan Cole', 'Vegetarian'], ['G08', 'Tess Okafor', 'None']
  ];
  const TABLES = ['north', 'south'];
  const copy = value => JSON.parse(JSON.stringify(value));
  const signature = state => JSON.stringify(state);
  function fixture() {
    return {
      title: 'One evening at Table Nine',
      note: 'Confirm dietary needs directly before service.',
      guests: GUESTS.map(([id, name, dietary], i) => ({ id, name, dietary, table: i < 4 ? 'north' : 'south', seat: String(i % 4 + 1) }))
    };
  }
  function validate(state) {
    const errors = [];
    if (!state || typeof state !== 'object') return [{ code: 'shape', field: 'project-title', message: 'This record could not be read. Restore the fixture to begin again.' }];
    if (typeof state.title !== 'string' || !state.title.trim()) errors.push({ code: 'title', field: 'project-title', message: 'Give this evening a title before preparing the record.' });
    if (typeof state.note !== 'string') errors.push({ code: 'note', field: 'note', message: 'The service note must be text.' });
    if (!Array.isArray(state.guests) || state.guests.length !== 8) return errors.concat({ code: 'guests', field: 'guest-ledger', message: 'The record must contain all eight original guests.' });
    const seats = new Map(), counts = { north: 0, south: 0 };
    state.guests.forEach((guest, i) => {
      const [id, name, dietary] = GUESTS[i];
      if (!guest || guest.id !== id || guest.name !== name || guest.dietary !== dietary) {
        errors.push({ code: 'identity', field: 'guest-ledger', message: `Guest ${id}'s original identity or dietary note is missing or changed.` });
        return;
      }
      if (!TABLES.includes(guest.table)) errors.push({ code: 'table', field: `table-${i + 1}`, message: `Choose North or South for ${name} (${id}).` });
      else counts[guest.table]++;
      if (!['1', '2', '3', '4'].includes(guest.seat)) errors.push({ code: 'seat', field: `seat-${i + 1}`, message: `Choose a seat from 1 to 4 for ${name} (${id}).` });
      if (TABLES.includes(guest.table) && ['1', '2', '3', '4'].includes(guest.seat)) {
        const key = `${guest.table}:${guest.seat}`;
        if (seats.has(key)) {
          const prior = seats.get(key);
          errors.push({ code: 'duplicate', field: `seat-${i + 1}`, message: `${name} (${id}) and ${prior.name} (${prior.id}) both use ${guest.table === 'north' ? 'North' : 'South'} seat ${guest.seat}. Choose an empty seat.` });
        } else seats.set(key, guest);
      }
    });
    TABLES.forEach(table => {
      if (counts[table] > 4) errors.push({ code: 'capacity', field: 'guest-ledger', message: `${table === 'north' ? 'North' : 'South'} has ${counts[table]} guests. Move a guest to the other table; each table holds four.` });
    });
    const pair = state.guests.slice(0, 2);
    if (pair.every(g => g && TABLES.includes(g.table)) && pair[0].table !== pair[1].table) errors.push({ code: 'pair', field: 'table-2', message: 'Aida Moreno (G01) and Noor Rahman (G02) are one booking pair. Put them at the same table.' });
    return errors;
  }
  function totals(state) {
    return Object.fromEntries(TABLES.map(table => [table, (state.guests || []).filter(g => g.table === table).length]));
  }
  function exportText(state) {
    const errors = validate(state);
    if (errors.length) throw new Error(errors.map(e => e.message).join('\n'));
    const count = totals(state);
    const lines = ['TABLE NINE — SEATING RECORD', `Event: ${state.title}`, 'Guests: 8', 'Tables: 2 · 4 seats each', 'Booking pair: G01 Aida Moreno + G02 Noor Rahman (same table)', ''];
    TABLES.forEach(table => {
      lines.push(`${table.toUpperCase()} — ${count[table]} / 4`);
      state.guests.filter(g => g.table === table).sort((a, b) => Number(a.seat) - Number(b.seat)).forEach(g => lines.push(`Seat ${g.seat} | ${g.id} | ${g.name} | Dietary note: ${g.dietary}`));
      lines.push('');
    });
    lines.push('SERVICE NOTE', state.note, '', 'Local illustrative record. Confirm dietary needs directly; this is not a medical guarantee.', '');
    return lines.join('\n');
  }
  function createSession(state = fixture()) { return { current: copy(state), prepared: null }; }
  function edit(session, next) { return { current: copy(next), prepared: session.prepared ? copy(session.prepared) : null }; }
  function stale(session) { return !!session.prepared && session.prepared.signature !== signature(session.current); }
  function prepare(session) {
    const errors = validate(session.current);
    if (errors.length) return { ok: false, session, errors };
    return { ok: true, session: { current: copy(session.current), prepared: { state: copy(session.current), signature: signature(session.current), output: exportText(session.current) } }, errors: [] };
  }
  function ready(session) { return !!session.prepared && !stale(session) && validate(session.current).length === 0; }
  function snapshot(session) {
    if (!ready(session)) throw new Error('Prepare a valid record from the current inputs first.');
    return JSON.stringify({ schema: 1, state: session.prepared.state, output: session.prepared.output });
  }
  function decode(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schema !== 1 || validate(parsed.state).length || typeof parsed.output !== 'string' || parsed.output !== exportText(parsed.state)) throw new Error('The kept copy is incomplete or does not match its record.');
    return prepare(createSession(parsed.state)).session;
  }
  function inspectStorage(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return { status: 'empty' };
      decode(raw);
      return { status: 'available' };
    } catch (error) { return { status: error instanceof SyntaxError || (error && /kept copy/.test(error.message)) ? 'corrupt' : 'unavailable' }; }
  }
  function keep(session, storage) {
    if (!ready(session)) return { ok: false, reason: 'current', message: 'Prepare a valid record from the current inputs before keeping it.' };
    try { storage.setItem(KEY, snapshot(session)); return { ok: true, message: 'This prepared record is kept in this browser. You can recover it after reloading the seating desk.' }; }
    catch (_) { return { ok: false, reason: 'storage', message: 'This browser could not keep the record. Your prepared record is still here; download it instead.' }; }
  }
  function recover(session, storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return { ok: false, session, message: 'There is no kept Table Nine record in this browser.' };
      return { ok: true, session: decode(raw), message: 'Kept inputs and the exact prepared record recovered. Current unsaved inputs were replaced.' };
    } catch (_) { return { ok: false, session, message: 'The kept copy could not be read. Current inputs and earlier output are unchanged. Download a valid prepared record or forget the unreadable copy.' }; }
  }
  function forget(storage) {
    try { storage.removeItem(KEY); return { ok: true, message: 'The kept Table Nine copy was forgotten. Current inputs, prepared output and other websites’ data are unchanged.' }; }
    catch (_) { return { ok: false, message: 'This browser could not forget the kept copy. Current work is unchanged.' }; }
  }
  return { KEY, GUESTS: copy(GUESTS), TABLES: TABLES.slice(), fixture, validate, totals, exportText, createSession, edit, stale, prepare, ready, snapshot, decode, inspectStorage, keep, recover, forget };
}));
