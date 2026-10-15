(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BreakawayPace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'breakaway.pace-sheet.v1';
  const DEFAULT_INPUT = Object.freeze({ distance: '60', pace: '24', start: '08:00' });
  function validate(input) {
    const errors = {};
    const distance = String(input.distance == null ? '' : input.distance).trim();
    const pace = String(input.pace == null ? '' : input.pace).trim();
    const start = String(input.start == null ? '' : input.start).trim();
    if (!/^\d+$/.test(distance) || Number(distance) < 10 || Number(distance) > 200) errors.distance = 'Enter a whole number from 10 to 200 km.';
    if (!/^\d+$/.test(pace) || Number(pace) < 10 || Number(pace) > 40) errors.pace = 'Enter a whole number from 10 to 40 km/h.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) errors.start = 'Enter a start time as HH:MM, from 00:00 to 23:59.';
    return errors;
  }
  function durationLabel(minutes) {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '');
  }
  function calculate(input) {
    const errors = validate(input);
    if (Object.keys(errors).length) return { ok: false, errors };
    const distance = Number(String(input.distance).trim()), pace = Number(String(input.pace).trim()), start = String(input.start).trim();
    const duration = Math.round(distance / pace * 60);
    const [h, m] = start.split(':').map(Number);
    const finishMinutes = h * 60 + m + duration;
    const nextDay = finishMinutes >= 1440;
    const withinDay = finishMinutes % 1440;
    const finish = String(Math.floor(withinDay / 60)).padStart(2, '0') + ':' + String(withinDay % 60).padStart(2, '0');
    return { ok: true, sheet: { distance, pace, start, duration, durationLabel: durationLabel(duration), finish, nextDay } };
  }
  function inputFromSheet(sheet) { return { distance: String(sheet.distance), pace: String(sheet.pace), start: sheet.start }; }
  function text(sheet) {
    return ['BREAKAWAY / RIDE PACE WORKSHEET', '',
      'Distance: ' + sheet.distance + ' km',
      'Target pace: ' + sheet.pace + ' km/h',
      'Start time: ' + sheet.start,
      'Moving duration: ' + sheet.duration + ' minutes (' + sheet.durationLabel + ')',
      'Estimated finish: ' + sheet.finish + ' (' + (sheet.nextDay ? 'next day' : 'same day') + ')',
      'Calculation: round(' + sheet.distance + ' / ' + sheet.pace + ' * 60) = ' + sheet.duration + ' minutes', '',
      'Constant target pace. Stops and delays are not included.',
      'Breakaway is a fictional cycling club. Arithmetic only; no route or fitness assessment.'
    ].join('\n') + '\n';
  }
  function createRecord(sheet, savedAt) {
    return { version: 1, inputs: inputFromSheet(sheet), savedAt: savedAt || new Date().toISOString() };
  }
  function parseRecord(raw) {
    try {
      const record = JSON.parse(raw);
      if (!record || record.version !== 1 || !record.inputs || typeof record.savedAt !== 'string' || Number.isNaN(Date.parse(record.savedAt))) return null;
      const result = calculate(record.inputs);
      if (!result.ok) return null;
      return { version: 1, inputs: inputFromSheet(result.sheet), savedAt: record.savedAt };
    } catch (_) { return null; }
  }
  function summary(sheet) {
    return sheet.distance + ' km · ' + sheet.pace + ' km/h · ' + sheet.start + ' → ' + sheet.finish + (sheet.nextDay ? ' next day' : '') + ' · ' + sheet.duration + ' minutes';
  }
  function initial(record, notice) {
    const prepared = record ? calculate(record.inputs).sheet : null;
    return { inputs: record ? { ...record.inputs } : { ...DEFAULT_INPUT }, prepared, stale: false, errors: {}, kept: record || null,
      feedback: prepared ? 'Kept worksheet restored. You can keep or download this current sheet.' : 'Prepare your numbers to make the sheet.',
      keepFeedback: notice || (prepared ? 'Kept here: ' + summary(prepared) + '.' : 'No worksheet kept in this browser.'), keepError: false };
  }
  function isCurrent(state) { return Boolean(state.prepared && !state.stale && !Object.keys(state.errors).length); }
  function transition(state, event) {
    switch (event.type) {
      case 'edit': {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_INPUT, event.field)) return state;
        const errors = { ...state.errors }; delete errors[event.field];
        return { ...state, inputs: { ...state.inputs, [event.field]: event.value }, stale: Boolean(state.prepared), errors,
          feedback: state.prepared ? 'Inputs changed. Prepare again before keeping or downloading.' : 'Prepare your numbers to make the sheet.',
          keepFeedback: state.kept ? 'Your kept worksheet is unchanged. Prepare these edits before keeping or downloading.' : 'Prepare these inputs before keeping or downloading.', keepError: false };
      }
      case 'prepare': {
        const result = calculate(state.inputs);
        if (!result.ok) return { ...state, errors: result.errors, stale: Boolean(state.prepared), feedback: 'Check the labeled errors. Your edits and previous sheet are preserved.', keepError: false };
        return { ...state, prepared: result.sheet, stale: false, errors: {}, feedback: 'Worksheet prepared: ' + summary(result.sheet) + '.',
          keepFeedback: state.kept ? 'This current sheet is ready. Keeping it will replace your earlier kept worksheet.' : 'Current sheet ready to keep in this browser or download.', keepError: false };
      }
      case 'keep-success':
        if (!isCurrent(state)) return state;
        return { ...state, kept: event.record, keepFeedback: 'Kept in this browser: ' + summary(state.prepared) + '.', keepError: false };
      case 'keep-failure': return { ...state, keepFeedback: 'Browser storage could not keep this sheet. Your current result is still available for Download text.', keepError: true };
      case 'restore':
        if (!state.kept) return state;
        return { ...initial(state.kept), feedback: 'Kept worksheet restored. Unsaved edits have been replaced.' };
      case 'download':
        if (!isCurrent(state)) return state;
        return { ...state, keepFeedback: 'Text download created for the current sheet: ' + summary(state.prepared) + '.', keepError: false };
      case 'download-failure': return { ...state, keepFeedback: 'The text download could not be created. Your current sheet remains available.', keepError: true };
      case 'reset': return { ...initial(null), feedback: 'Worksheet reset. Prepare the default inputs to begin.', keepFeedback: event.storageFailed ? 'The page was reset, but browser storage could not be cleared. A previous kept worksheet may return on reload.' : 'Worksheet reset. The kept browser copy was removed.', keepError: Boolean(event.storageFailed) };
      default: return state;
    }
  }
  return Object.freeze({ STORAGE_KEY, DEFAULT_INPUT, validate, calculate, durationLabel, text, createRecord, parseRecord, summary, initial, isCurrent, transition });
});
