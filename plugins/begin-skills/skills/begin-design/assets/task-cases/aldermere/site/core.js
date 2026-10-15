/* Aldermere's original stay model. It calculates an estimate, never availability. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AldermereStay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RATE = 180;
  const STORAGE_KEY = 'aldermere.prepared-enquiry.v1';
  const DAY = 86400000;
  const clone = value => JSON.parse(JSON.stringify(value));
  function initial() {
    return { input: { arrival: '', departure: '', guests: '2', note: '' }, revision: 0, prepared: null };
  }
  function utcDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1000 || year > 9999) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() : null;
  }
  function errorsFor(input) {
    const errors = {};
    const arrival = utcDate(input.arrival), departure = utcDate(input.departure);
    if (arrival === null) errors.arrival = 'Choose a valid arrival date.';
    if (departure === null) errors.departure = 'Choose a valid departure date.';
    else if (arrival !== null && departure <= arrival) errors.departure = 'Choose a departure date after arrival.';
    if (!['1', '2'].includes(input.guests)) errors.guests = 'Choose one or two guests.';
    if (typeof input.note !== 'string' || input.note.length > 280) errors.note = 'Keep the note to 280 characters or fewer.';
    return errors;
  }
  function estimate(input) {
    const arrival = utcDate(input.arrival), departure = utcDate(input.departure);
    if (arrival === null || departure === null || departure <= arrival) return null;
    const nights = (departure - arrival) / DAY;
    return { nights, rate: RATE, total: nights * RATE };
  }
  function change(state, field, value) {
    if (!['arrival', 'departure', 'guests', 'note'].includes(field) || typeof value !== 'string') throw new Error('Invalid enquiry field.');
    const next = clone(state);
    if (next.input[field] !== value) {
      next.input[field] = value;
      next.revision += 1;
    }
    return next;
  }
  function prepare(state) {
    const errors = errorsFor(state.input);
    const next = clone(state);
    if (!Object.keys(errors).length) next.prepared = { input: clone(next.input), revision: next.revision };
    return { state: next, errors };
  }
  const isCurrent = state => Boolean(state.prepared && state.prepared.revision === state.revision);
  function serialize(state) {
    if (!isCurrent(state) || Object.keys(errorsFor(state.prepared.input)).length) throw new Error('Prepare the current enquiry before saving.');
    return JSON.stringify({ schema: 1, input: clone(state.prepared.input) });
  }
  function restore(raw) {
    const saved = JSON.parse(raw);
    if (!saved || saved.schema !== 1 || !saved.input || ['arrival', 'departure', 'guests', 'note'].some(key => typeof saved.input[key] !== 'string')) {
      throw new Error('The saved enquiry is not valid.');
    }
    const input = { arrival: saved.input.arrival, departure: saved.input.departure, guests: saved.input.guests, note: saved.input.note };
    if (Object.keys(errorsFor(input)).length) throw new Error('The saved enquiry is not valid.');
    return { input, revision: 0, prepared: { input: clone(input), revision: 0 } };
  }
  function dateLabel(value) {
    const timestamp = utcDate(value);
    return timestamp === null ? 'Choose a date' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(timestamp);
  }
  const guestLabel = value => value === '1' ? '1 guest' : value === '2' ? '2 guests' : 'Choose one or two guests';
  const money = value => 'USD ' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  function summaryText(state) {
    if (!isCurrent(state)) throw new Error('Prepare the current enquiry before downloading.');
    const input = state.prepared.input, cost = estimate(input);
    return [
      'ALDERMERE HOUSE — PREPARED STAY ENQUIRY',
      'Fictional lakeside inn', '',
      'Room: Double room — one double bed',
      'Arrival: ' + dateLabel(input.arrival),
      'Departure: ' + dateLabel(input.departure),
      'Guests: ' + guestLabel(input.guests),
      'Estimate: ' + cost.nights + (cost.nights === 1 ? ' night' : ' nights') + ' × USD 180 = ' + money(cost.total),
      'Breakfast: Included, 08:00–10:00',
      'Access: First floor via stairs; no lift',
      'Note: ' + (input.note.trim() ? input.note : 'No note added'), '',
      'Indicative estimate, not a confirmed rate or reservation.',
      'Availability has not been checked. No message has been sent.',
      'No booking or payment has been made.', ''
    ].join('\n');
  }
  return { RATE, STORAGE_KEY, initial, utcDate, errorsFor, estimate, change, prepare, isCurrent, serialize, restore, dateLabel, guestLabel, money, summaryText };
});
