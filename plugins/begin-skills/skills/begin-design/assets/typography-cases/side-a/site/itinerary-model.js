(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SideAItinerary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'side-a.itinerary.v1';
  const DATE = '2026-11-13';
  const DATE_LABEL = 'Friday 13 November 2026';
  const VENUE = 'The Cabinet Room';
  const SESSIONS = Object.freeze([
    Object.freeze({ id: 'deep-listening', name: 'Deep Listening', start: 1140, end: 1200, description: 'Spacious pieces, patient rhythms and the details you hear when the room settles.', format: 'Ambient / close listening' }),
    Object.freeze({ id: 'night-shift', name: 'Night Shift', start: 1170, end: 1260, description: 'A longer set of restless grooves, low-end movement and records that take their time.', format: 'Jazz / rhythm / late electronics' }),
    Object.freeze({ id: 'after-hours', name: 'After Hours', start: 1290, end: 1350, description: 'Loose edges and unhurried last tracks. A quiet way to finish the evening.', format: 'Downtempo / last records' })
  ]);
  function time(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
  function validate(ids) {
    if (!Array.isArray(ids) || !ids.length) return 'Choose at least one listening session.';
    if (ids.length > 3 || ids.some(id => !SESSIONS.some(session => session.id === id)) || new Set(ids).size !== ids.length) return 'Choose each of the three listed sessions at most once.';
    return null;
  }
  function selectedSessions(ids) { return SESSIONS.filter(session => ids.includes(session.id)); }
  function conflicts(ids) {
    if (validate(ids)) return [];
    const selected = selectedSessions(ids), found = [];
    for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
      const start = Math.max(selected[i].start, selected[j].start), end = Math.min(selected[i].end, selected[j].end);
      if (start < end) found.push({ first: selected[i].name, second: selected[j].name, start, end, minutes: end - start });
    }
    return found;
  }
  function signature(ids) { return selectedSessions(ids).map(session => session.id).join('|'); }
  function prepare(ids) {
    const error = validate(ids);
    if (error) return { ok: false, error, conflicts: [] };
    const overlaps = conflicts(ids);
    if (overlaps.length) return { ok: false, error: 'These sessions overlap. Deselect one of the conflicting sessions, then prepare again.', conflicts: overlaps };
    const selected = selectedSessions(ids), gaps = [];
    for (let i = 1; i < selected.length; i++) {
      gaps.push({ after: selected[i - 1].name, before: selected[i].name, start: selected[i - 1].end, end: selected[i].start, minutes: selected[i].start - selected[i - 1].end });
    }
    return { ok: true, itinerary: {
      date: DATE, dateLabel: DATE_LABEL, venue: VENUE,
      sessionIds: selected.map(session => session.id),
      sessions: selected.map(session => ({ id: session.id, name: session.name, start: time(session.start), end: time(session.end), durationMinutes: session.end - session.start })),
      listeningMinutes: selected.reduce((sum, session) => sum + session.end - session.start, 0),
      gaps: gaps.map(gap => ({ ...gap, start: time(gap.start), end: time(gap.end) })),
      gapMinutes: gaps.reduce((sum, gap) => sum + gap.minutes, 0),
      start: time(selected[0].start), end: time(selected[selected.length - 1].end)
    } };
  }
  function text(itinerary) {
    const lines = ['SIDE A / YOUR EVENING', itinerary.dateLabel, itinerary.venue + ' (fictional venue)', 'All times are venue local time.', ''];
    itinerary.sessions.forEach((session, index) => {
      lines.push(session.start + '–' + session.end + '  ' + session.name + ' / ' + session.durationMinutes + ' minutes listening');
      if (itinerary.gaps[index]) { const gap = itinerary.gaps[index]; lines.push(gap.start + '–' + gap.end + '  Between sessions / ' + gap.minutes + ' minutes'); }
    });
    lines.push('', 'Listening total: ' + itinerary.listeningMinutes + ' minutes', 'Time between sessions: ' + itinerary.gapMinutes + ' minutes', 'Evening span: ' + itinerary.start + '–' + itinerary.end, '', 'A local itinerary for a fictional evening. No booking, ticket or payment is made.');
    return lines.join('\n');
  }
  function makeSaved(itinerary, savedAt) {
    const result = prepare(itinerary && itinerary.sessionIds);
    if (!result.ok || JSON.stringify(itinerary) !== JSON.stringify(result.itinerary)) return null;
    return { version: 1, savedAt: savedAt || new Date().toISOString(), itinerary: result.itinerary };
  }
  function parseSaved(raw) {
    try {
      const record = JSON.parse(raw);
      if (!record || record.version !== 1 || typeof record.savedAt !== 'string' || Number.isNaN(Date.parse(record.savedAt))) return null;
      const result = prepare(record.itinerary && record.itinerary.sessionIds);
      if (!result.ok || JSON.stringify(record.itinerary) !== JSON.stringify(result.itinerary)) return null;
      return { version: 1, savedAt: record.savedAt, itinerary: result.itinerary };
    } catch (_) { return null; }
  }
  return Object.freeze({ STORAGE_KEY, DATE, DATE_LABEL, VENUE, SESSIONS, time, validate, conflicts, signature, prepare, text, makeSaved, parseSaved });
});
