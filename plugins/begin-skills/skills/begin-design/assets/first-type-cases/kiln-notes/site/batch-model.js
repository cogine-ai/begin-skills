(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KilnBatch = model;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const ingredients = Object.freeze(['Feldspar', 'Silica', 'Whiting', 'Kaolin']);
  const formulas = Object.freeze({
    'ash-03': Object.freeze({ title: 'Ash no. 03', parts: Object.freeze([40, 30, 20, 10]) }),
    'clay-07': Object.freeze({ title: 'Clay no. 07', parts: Object.freeze([30, 35, 15, 20]) })
  });
  const copy = object => JSON.parse(JSON.stringify(object));
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function create() {
    return { input: { recipe: 'ash-03', grams: '250', note: '' }, sheet: null, edited: false, errors: {}, serial: 0 };
  }
  function validate(input) {
    const errors = {};
    const recipe = String(input.recipe);
    const raw = String(input.grams).trim();
    const grams = Number(raw);
    const note = String(input.note);
    if (!has(formulas, recipe)) errors.recipe = 'Choose Ash no. 03 or Clay no. 07.';
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(grams)) errors.grams = 'Enter a whole number of grams, such as 250.';
    else if (grams < 50 || grams > 5000) errors.grams = 'Use a dry batch from 50 to 5000 g.';
    if (note.length > 300) errors.note = 'Shorten the studio note to 300 characters or fewer.';
    return { errors, recipe, grams, note };
  }
  function edit(state, patch) {
    const next = copy(state);
    let changed = false;
    for (const key of ['recipe', 'grams', 'note']) {
      if (has(patch, key) && String(patch[key]) !== next.input[key]) {
        next.input[key] = String(patch[key]);
        changed = true;
      }
    }
    if (changed && next.sheet) next.edited = true;
    if (changed) next.errors = {};
    return next;
  }
  function makeSheet(checked, revision) {
    const formula = formulas[checked.recipe];
    return {
      schema: 1, revision, recipe: checked.recipe, title: formula.title, batchGrams: checked.grams,
      note: checked.note,
      ingredients: ingredients.map((label, index) => ({ label, parts: formula.parts[index], grams: checked.grams * formula.parts[index] / 100 })),
      totalGrams: checked.grams
    };
  }
  function prepare(state) {
    const next = copy(state);
    const checked = validate(next.input);
    next.errors = checked.errors;
    if (Object.keys(checked.errors).length) {
      if (next.sheet) next.edited = true;
      return next;
    }
    next.serial += 1;
    next.sheet = makeSheet(checked, next.serial);
    next.edited = false;
    return next;
  }
  function isCurrent(state) {
    return Boolean(state.sheet && !state.edited && Object.keys(state.errors).length === 0);
  }
  function snapshot(state) {
    if (!isCurrent(state)) throw new Error('Prepare the current inputs before keeping or downloading.');
    return copy(state.sheet);
  }
  function fromKept(value) {
    if (!value || value.schema !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || typeof value.note !== 'string' || !Number.isInteger(value.batchGrams)) return null;
    const input = { recipe: value.recipe, grams: String(value.batchGrams), note: value.note };
    const checked = validate(input);
    if (Object.keys(checked.errors).length) return null;
    const canonical = makeSheet(checked, value.revision);
    if (value.title !== canonical.title || value.totalGrams !== canonical.totalGrams || JSON.stringify(value.ingredients) !== JSON.stringify(canonical.ingredients)) return null;
    return { input, sheet: canonical, edited: false, errors: {}, serial: canonical.revision };
  }
  function decodeKept(raw) {
    try { return fromKept(JSON.parse(raw)); } catch (_) { return null; }
  }
  function formatGrams(value) {
    return Number(value.toFixed(2)).toString();
  }
  function text(state) {
    const sheet = snapshot(state);
    return [
      'KILN NOTES', 'Dry batch worksheet', '',
      `Recipe: ${sheet.title}`, `Dry batch: ${sheet.batchGrams} g`, `Prepared version: ${sheet.revision}`, '',
      ...sheet.ingredients.map(row => `${row.label}: ${formatGrams(row.grams)} g (${row.parts} parts)`),
      `Total: ${formatGrams(sheet.totalGrams)} g`, '',
      'Studio note:', sheet.note || '(No studio note)', '',
      'Illustrative arithmetic from a fictional 100-part formula.',
      'No firing schedule or tested materials claim.', ''
    ].join('\n');
  }
  return Object.freeze({ formulas, ingredients, create, validate, edit, prepare, isCurrent, snapshot, fromKept, decodeKept, formatGrams, text });
});
