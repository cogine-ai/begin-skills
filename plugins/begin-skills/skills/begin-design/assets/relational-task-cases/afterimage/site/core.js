(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Afterimage = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'afterimage.cue-sheet.v1';
  const CATEGORIES = ['Atmosphere', 'Foley', 'Music'];
  const EXAMPLE = {
    projectName: 'First light', projectNote: 'Leave the final line clear.',
    cues: [
      { title: 'Station doors — before the first line', category: 'Atmosphere', start: '00:00', end: '00:18', note: 'A broad station room tone beneath dialogue.' },
      { title: 'Footbridge, footsteps and a single latch', category: 'Foley', start: '00:18', end: '00:42', note: 'Close footsteps, then a single gate latch.' },
      { title: 'Écho at first light', category: 'Music', start: '00:42', end: '01:15', note: 'A low pulse that ends before the final line.' }
    ]
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const emptyInput = () => ({ projectName: '', projectNote: '', cues: CATEGORIES.map(category => ({ title: '', category, start: '', end: '', note: '' })) });
  function seconds(value) { return typeof value === 'string' && /^[0-5]\d:[0-5]\d$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null; }
  function validate(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) return [{ field: 'project-name', message: 'The project inputs are missing.' }];
    function text(value, field, label, max, required, singleLine) {
      if (typeof value !== 'string') errors.push({ field, message: label + ' must be text.' });
      else if (required && !value.trim()) errors.push({ field, message: 'Enter ' + label.toLowerCase() + '.' });
      else if (Array.from(value).length > max) errors.push({ field, message: label + ' must contain at most ' + max + ' characters.' });
      else if (singleLine && /[\r\n]/.test(value)) errors.push({ field, message: label + ' must stay on one line.' });
    }
    text(input.projectName, 'project-name', 'Project name', 80, true, true);
    text(input.projectNote, 'project-note', 'Project note', 400, false, false);
    if (!Array.isArray(input.cues) || input.cues.length !== 3) { errors.push({ field: 'project-name', message: 'A cue sheet must contain exactly three cues.' }); return errors; }
    let previousEnd = null;
    input.cues.forEach((cue, i) => {
      const id = 'cue-' + (i + 1) + '-'; const name = 'A0' + (i + 1);
      if (!cue || typeof cue !== 'object') { errors.push({ field: id + 'title', message: name + ' is missing.' }); previousEnd = null; return; }
      text(cue.title, id + 'title', name + ' title', 100, true, true);
      text(cue.note, id + 'note', name + ' note', 300, false, false);
      if (!CATEGORIES.includes(cue.category)) errors.push({ field: id + 'category', message: 'Choose Atmosphere, Foley or Music for ' + name + '.' });
      const start = seconds(cue.start); const end = seconds(cue.end);
      if (start === null) errors.push({ field: id + 'start', message: name + ' start must use mm:ss, with minutes and seconds from 00 to 59.' });
      if (end === null) errors.push({ field: id + 'end', message: name + ' end must use mm:ss, with minutes and seconds from 00 to 59.' });
      if (start !== null && end !== null && end <= start) errors.push({ field: id + 'end', message: name + ' end must be later than its start.' });
      if (start !== null && previousEnd !== null && start < previousEnd) errors.push({ field: id + 'start', message: name + ' start must be at or after A0' + i + ' end.' });
      previousEnd = end;
    });
    return errors;
  }
  function exportText(result) {
    const lines = ['AFTERIMAGE — CUE SHEET', 'Project: ' + result.projectName, 'Project note: ' + (result.projectNote || '(none)'), ''];
    result.cues.forEach(cue => lines.push(cue.id + ' — ' + cue.title, 'Category: ' + cue.category, 'Start: ' + cue.start, 'End: ' + cue.end, 'Duration: ' + cue.duration + ' seconds', 'Note: ' + (cue.note || '(none)'), ''));
    lines.push('TOTALS', 'Occupied time: ' + result.occupied + ' seconds', 'Project span: ' + result.span + ' seconds (' + result.cues[0].start + '–' + result.cues[2].end + ')', 'Gaps between cues: ' + result.gaps + ' seconds');
    return lines.join('\n') + '\n';
  }
  function calculate(input) {
    const errors = validate(input);
    if (errors.length) return { ok: false, errors };
    const cues = input.cues.map((cue, i) => ({ id: 'A0' + (i + 1), ...clone(cue), startSeconds: seconds(cue.start), endSeconds: seconds(cue.end), duration: seconds(cue.end) - seconds(cue.start) }));
    const occupied = cues.reduce((sum, cue) => sum + cue.duration, 0);
    const span = cues[2].endSeconds - cues[0].startSeconds;
    const result = { projectName: input.projectName, projectNote: input.projectNote, cues, occupied, span, gaps: span - occupied };
    result.text = exportText(result);
    return { ok: true, result };
  }
  function newState(input) { return { input: clone(input || emptyInput()), prepared: null, dirty: false, errors: [] }; }
  function edit(state, input) { return { input: clone(input), prepared: state.prepared ? clone(state.prepared) : null, dirty: true, errors: [] }; }
  function prepare(state) {
    const calculation = calculate(state.input);
    return calculation.ok ? { input: clone(state.input), prepared: calculation.result, dirty: false, errors: [] } : { input: clone(state.input), prepared: state.prepared ? clone(state.prepared) : null, dirty: true, errors: calculation.errors };
  }
  function canUsePrepared(state) { return Boolean(state.prepared && !state.dirty && !state.errors.length); }
  function envelope(state) {
    if (!canUsePrepared(state)) throw new Error('Prepare valid current inputs before keeping or downloading.');
    return { product: 'afterimage', version: 1, input: clone(state.input), prepared: clone(state.prepared) };
  }
  function decode(raw) {
    let value;
    try { value = JSON.parse(raw); } catch (_) { throw new Error('The kept copy is not readable JSON.'); }
    if (!value || value.product !== 'afterimage' || value.version !== 1) throw new Error('The kept copy has an unsupported format.');
    const calculation = calculate(value.input);
    if (!calculation.ok || JSON.stringify(value.prepared) !== JSON.stringify(calculation.result)) throw new Error('The kept inputs and prepared sheet do not match.');
    return { input: clone(value.input), prepared: calculation.result, dirty: false, errors: [] };
  }
  function keep(state, storage) {
    if (!canUsePrepared(state)) return { ok: false, status: 'stale', message: 'Prepare valid current inputs before keeping this sheet.' };
    try { storage.setItem(KEY, JSON.stringify(envelope(state))); return { ok: true, status: 'kept', message: 'Kept in this browser. This copy will be restored when you reload the cue-sheet page.' }; }
    catch (_) { return { ok: false, status: 'denied', message: 'This browser did not allow keeping the copy. Your current sheet remains here. Download exact text to retain a file.' }; }
  }
  function recover(state, storage) {
    let raw;
    try { raw = storage.getItem(KEY); } catch (_) { return { ok: false, state, status: 'denied', message: 'This browser did not allow reading its kept copy. Your current work remains here.' }; }
    if (raw === null) return { ok: false, state, status: 'empty', message: 'There is no kept copy in this browser.' };
    try { return { ok: true, state: decode(raw), status: 'recovered', message: 'Recovered the kept inputs and prepared sheet exactly.' }; }
    catch (_) { return { ok: false, state, status: 'corrupt', message: 'The kept copy is unreadable or does not match its inputs. Your current work remains here. Use Forget kept copy to remove it, then keep a newly prepared sheet.' }; }
  }
  function forget(storage) {
    try { storage.removeItem(KEY); return { ok: true, status: 'forgotten', message: 'Forgot the browser copy. Your current inputs and prepared sheet remain here.' }; }
    catch (_) { return { ok: false, status: 'denied', message: 'This browser did not allow removing the kept copy. Your current work remains here.' }; }
  }
  return { KEY, CATEGORIES, EXAMPLE, clone, emptyInput, seconds, validate, calculate, exportText, newState, edit, prepare, canUsePrepared, envelope, decode, keep, recover, forget };
}));
