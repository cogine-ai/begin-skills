(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NightSignal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'night-signal.itinerary.v1';
  const NOTE_LIMIT = 240;
  const DAYS = Object.freeze([
    Object.freeze({ id: 'friday', date: '2026-11-06', label: 'Friday 6 November 2026', short: 'Friday 6 Nov' }),
    Object.freeze({ id: 'saturday', date: '2026-11-07', label: 'Saturday 7 November 2026', short: 'Saturday 7 Nov' })
  ]);
  const SESSIONS = Object.freeze([
    Object.freeze({ id: 'find-north', day: 'friday', name: 'Find north', start: 1110, end: 1155, station: 'Field circle', host: 'Mara Vale', description: 'Read the horizon, find Polaris and build a first map of the night. Start here if the sky feels unfamiliar.', format: 'Sky orientation', equipment: 'No equipment needed' }),
    Object.freeze({ id: 'binocular-atlas', day: 'friday', name: 'A binocular atlas', start: 1140, end: 1200, station: 'East lawn', host: 'Theo Reed', description: 'Follow a small trail of stars through borrowed binoculars. Learn how to steady the view and keep both eyes open.', format: 'Hands-on observing', equipment: 'Shared binoculars' }),
    Object.freeze({ id: 'beyond-eye', day: 'friday', name: 'Beyond the naked eye', start: 1215, end: 1290, station: 'Scope line', host: 'Imani Cross', description: 'Take turns at three telescopes and compare what a wider aperture reveals. Leave with a few objects you can find again.', format: 'Telescope walk', equipment: 'Shared telescopes' }),
    Object.freeze({ id: 'lunar-sketchbook', day: 'saturday', name: 'Lunar sketchbook', start: 1080, end: 1140, station: 'Moon table', host: 'Kit Rowan', description: 'Turn a close look into a simple drawing. Compare light and shadow along the Moon’s edge with pencils and a shared scope.', format: 'Observation & drawing', equipment: 'Paper and pencils provided' }),
    Object.freeze({ id: 'first-telescope', day: 'saturday', name: 'Your first telescope', start: 1110, end: 1170, station: 'Scope line', host: 'Imani Cross', description: 'Try a finder, change an eyepiece and practise focusing. A patient introduction before your first solo look.', format: 'Practical introduction', equipment: 'Shared telescopes' }),
    Object.freeze({ id: 'deep-sky', day: 'saturday', name: 'Deep sky circle', start: 1200, end: 1290, station: 'Field circle', host: 'Mara Vale', description: 'A slower final session for clusters, distant light and questions. Share a telescope, a field note or simply the view.', format: 'Guided observing', equipment: 'Shared telescopes' })
  ]);
  function time(value) { return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0'); }
  function selected(ids) { return SESSIONS.filter(s => ids.includes(s.id)); }
  function validate(ids, note) {
    if (!Array.isArray(ids) || !ids.length) return 'Choose at least one session to prepare an itinerary.';
    if (ids.length > SESSIONS.length || new Set(ids).size !== ids.length || ids.some(id => !SESSIONS.some(s => s.id === id))) return 'Choose only the six listed sessions, each at most once.';
    if (typeof note !== 'string' || note.length > NOTE_LIMIT) return 'Keep your field note to 240 characters or fewer.';
    return '';
  }
  function conflicts(ids) {
    const items = selected(Array.isArray(ids) ? ids : []), found = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j], start = Math.max(a.start, b.start), end = Math.min(a.end, b.end);
      if (a.day === b.day && start < end) found.push({ first: a.id, second: b.id, firstName: a.name, secondName: b.name, day: a.day, start, end, minutes: end - start });
    }
    return found;
  }
  function prepare(ids, note = '') {
    const error = validate(ids, note);
    if (error) return { ok: false, error, conflicts: [] };
    const overlap = conflicts(ids);
    if (overlap.length) return { ok: false, error: 'Choose one session from each overlapping pair, then prepare again.', conflicts: overlap };
    const items = selected(ids);
    const days = DAYS.filter(d => items.some(s => s.day === d.id)).map(d => {
      const sessions = items.filter(s => s.day === d.id).map(s => ({ id: s.id, name: s.name, start: time(s.start), end: time(s.end), minutes: s.end - s.start, station: s.station, host: s.host }));
      const original = items.filter(s => s.day === d.id), gaps = [];
      for (let i = 1; i < original.length; i++) {
        gaps.push({ after: original[i - 1].id, before: original[i].id, start: time(original[i - 1].end), end: time(original[i].start), minutes: original[i].start - original[i - 1].end });
      }
      return { ...d, sessions, gaps, sessionMinutes: sessions.reduce((n, s) => n + s.minutes, 0), gapMinutes: gaps.reduce((n, g) => n + g.minutes, 0), start: sessions[0].start, end: sessions.at(-1).end };
    });
    return { ok: true, itinerary: { version: 1, sessionIds: items.map(s => s.id), note, days, sessionCount: items.length, sessionMinutes: days.reduce((n, d) => n + d.sessionMinutes, 0), gapMinutes: days.reduce((n, d) => n + d.gapMinutes, 0) } };
  }
  function exportText(plan) {
    const lines = ['NIGHT SIGNAL / PERSONAL ITINERARY', 'Fictional community astronomy weekend', '6–7 November 2026 / Ridgefield Common (fictional)', 'All times are venue local time; no timezone conversion.', ''];
    plan.days.forEach(day => {
      lines.push(day.label.toUpperCase());
      day.sessions.forEach((s, i) => {
        lines.push(s.start + '–' + s.end + '  ' + s.name, s.minutes + ' minutes · ' + s.station + ' · ' + s.host);
        if (day.gaps[i]) { const g = day.gaps[i]; lines.push(g.start + '–' + g.end + '  Between sessions / ' + g.minutes + ' minutes'); }
      });
      lines.push('Day span: ' + day.start + '–' + day.end, '');
    });
    lines.push('TOTALS', 'Sessions: ' + plan.sessionCount, 'Session time: ' + plan.sessionMinutes + ' minutes', 'Between sessions: ' + plan.gapMinutes + ' minutes (within each day only)');
    if (plan.note) lines.push('', 'FIELD NOTE', plan.note);
    lines.push('', 'A personal plan for a fictional event. No booking, ticket, place or payment is created.');
    return lines.join('\n') + '\n';
  }
  function makeSaved(plan, savedAt = new Date().toISOString()) {
    const result = prepare(plan && plan.sessionIds, plan && plan.note);
    if (!result.ok || JSON.stringify(result.itinerary) !== JSON.stringify(plan) || Number.isNaN(Date.parse(savedAt))) return null;
    return { version: 1, savedAt, itinerary: result.itinerary };
  }
  function parseSaved(raw) {
    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || typeof data.savedAt !== 'string') return null;
      return makeSaved(data.itinerary, data.savedAt);
    } catch (_) { return null; }
  }
  return Object.freeze({ STORAGE_KEY, NOTE_LIMIT, DAYS, SESSIONS, time, selected, validate, conflicts, prepare, exportText, makeSaved, parseSaved });
});
