/* Home Current's local model: integer watt-hours and cents, versioned snapshots. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'home-current.energy-sheet.v1';
  const fields = Object.freeze(['name', 'watts', 'hours', 'days', 'rate', 'note']);
  const limits = Object.freeze({
    watts: { min: 1, max: 10000, label: 'Power', unit: 'watts' },
    hours: { min: 1, max: 24, label: 'Daily use', unit: 'hours' },
    days: { min: 1, max: 31, label: 'Days in the month', unit: 'days' },
    rate: { min: 1, max: 100, label: 'Electricity rate', unit: 'cents per kWh' }
  });
  const defaults = () => ({ name: 'Room heater', watts: '1500', hours: '4', days: '30', rate: '25', note: '' });
  const initial = () => ({ input: defaults(), revision: 0, prepared: null, kept: null });
  function validate(raw) {
    const errors = {};
    if (!raw || typeof raw !== 'object') return { ok: false, errors: { name: 'Enter an appliance name.' } };
    if (typeof raw.name !== 'string' || !raw.name.trim()) errors.name = 'Enter a descriptive appliance name.';
    else if (raw.name.length > 80) errors.name = 'Keep the appliance name to 80 characters or fewer.';
    if (typeof raw.note !== 'string' || raw.note.length > 300) errors.note = 'Keep your note to 300 characters or fewer.';
    const input = { name: raw.name, note: raw.note };
    for (const [field, range] of Object.entries(limits)) {
      if (typeof raw[field] !== 'string' || !/^[0-9]+$/.test(raw[field])) {
        errors[field] = 'Use whole digits for ' + range.label.toLowerCase() + ', with no spaces, commas or decimals.';
      } else {
        const value = Number(raw[field]);
        if (!Number.isSafeInteger(value) || value < range.min || value > range.max) errors[field] = 'Enter ' + range.min + '–' + range.max + ' whole ' + range.unit + '.';
        else input[field] = value;
      }
    }
    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, input };
  }
  function calculate(input) {
    const wattHours = input.watts * input.hours * input.days;
    // wattHours / 1000 * rate gives cents; nearest cent, exact-half-up.
    const costCents = Math.floor((wattHours * input.rate + 500) / 1000);
    return { wattHours, costCents };
  }
  const energy = wattHours => {
    const whole = Math.floor(wattHours / 1000);
    const fraction = String(wattHours % 1000).padStart(3, '0').replace(/0+$/, '');
    return String(whole) + (fraction ? '.' + fraction : '');
  };
  const money = cents => Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
  const versionLabel = n => String(n).padStart(2, '0');
  function edit(state, field, value) {
    if (!fields.includes(field) || typeof value !== 'string') throw new TypeError('Unknown field or invalid edit');
    if (state.input[field] === value) return state;
    return { ...state, input: { ...state.input, [field]: value }, revision: state.revision + 1 };
  }
  const isCurrent = state => Boolean(state.prepared && state.prepared.revision === state.revision);
  function prepare(state) {
    const checked = validate(state.input);
    if (!checked.ok) return { ...checked, state };
    const prepared = {
      input: { ...checked.input },
      ...calculate(checked.input),
      revision: state.revision,
      version: (state.prepared?.version || 0) + 1
    };
    return { ok: true, state: { ...state, prepared } };
  }
  function record(state) {
    if (!isCurrent(state)) return null;
    return { schema: 1, rawInput: { ...state.input }, prepared: { ...state.prepared, input: { ...state.prepared.input } } };
  }
  function restore(value) {
    if (!value || value.schema !== 1 || !value.rawInput || !value.prepared) return null;
    const checked = validate(value.rawInput);
    const p = value.prepared;
    if (!checked.ok || !p.input || !Number.isSafeInteger(p.version) || p.version < 1 || !Number.isSafeInteger(p.revision) || p.revision < 0) return null;
    const expected = calculate(checked.input);
    if (p.wattHours !== expected.wattHours || p.costCents !== expected.costCents || !fields.every(f => p.input[f] === checked.input[f])) return null;
    const rawInput = Object.fromEntries(fields.map(f => [f, value.rawInput[f]]));
    const prepared = { input: { ...checked.input }, ...expected, version: p.version, revision: p.revision };
    const clean = { schema: 1, rawInput: { ...rawInput }, prepared: { ...prepared, input: { ...prepared.input } } };
    return { input: rawInput, revision: p.revision, prepared, kept: clean };
  }
  function summary(prepared) {
    const i = prepared.input;
    return [
      'HOME CURRENT',
      'Illustrative monthly energy sheet',
      'Prepared version: ' + versionLabel(prepared.version),
      'Status at download: Current',
      'Appliance: ' + i.name,
      'Power: ' + i.watts + ' watts',
      'Daily use: ' + i.hours + ' hours a day',
      'Days in the month: ' + i.days + ' days',
      'Electricity rate: ' + i.rate + ' cents per kWh',
      'Monthly energy: ' + energy(prepared.wattHours) + ' kWh',
      'Illustrative monthly cost: USD ' + money(prepared.costCents),
      '',
      'Energy formula: ' + i.watts + ' watts × ' + i.hours + ' hours/day × ' + i.days + ' days ÷ 1000 = ' + energy(prepared.wattHours) + ' kWh',
      'Cost formula: ' + energy(prepared.wattHours) + ' kWh × ' + i.rate + ' cents/kWh ÷ 100 = USD ' + money(prepared.costCents) + ' (rounded to cents)',
      'Exact money calculation: ' + prepared.wattHours + ' watt-hours × ' + i.rate + ' ÷ 1000, rounded to ' + prepared.costCents + ' cents',
      '',
      'Visitor note:',
      i.note || '(No note entered)',
      '',
      'Illustrative constant-power estimate from entered values.',
      'No actual tariff, metered data, energy advice, utility integration or payment.',
      'Prepared and downloaded locally. Nothing is sent to a server.',
      ''
    ].join('\n');
  }
  const api = { STORAGE_KEY, fields, limits, defaults, initial, validate, calculate, energy, money, versionLabel, edit, isCurrent, prepare, record, restore, summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HomeCurrent = api;
})(typeof window !== 'undefined' ? window : globalThis);
