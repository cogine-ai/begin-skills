(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RidgewayPlan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'ridgeway.walk-plan.v1';
  const WALKS = Object.freeze([
    { id: 'pinefold', name: 'Pinefold Loop', distanceKm: 4, durationMinutes: 90, description: 'A forest loop with a little time beside the water.', sequence: 'Pine grove → Stillwater clearing → Pine grove' },
    { id: 'high-meadow', name: 'High Meadow Way', distanceKm: 7.5, durationMinutes: 150, description: 'Open ground, an imagined meadow, and a long pause to look around.', sequence: 'Fern gate → High meadow → Fern gate' },
    { id: 'granite', name: 'Granite Passage', distanceKm: 11, durationMinutes: 210, description: 'A longer day between the trees and an imagined ridge.', sequence: 'Forest edge → Granite ridge → Forest edge' }
  ]);
  const PACES = Object.freeze({ steady: { name: 'Steady', addedMinutes: 0 }, lingering: { name: 'Lingering', addedMinutes: 20 } });
  const DEFAULT_INPUT = Object.freeze({ walkId: 'pinefold', walkers: 2, pace: 'steady', intendedDate: '' });
  function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60), rest = minutes % 60;
    return (hours ? hours + ' hr' + (hours === 1 ? '' : 's') : '') + (hours && rest ? ' ' : '') + (rest ? rest + ' min' : '');
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  function formatDate(value) {
    if (!value) return 'Not set';
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  }
  function validate(input) {
    const errors = {};
    if (!input || typeof input !== 'object') return { form: 'Choose a walk and enter your group details.' };
    if (!WALKS.some(walk => walk.id === input.walkId)) errors.walkId = 'Choose one of the three sample walks.';
    const quantity = String(input.walkers == null ? '' : input.walkers).trim();
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 8) errors.walkers = 'Enter a whole number from 1 to 8.';
    if (!Object.prototype.hasOwnProperty.call(PACES, input.pace)) errors.pace = 'Choose Steady or Lingering.';
    if (typeof input.intendedDate !== 'string' || (input.intendedDate && !validDate(input.intendedDate))) errors.intendedDate = 'Enter a real calendar date, or leave the date empty.';
    return errors;
  }
  function createPlan(input) {
    const errors = validate(input);
    if (Object.keys(errors).length) return { ok: false, errors };
    const walk = WALKS.find(item => item.id === input.walkId), pace = PACES[input.pace];
    const inputs = { walkId: walk.id, walkers: Number(input.walkers), pace: input.pace, intendedDate: input.intendedDate };
    return { ok: true, inputs, plan: {
      walkId: walk.id, walkName: walk.name, distanceKm: walk.distanceKm,
      baseDurationMinutes: walk.durationMinutes, addedMinutes: pace.addedMinutes,
      durationMinutes: walk.durationMinutes + pace.addedMinutes,
      durationLabel: formatMinutes(walk.durationMinutes + pace.addedMinutes),
      walkers: inputs.walkers, pace: input.pace, paceName: pace.name,
      intendedDate: input.intendedDate, dateLabel: formatDate(input.intendedDate),
      sequence: walk.sequence
    } };
  }
  function planText(plan) {
    return [
      'RIDGEWAY / SAMPLE WALK PLAN', '', plan.walkName,
      'Distance: ' + plan.distanceKm + ' km',
      'Time to allow: ' + plan.durationLabel,
      'Time basis: ' + plan.baseDurationMinutes + ' min + ' + plan.addedMinutes + ' min for ' + plan.paceName.toLowerCase() + ' pace',
      'Walkers: ' + plan.walkers,
      'Pace: ' + plan.paceName,
      'Intended date: ' + plan.dateLabel,
      'Imagined sequence: ' + plan.sequence,
      '', 'A fictional plan for exploring this example. No booking or enquiry has been made.'
    ].join('\n');
  }
  function makeSaved(input, savedAt) {
    const result = createPlan(input);
    if (!result.ok) return result;
    return { ok: true, record: { schemaVersion: 1, inputs: result.inputs, plan: result.plan, savedAt: savedAt || new Date().toISOString() } };
  }
  function parseSaved(raw) {
    try {
      const record = JSON.parse(raw);
      if (!record || record.schemaVersion !== 1 || typeof record.savedAt !== 'string' || Number.isNaN(Date.parse(record.savedAt))) return null;
      const recomputed = createPlan(record.inputs);
      if (!recomputed.ok || JSON.stringify(record.plan) !== JSON.stringify(recomputed.plan)) return null;
      return { schemaVersion: 1, inputs: recomputed.inputs, plan: recomputed.plan, savedAt: record.savedAt };
    } catch (_) { return null; }
  }
  return Object.freeze({ STORAGE_KEY, WALKS, PACES, DEFAULT_INPUT, validate, validDate, formatDate, formatMinutes, createPlan, planText, makeSaved, parseSaved });
});
