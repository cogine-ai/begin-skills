(function (root) {
  'use strict';
  const data = root.OffsetData || (typeof require !== 'undefined' ? require('./data.js') : null);
  const KEY = 'offset-studio-local-v1';
  const byId = id => data.projects.find(p => p.id === id);
  const empty = () => ({ ids: [], draft: { name: '', email: '', brief: '' } });
  function normalize(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    const ids = Array.isArray(value.ids) ? [...new Set(value.ids.filter(id => typeof id === 'string' && byId(id)))].slice(0, 6) : [];
    const draft = value.draft && typeof value.draft === 'object' ? value.draft : {};
    return { ids, draft: { name: typeof draft.name === 'string' ? draft.name.slice(0, 80) : '', email: typeof draft.email === 'string' ? draft.email.slice(0, 160) : '', brief: typeof draft.brief === 'string' ? draft.brief.slice(0, 1800) : '' } };
  }
  function read(storage) {
    try {
      const value = storage.getItem(KEY);
      if (!value) return { state: empty(), ok: true, recovered: false };
      try { return { state: normalize(JSON.parse(value)), ok: true, recovered: false }; }
      catch (_) { return { state: empty(), ok: true, recovered: true }; }
    } catch (_) { return { state: empty(), ok: false, recovered: false }; }
  }
  function write(storage, state) {
    try { storage.setItem(KEY, JSON.stringify(normalize(state))); return true; }
    catch (_) { return false; }
  }
  function clear(storage) { try { storage.removeItem(KEY); return true; } catch (_) { return false; } }
  function toggle(state, id) {
    const next = normalize(state);
    if (!byId(id)) return next;
    next.ids = next.ids.includes(id) ? next.ids.filter(x => x !== id) : [...next.ids, id];
    return next;
  }
  function validate(state) {
    const s = normalize(state), errors = {};
    if (!s.ids.length) errors.ids = 'Add at least one study to your shortlist.';
    if (!s.draft.name.trim()) errors.name = 'Enter a name for this local draft.';
    if (s.draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.draft.email.trim())) errors.email = 'Enter a complete email address or leave this field empty.';
    if (s.draft.brief.trim().length < 20) errors.brief = 'Describe your project in at least 20 characters.';
    return errors;
  }
  function shortlistText(state) {
    const s = normalize(state);
    return ['Offset Studio shortlist', '', ...s.ids.map((id,i) => `${String(i+1).padStart(2,'0')} ${byId(id).title} — ${byId(id).scope}`), '', 'All studies are fictional and self-initiated.'].join('\n');
  }
  function prepare(state) {
    const s = normalize(state), errors = validate(s);
    if (Object.keys(errors).length) return { ok: false, errors, text: '' };
    const lines = ['Offset Studio enquiry draft', '', `Name: ${s.draft.name.trim()}`];
    if (s.draft.email.trim()) lines.push(`Email: ${s.draft.email.trim()}`);
    lines.push('', 'Selected studies:', ...s.ids.map(id => `- ${byId(id).title} — ${byId(id).scope}`), '', 'Project brief:', s.draft.brief.trim(), '', 'Prepared locally. No enquiry has been sent.');
    return { ok: true, errors: {}, text: lines.join('\n') };
  }
  const core = { KEY, byId, empty, normalize, read, write, clear, toggle, validate, shortlistText, prepare };
  root.OffsetCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof window === 'undefined' ? globalThis : window);
