/* Relay's illustrative monthly meter. Integer cents, exact snapshots, no network. */
(function (root) {
  'use strict';
  const PLANS = Object.freeze({
    Basic: Object.freeze({ baseCents: 1200, includedCalls: 10000, blockCents: 100 }),
    Scale: Object.freeze({ baseCents: 2900, includedCalls: 40000, blockCents: 75 })
  });
  const STORAGE_KEY = 'relay.monthly-meter.v1';
  const count = value => Number(value).toLocaleString('en-US');
  const money = cents => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  function validate(input) {
    if (!input || !Object.hasOwn(PLANS, input.plan)) return { ok: false, field: 'plan', message: 'Choose Basic or Scale.' };
    if (typeof input.requests !== 'string' || input.requests === '') return { ok: false, field: 'requests', message: 'Enter the number of monthly calls.' };
    if (!/^[0-9]+$/.test(input.requests)) return { ok: false, field: 'requests', message: 'Use whole digits only, such as 18000. Do not add commas, spaces or decimals.' };
    const calls = Number(input.requests);
    if (!Number.isSafeInteger(calls) || calls < 0 || calls > 1000000) return { ok: false, field: 'requests', message: 'Enter a whole number from 0 to 1000000 calls.' };
    return { ok: true, calls };
  }
  function calculate(plan, calls) {
    if (!Object.hasOwn(PLANS, plan) || !Number.isSafeInteger(calls) || calls < 0 || calls > 1000000) throw new RangeError('Invalid illustrative plan or call count');
    const rate = PLANS[plan];
    const excessCalls = Math.max(0, calls - rate.includedCalls);
    const blocks = Math.ceil(excessCalls / 1000);
    const overageCents = blocks * rate.blockCents;
    return { plan, calls, ...rate, excessCalls, blocks, overageCents, totalCents: rate.baseCents + overageCents };
  }
  const initial = () => ({ input: { plan: 'Basic', requests: '18000' }, revision: 0, prepared: null, kept: null });
  function edit(state, field, value) {
    if (!['plan', 'requests'].includes(field)) throw new TypeError('Unknown field');
    if (state.input[field] === value) return state;
    return { ...state, input: { ...state.input, [field]: value }, revision: state.revision + 1 };
  }
  const isCurrent = state => Boolean(state.prepared && state.prepared.revision === state.revision);
  function prepare(state) {
    const result = validate(state.input);
    if (!result.ok) return { ok: false, state, ...result };
    const prepared = { ...calculate(state.input.plan, result.calls), version: (state.prepared?.version || 0) + 1, revision: state.revision };
    return { ok: true, state: { ...state, prepared } };
  }
  function keep(state) {
    if (!isCurrent(state)) return { ok: false, state, message: 'Prepare the selected values before keeping this estimate.' };
    const record = { schema: 1, input: { ...state.input }, revision: state.revision, prepared: { ...state.prepared } };
    return { ok: true, record, state: { ...state, kept: record } };
  }
  function restore(record) {
    if (!record || record.schema !== 1 || !record.input || !record.prepared || !Number.isSafeInteger(record.revision) || record.revision < 0) return null;
    const valid = validate(record.input);
    if (!valid.ok || !Number.isSafeInteger(record.prepared.version) || record.prepared.version < 1 || record.prepared.revision !== record.revision) return null;
    const expected = calculate(record.input.plan, valid.calls);
    if (!Object.entries(expected).every(([key, value]) => record.prepared[key] === value)) return null;
    const prepared = { ...expected, version: record.prepared.version, revision: record.revision };
    const clean = { schema: 1, input: { plan: record.input.plan, requests: record.input.requests }, revision: record.revision, prepared };
    return { input: { ...clean.input }, revision: clean.revision, prepared, kept: clean };
  }
  function summary(prepared) {
    return [
      'RELAY — ILLUSTRATIVE MONTHLY API ESTIMATE',
      `Prepared version: ${String(prepared.version).padStart(2, '0')}`,
      `Plan: ${prepared.plan}`,
      `Monthly calls: ${count(prepared.calls)}`,
      `Included calls: ${count(prepared.includedCalls)}`,
      `Excess calls: ${count(prepared.excessCalls)}`,
      `Begun 1,000-call blocks: ${count(prepared.blocks)}`,
      `Base fee: USD ${money(prepared.baseCents)}`,
      `Rate per begun excess block: USD ${money(prepared.blockCents)}`,
      `Excess cost: USD ${money(prepared.overageCents)}`,
      `Monthly total: USD ${money(prepared.totalCents)}`,
      '',
      'Illustrative concept rates only. No taxes or other fees are modeled.',
      'This is a browser-local estimate, not an invoice, provider recommendation or purchase.',
      ''
    ].join('\n');
  }
  const api = { PLANS, STORAGE_KEY, count, money, validate, calculate, initial, edit, isCurrent, prepare, keep, restore, summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RelayMeter = api;
})(typeof window !== 'undefined' ? window : globalThis);
