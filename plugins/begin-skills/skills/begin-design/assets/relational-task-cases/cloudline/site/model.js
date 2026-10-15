(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Cloudline = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DATES = Object.freeze(Array.from({length: 7}, (_, i) => `${i + 1} October 2026`));
  const STORAGE_KEY = 'cloudline.kept-analysis.v1';
  const EXAMPLE = Object.freeze({title: 'A week above the ridge', note: 'Invented observations for a reading exercise.', threshold: '5.0', values: Object.freeze(['1.2', '0.0', '6.8', '14.4', '3.6', '0.0', '9.6'])});
  const copy = value => JSON.parse(JSON.stringify(value));
  const blank = () => ({title: '', note: '', threshold: '5.0', values: ['', '', '', '', '', '', '']});
  const createState = () => ({input: blank(), prepared: null, stale: false, errors: {}});
  function parseMeasure(value) {
    if (typeof value !== 'string' || !value.trim()) return {error: 'Enter a reading. Zero is valid; an empty field is not.'};
    const cleaned = value.trim();
    if (!/^\d+(?:\.\d)?$/.test(cleaned)) return {error: 'Use a nonnegative number with at most one decimal place.'};
    const number = Number(cleaned);
    if (!Number.isFinite(number) || number > 200) return {error: 'Use a value from 0 to 200.0 mm.'};
    return {tenths: Math.round(number * 10)};
  }
  function validate(input) {
    const errors = {};
    if (!input || typeof input !== 'object') return {ok: false, errors: {form: 'The input record is incomplete.'}};
    if (typeof input.title !== 'string' || !input.title.trim()) errors.title = 'Enter a report title.';
    else if (input.title.length > 80) errors.title = 'Keep the report title within 80 characters.';
    if (typeof input.note !== 'string') errors.note = 'The note must be text.';
    else if (input.note.length > 400) errors.note = 'Keep the note within 400 characters.';
    const threshold = parseMeasure(input.threshold);
    if (threshold.error) errors.threshold = threshold.error;
    const measures = [];
    if (!Array.isArray(input.values) || input.values.length !== 7) errors.form = 'Enter exactly seven dated readings.';
    else input.values.forEach((value, i) => {
      const parsed = parseMeasure(value);
      if (parsed.error) errors[`day${i + 1}`] = parsed.error;
      measures.push(parsed.tenths);
    });
    return {ok: Object.keys(errors).length === 0, errors, tenths: measures, thresholdTenths: threshold.tenths};
  }
  function analyse(input) {
    const valid = validate(input);
    if (!valid.ok) return {ok: false, errors: valid.errors};
    const totalTenths = valid.tenths.reduce((total, value) => total + value, 0);
    const maximumTenths = Math.max(...valid.tenths);
    const analysis = {
      title: input.title, note: input.note,
      threshold: valid.thresholdTenths / 10,
      values: valid.tenths.map(value => value / 10),
      total: totalTenths / 10,
      mean: Math.round(totalTenths * 10 / 7) / 100,
      maximum: maximumTenths / 10,
      maxDates: DATES.filter((_, i) => valid.tenths[i] === maximumTenths),
      aboveThreshold: valid.tenths.filter(value => value > valid.thresholdTenths).length
    };
    return {ok: true, analysis, text: exportText(analysis)};
  }
  function exportText(analysis) {
    return [
      'CLOUDLINE / RAINFALL ANALYSIS',
      `Report: ${analysis.title}`,
      'Observation period: 1–7 October 2026',
      'Unit: millimetres (mm)',
      `Comparison threshold: ${analysis.threshold.toFixed(1)} mm (count values strictly above)`,
      '', 'SUMMARY',
      `Total rainfall: ${analysis.total.toFixed(1)} mm`,
      `Mean daily rainfall: ${analysis.mean.toFixed(2)} mm/day`,
      `Maximum daily rainfall: ${analysis.maximum.toFixed(1)} mm`,
      `Maximum date(s): ${analysis.maxDates.join('; ')}`,
      `Days strictly above ${analysis.threshold.toFixed(1)} mm: ${analysis.aboveThreshold} of 7`,
      '', 'DAILY READINGS',
      ...DATES.map((date, i) => `${date}: ${analysis.values[i].toFixed(1)} mm`),
      '', 'NOTE', analysis.note || '(No note supplied.)', '',
      'Fictional educational observations. No forecast, flood warning or real weather claim.', ''
    ].join('\n');
  }
  function edit(state, input) {
    return {...state, input: copy(input), stale: Boolean(state.prepared), errors: validate(input).errors};
  }
  function loadExample(state) { return edit(state, copy(EXAMPLE)); }
  function prepare(state) {
    const result = analyse(state.input);
    if (!result.ok) return {...state, errors: result.errors, stale: Boolean(state.prepared)};
    return {...state, prepared: {analysis: result.analysis, text: result.text}, stale: false, errors: {}};
  }
  function canUsePrepared(state) { return Boolean(state.prepared && !state.stale && validate(state.input).ok); }
  function reset() { return createState(); }
  function keep(state, storage) {
    if (!canUsePrepared(state)) return {ok: false, kind: 'stale', message: 'Prepare valid current input before keeping this analysis.'};
    const payload = {version: 1, input: copy(state.input), analysis: copy(state.prepared.analysis), text: state.prepared.text};
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return {ok: true, message: 'Kept this analysis in this browser. It will return when you reload this page.'};
    } catch (_) { return {ok: false, kind: 'denied', message: 'This browser could not keep the copy. Storage may be denied or full. Current work remains available; download its exact text instead.'}; }
  }
  function recover(storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch (_) { return {ok: false, kind: 'denied', message: 'This browser did not allow access to the kept copy. Current work has not changed.'}; }
    if (raw === null) return {ok: false, kind: 'empty', message: 'There is no kept Cloudline copy in this browser.'};
    try {
      const payload = JSON.parse(raw);
      if (!payload || payload.version !== 1) throw new Error('Version');
      const expected = analyse(payload.input);
      if (!expected.ok || expected.text !== payload.text || JSON.stringify(expected.analysis) !== JSON.stringify(payload.analysis)) throw new Error('Integrity');
      return {ok: true, state: {input: copy(payload.input), prepared: {analysis: copy(payload.analysis), text: payload.text}, stale: false, errors: {}}, message: 'Recovered the exact kept inputs and prepared analysis.'};
    } catch (_) { return {ok: false, kind: 'corrupt', message: 'The kept copy is incomplete or corrupt. Current work has not changed. Forget kept copy removes that stored copy.'}; }
  }
  function forget(storage) {
    try { storage.removeItem(STORAGE_KEY); return {ok: true, message: 'Forgot the kept copy. Current inputs and analysis have not changed.'}; }
    catch (_) { return {ok: false, kind: 'denied', message: 'This browser did not allow removal of the kept copy. Current work has not changed.'}; }
  }
  return Object.freeze({DATES, STORAGE_KEY, EXAMPLE, blank, createState, parseMeasure, validate, analyse, exportText, edit, loadExample, prepare, canUsePrepared, reset, keep, recover, forget});
});
