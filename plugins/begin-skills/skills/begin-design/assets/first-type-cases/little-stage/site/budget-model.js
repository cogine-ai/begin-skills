(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.LittleStageBudget = model;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const shows = Object.freeze({
    moon: Object.freeze({ id: 'moon', title: 'The Borrowed Moon', date: 'Friday 23 October', time: '19:30', minutes: 80 }),
    revolution: Object.freeze({ id: 'revolution', title: 'A Very Small Revolution', date: 'Saturday 24 October', time: '16:00', minutes: 95 }),
    letters: Object.freeze({ id: 'letters', title: 'Letters from the Back Row', date: 'Sunday 25 October', time: '15:00', minutes: 70 })
  });
  const rates = Object.freeze({ adults: 18, students: 12 });
  const clone = value => JSON.parse(JSON.stringify(value));
  const inputKeys = ['show', 'adults', 'students', 'note'];

  function create() {
    return { input: { show: 'moon', adults: '1', students: '0', note: '' }, prepared: null, dirty: false, errors: {} };
  }

  function validate(input) {
    const errors = {};
    const values = { show: input.show, note: String(input.note ?? '') };
    if (!Object.hasOwn(shows, input.show)) errors.show = 'Choose one performance from this programme.';
    for (const name of ['adults', 'students']) {
      const raw = String(input[name] ?? '').trim();
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) > 8) {
        errors[name] = 'Enter a whole number from 0 to 8.';
      } else values[name] = Number(raw);
    }
    if (!errors.adults && !errors.students) {
      const partySize = values.adults + values.students;
      if (partySize < 1 || partySize > 8) errors.party = 'Your party needs 1 to 8 tickets in total.';
      else values.partySize = partySize;
    }
    if (values.note.length > 300) errors.note = 'Keep your note to 300 characters or fewer.';
    return { errors, values };
  }

  function edit(state, patch) {
    const next = clone(state);
    let changed = false;
    for (const name of inputKeys) {
      if (Object.hasOwn(patch, name)) {
        const value = String(patch[name]);
        changed ||= value !== next.input[name];
        next.input[name] = value;
      }
    }
    if (changed && next.prepared) next.dirty = true;
    next.errors = {};
    return next;
  }

  function prepare(state) {
    const next = clone(state);
    const { errors, values } = validate(next.input);
    next.errors = errors;
    if (Object.keys(errors).length) {
      if (next.prepared) next.dirty = true;
      return next;
    }
    next.prepared = {
      schema: 1, show: clone(shows[values.show]), adults: values.adults,
      students: values.students, partySize: values.partySize,
      adultLine: values.adults * rates.adults, studentLine: values.students * rates.students,
      total: values.adults * rates.adults + values.students * rates.students,
      currency: 'USD', note: values.note
    };
    next.dirty = false;
    return next;
  }

  function isCurrent(state) {
    return Boolean(state.prepared && !state.dirty && Object.keys(state.errors).length === 0);
  }

  function snapshot(state) {
    if (!isCurrent(state)) throw new Error('Prepare the current inputs before keeping or downloading.');
    return clone(state.prepared);
  }

  function recover(value) {
    if (!value || value.schema !== 1 || !value.show || !Object.hasOwn(shows, value.show.id)
      || !Number.isInteger(value.adults) || !Number.isInteger(value.students)
      || typeof value.note !== 'string') return null;
    const candidate = edit(create(), { show: value.show.id, adults: value.adults, students: value.students, note: value.note });
    const restored = prepare(candidate);
    return isCurrent(restored) ? restored : null;
  }

  function decode(raw) {
    try { return recover(JSON.parse(raw)); } catch { return null; }
  }

  function text(state) {
    const sheet = snapshot(state);
    return [
      'LITTLE STAGE', 'Prepared ticket budget', 'Status: Current', '',
      `Performance: ${sheet.show.title}`, `Date: ${sheet.show.date}`,
      `Time: ${sheet.show.time}`, `Running time: ${sheet.show.minutes} minutes`, '',
      `Adults: ${sheet.adults} x USD18 = USD${sheet.adultLine}`,
      `Students: ${sheet.students} x USD12 = USD${sheet.studentLine}`,
      `Party size: ${sheet.partySize} ${sheet.partySize === 1 ? 'ticket' : 'tickets'}`,
      `Total: USD${sheet.total}`, '',
      'Visitor note:', sheet.note || '(No note)', '',
      'Fictional October programme. Illustrative ticket arithmetic.',
      'This worksheet does not reserve tickets, take payment or show availability.', ''
    ].join('\n');
  }

  return Object.freeze({ shows, rates, create, validate, edit, prepare, isCurrent, snapshot, recover, decode, text });
});
