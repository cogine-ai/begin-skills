(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WavebenchModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'wavebench.setup.v1';
  const FIELDS = ['title', 'amplitude', 'frequency', 'phase', 'offset', 'note'];
  const FIXTURE = Object.freeze({ title: 'A slow double cycle', amplitude: '0.8', frequency: '2', phase: '0', offset: '0', note: 'Explore the shape, then keep the complete setup.' });
  const LIMITS = Object.freeze({ amplitude: [0, 1, 'Amplitude', '0 to 1'], frequency: [0.5, 8, 'Frequency', '0.5 to 8 Hz'], phase: [-180, 180, 'Phase', '−180 to 180 degrees'], offset: [-1, 1, 'Offset', '−1 to 1'] });
  function validate(input) {
    const errors = {}, parameters = {};
    if (typeof input.title !== 'string' || !input.title.trim()) errors.title = 'Give this signal a name.';
    if (typeof input.note !== 'string') errors.note = 'Use text for the note.';
    for (const [key, rule] of Object.entries(LIMITS)) {
      const raw = typeof input[key] === 'string' ? input[key].trim() : '';
      if (!raw) errors[key] = `${rule[2]} needs a number (${rule[3]}).`;
      else if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw))) errors[key] = `${rule[2]} needs a decimal number, such as ${key === 'frequency' ? '2.5' : '0.5'}.`;
      else if (Number(raw) < rule[0] || Number(raw) > rule[1]) errors[key] = `${rule[2]} must be ${rule[3]}.`;
      else parameters[key] = Number(raw);
    }
    return { ok: Object.keys(errors).length === 0, errors, parameters };
  }
  function valueAt(parameters, t) {
    return parameters.offset + parameters.amplitude * Math.sin(2 * Math.PI * parameters.frequency * t + parameters.phase * Math.PI / 180);
  }
  function fixed(value) {
    const result = value.toFixed(6);
    return Number(result) === 0 ? '0.000000' : result;
  }
  function samples(parameters) {
    return Array.from({ length: 16 }, (_, i) => ({ i, t: i / 16, y: valueAt(parameters, i / 16) }));
  }
  function exactText(input, parameters, rows) {
    return [
      'WAVEBENCH — Signal setup',
      `Title: ${input.title}`,
      'Duration: 1 second',
      `Amplitude A: ${parameters.amplitude} (unitless)`,
      `Frequency f: ${parameters.frequency} Hz`,
      `Phase φ: ${parameters.phase} degrees`,
      `Offset b: ${parameters.offset} (unitless)`,
      'Formula: y(t) = b + A × sin(2π × f × t + φ × π / 180)',
      'Note:', input.note, '',
      'Samples: 16, t = i / 16 seconds, i = 0…15',
      'i\tt (seconds)\ty (unitless)',
      ...rows.map(row => `${String(row.i).padStart(2, '0')}\t${fixed(row.t)}\t${fixed(row.y)}`),
      ''
    ].join('\n');
  }
  function snapshot(input) {
    const checked = validate(input);
    if (!checked.ok) throw new Error('Invalid signal input');
    const inputs = Object.fromEntries(FIELDS.map(key => [key, input[key]]));
    const rows = samples(checked.parameters);
    return { inputs, parameters: checked.parameters, samples: rows, text: exactText(inputs, checked.parameters, rows) };
  }
  function decode(raw) {
    try {
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.inputs || FIELDS.some(key => typeof saved.inputs[key] !== 'string')) return null;
      const record = snapshot(saved.inputs);
      return saved.text === record.text ? record : null;
    } catch (_) { return null; }
  }
  function encode(record) { return JSON.stringify({ version: 1, inputs: record.inputs, text: record.text }); }
  function readStored(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return { status: 'empty', record: null };
      const record = decode(raw);
      return { status: record ? 'available' : 'corrupt', record };
    } catch (_) { return { status: 'denied', record: null }; }
  }
  function writeStored(storage, record) {
    try {
      const text = encode(record);
      storage.setItem(KEY, text);
      if (storage.getItem(KEY) !== text) return { ok: false };
      return { ok: true };
    } catch (_) { return { ok: false }; }
  }
  function forgetStored(storage) {
    try { storage.removeItem(KEY); return { ok: storage.getItem(KEY) === null }; }
    catch (_) { return { ok: false }; }
  }
  class Session {
    constructor() { this.inputs = { ...FIXTURE }; this.prepared = null; this.stale = false; }
    edit(key, value) {
      if (!FIELDS.includes(key)) throw new Error('Unknown field');
      this.inputs[key] = String(value);
      if (this.prepared) this.stale = true;
    }
    reset() { this.inputs = { ...FIXTURE }; if (this.prepared) this.stale = true; }
    prepare() {
      const result = validate(this.inputs);
      if (!result.ok) return result;
      this.prepared = snapshot(this.inputs); this.stale = false;
      return { ok: true, record: this.prepared };
    }
    canUse() { return Boolean(this.prepared && !this.stale && validate(this.inputs).ok); }
    recover(record) {
      const checked = decode(encode(record));
      if (!checked) return false;
      this.inputs = { ...checked.inputs }; this.prepared = checked; this.stale = false; return true;
    }
  }
  function coordinates(parameters, steps = 256) {
    return Array.from({ length: steps + 1 }, (_, i) => ({ x: i / steps * 1000, y: (2 - valueAt(parameters, i / steps)) / 4 * 400 }));
  }
  return { KEY, FIELDS, FIXTURE, LIMITS, validate, valueAt, fixed, samples, snapshot, exactText, decode, encode, readStored, writeStored, forgetStored, Session, coordinates };
});
