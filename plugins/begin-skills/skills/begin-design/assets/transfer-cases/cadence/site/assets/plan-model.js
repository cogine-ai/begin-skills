(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CadencePlan = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'cadence-study-week-v1';
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fixture = () => ({ goal: 'Learn Spanish', week: '2026-11-16', days: [0, 2, 4], duration: '45', start: '18:00' });
  const clone = value => JSON.parse(JSON.stringify(value));
  function cleanDraft(value) {
    if (!value || typeof value !== 'object') return null;
    if (!['goal', 'week', 'duration', 'start'].every(key => typeof value[key] === 'string')) return null;
    if (!Array.isArray(value.days) || value.days.some(day => !Number.isInteger(day) || day < 0 || day > 4)) return null;
    return { goal: value.goal, week: value.week, days: [...new Set(value.days)].sort((a, b) => a - b), duration: value.duration, start: value.start };
  }
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  function dateString(date) {
    return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }
  function addDays(value, count) {
    const date = parseDate(value);
    if (!date) throw new Error('Invalid date');
    date.setUTCDate(date.getUTCDate() + count);
    return dateString(date);
  }
  function parseTime(value) {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hour, minute] = value.split(':').map(Number);
    return hour < 24 && minute < 60 ? hour * 60 + minute : null;
  }
  function timeString(minutes) {
    const withinDay = minutes % 1440;
    return `${String(Math.floor(withinDay / 60)).padStart(2, '0')}:${String(withinDay % 60).padStart(2, '0')}`;
  }
  function errors(draft) {
    const result = {};
    if (!draft || typeof draft !== 'object') return { goal: 'Enter a goal to begin.' };
    if (typeof draft.goal !== 'string' || !draft.goal.trim()) result.goal = 'Give this week a study goal.';
    else if (draft.goal.length > 80) result.goal = 'Keep the goal to 80 characters or fewer.';
    const monday = parseDate(draft.week);
    if (!monday) result.week = 'Enter a real date for the week beginning.';
    else if (monday.getUTCDay() !== 1) result.week = 'Choose a Monday for the week beginning.';
    if (!Array.isArray(draft.days) || !draft.days.length) result.days = 'Choose at least one study day.';
    else if (draft.days.some(day => !Number.isInteger(day) || day < 0 || day > 4) || new Set(draft.days).size !== draft.days.length) result.days = 'Choose weekdays from Monday through Friday.';
    if (!['30', '45', '60'].includes(String(draft.duration))) result.duration = 'Choose 30, 45 or 60 minutes.';
    if (parseTime(draft.start) === null) result.start = 'Enter a start time from 00:00 to 23:59.';
    return result;
  }
  function fingerprint(draft) { return JSON.stringify(cleanDraft(draft)); }
  function prepare(draft) {
    const validation = errors(draft);
    if (Object.keys(validation).length) return { ok: false, errors: validation };
    const input = cleanDraft({ ...draft, duration: String(draft.duration) });
    const duration = Number(input.duration);
    const startMinutes = parseTime(input.start);
    const sessions = input.days.map(day => {
      const date = addDays(input.week, day);
      const end = startMinutes + duration;
      return { weekday: DAYS[day], date, startTime: input.start, endTime: timeString(end), endDate: addDays(date, Math.floor(end / 1440)), durationMinutes: duration };
    });
    const plan = { goal: input.goal.trim(), weekBeginning: input.week, weekdays: input.days.map(day => DAYS[day]), durationMinutes: duration, startTime: input.start, sessions, sessionCount: sessions.length, totalMinutes: sessions.length * duration };
    return { ok: true, draft: clone(input), fingerprint: fingerprint(input), plan };
  }
  function fresh(prepared, draft) { return Boolean(prepared && prepared.ok && prepared.fingerprint === fingerprint(draft)); }
  function keep(prepared, draft) {
    if (!fresh(prepared, draft)) return { ok: false, error: 'Build the current fields before keeping this plan.' };
    return { ok: true, saved: { draft: clone(prepared.draft), plan: clone(prepared.plan) } };
  }
  function longDate(value) {
    const date = parseDate(value);
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  function exportPlan(prepared, draft, format) {
    if (!fresh(prepared, draft)) return { ok: false, error: 'Build the current fields before exporting this plan.' };
    const plan = prepared.plan;
    if (format === 'json') return { ok: true, content: JSON.stringify(plan, null, 2) + '\n', mime: 'application/json', extension: 'json' };
    if (format !== 'text') return { ok: false, error: 'Choose text or JSON.' };
    const lines = ['Cadence study week', plan.goal, `Week beginning ${longDate(plan.weekBeginning)}`, `${plan.sessionCount} sessions · ${plan.totalMinutes} minutes`, ''];
    plan.sessions.forEach(session => lines.push(`${session.weekday}, ${longDate(session.date)} | ${session.startTime}–${session.endTime}${session.endDate !== session.date ? ` (ends ${longDate(session.endDate)})` : ''} | ${session.durationMinutes} minutes`));
    return { ok: true, content: lines.join('\n') + '\n', mime: 'text/plain', extension: 'txt' };
  }
  function writeStore(storage, saved, draft) {
    try { storage.setItem(KEY, JSON.stringify({ version: 1, draft: cleanDraft(draft), saved: saved ? clone(saved) : null })); return { ok: true }; }
    catch (_) { return { ok: false, error: 'This browser could not store the plan. You can still build and export it.' }; }
  }
  function readStore(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return { ok: true, draft: fixture(), saved: null, recovered: false };
      const data = JSON.parse(raw);
      if (data.version !== 1) throw new Error('Unknown storage version');
      const draft = cleanDraft(data.draft);
      if (!draft) throw new Error('Invalid draft');
      let saved = null;
      if (data.saved) {
        const rebuilt = prepare(data.saved.draft);
        if (!rebuilt.ok || JSON.stringify(rebuilt.plan) !== JSON.stringify(data.saved.plan)) throw new Error('Invalid saved plan');
        saved = { draft: rebuilt.draft, plan: rebuilt.plan };
      }
      return { ok: true, draft, saved, recovered: true };
    } catch (_) { return { ok: false, draft: fixture(), saved: null, recovered: false, error: 'Stored work could not be read. The sample fields are ready; stored data has not been overwritten.' }; }
  }
  return { KEY, DAYS, MONTHS, fixture, clone, cleanDraft, parseDate, addDays, parseTime, errors, fingerprint, prepare, fresh, keep, longDate, exportPlan, writeStore, readStore };
}));
