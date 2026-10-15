(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.SundayWorksheet = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const recipeId = 'lemon-olive-oil-cake';
  const title = 'Lemon & olive oil cake';
  const base = Object.freeze([
    { name: 'Flour', amount: 180, unit: 'g' },
    { name: 'Sugar', amount: 120, unit: 'g' },
    { name: 'Olive oil', amount: 100, unit: 'mL' },
    { name: 'Milk', amount: 80, unit: 'mL' },
    { name: 'Lemon juice', amount: 40, unit: 'mL' },
    { name: 'Eggs', amount: 2, unit: 'whole' }
  ]);
  const copy = value => JSON.parse(JSON.stringify(value));
  function validate(raw) {
    const value = String(raw).trim();
    if (!value) return { error: 'Enter an even number of servings from 2 to 12.' };
    if (!/^\d+$/.test(value)) return { error: 'Use a whole number, such as 4 or 8. Fractions and words cannot be prepared.' };
    const servings = Number(value);
    if (!Number.isSafeInteger(servings) || servings < 2 || servings > 12) return { error: 'Choose a number from 2 to 12: 2, 4, 6, 8, 10 or 12.' };
    if (servings % 2) return { error: 'Choose an even number: 2, 4, 6, 8, 10 or 12. This keeps the eggs whole.' };
    return { servings };
  }
  function create() {
    return { input: { servings: '4', note: '' }, prepared: null, dirty: false, error: '' };
  }
  function edit(state, patch) {
    const next = copy(state);
    const changed = Object.keys(patch).some(key => next.input[key] !== String(patch[key]));
    for (const key of ['servings', 'note']) if (Object.hasOwn(patch, key)) next.input[key] = String(patch[key]);
    if (changed && next.prepared) next.dirty = true;
    next.error = '';
    return next;
  }
  function prepare(state) {
    const next = copy(state);
    const checked = validate(next.input.servings);
    if (checked.error) {
      next.error = checked.error;
      if (next.prepared) next.dirty = true;
      return next;
    }
    next.prepared = {
      version: 1, recipeId, title, servings: checked.servings,
      note: next.input.note,
      ingredients: base.map(row => ({ ...row, amount: row.amount * checked.servings / 4 }))
    };
    next.dirty = false;
    next.error = '';
    return next;
  }
  function isCurrent(state) {
    return Boolean(state.prepared && !state.dirty && !state.error);
  }
  function snapshot(state) {
    if (!isCurrent(state)) throw new Error('Prepare the current inputs before keeping or downloading.');
    return copy(state.prepared);
  }
  function fromKept(value) {
    if (!value || value.version !== 1 || value.recipeId !== recipeId || !Number.isInteger(value.servings) || typeof value.note !== 'string' || value.note.length > 400 || validate(value.servings).error) return null;
    let next = edit(create(), { servings: String(value.servings), note: value.note });
    return prepare(next);
  }
  function decodeKept(raw) {
    try { return fromKept(JSON.parse(raw)); } catch { return null; }
  }
  function text(state) {
    const sheet = snapshot(state);
    const lines = [
      'SUNDAY TABLE / INGREDIENT WORKSHEET', sheet.title,
      `${sheet.servings} servings`, '',
      ...sheet.ingredients.map(row => `${row.name}: ${row.amount} ${row.unit === 'whole' ? 'whole eggs' : row.unit}`)
    ];
    if (sheet.note) lines.push('', 'YOUR TABLE NOTE', sheet.note);
    lines.push('', 'Illustrative ingredient list. Not kitchen-tested.', 'No baking method is provided.', 'Scaled from the base quantities for 4 servings.');
    return lines.join('\n') + '\n';
  }
  return Object.freeze({ base, title, recipeId, validate, create, edit, prepare, isCurrent, snapshot, fromKept, decodeKept, text });
});
