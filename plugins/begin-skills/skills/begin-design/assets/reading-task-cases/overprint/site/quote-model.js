(function (root, factory) {
  'use strict';
  var model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.OverprintQuote = model;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STORAGE_KEY = 'overprint.edition.v1';
  var FILE_NAME = 'overprint-edition-estimate.txt';
  var FIXTURE = Object.freeze({title: 'A small weather atlas', quantity: '120', colors: '2', stock: 'heavy', note: 'Estimate only; confirm the artwork before printing.'});
  function copyInput(input) {
    return {title: input.title, quantity: input.quantity, colors: input.colors, stock: input.stock, note: input.note};
  }
  function money(cents) {
    if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Money must be nonnegative whole cents.');
    return '$' + Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
  }
  function validate(input) {
    var errors = {};
    if (!input || typeof input !== 'object') return {valid: false, errors: {title: 'Enter a project title.'}};
    if (typeof input.title !== 'string' || !input.title.trim()) errors.title = 'Enter a project title.';
    if (typeof input.quantity !== 'string' || !/^\d+$/.test(input.quantity.trim())) {
      errors.quantity = 'Enter a whole quantity from 60 to 2,000.';
    } else if (Number(input.quantity.trim()) < 60 || Number(input.quantity.trim()) > 2000) {
      errors.quantity = 'Choose a quantity from 60 to 2,000.';
    }
    if (typeof input.colors !== 'string' || !/^[1-3]$/.test(input.colors)) errors.colors = 'Choose 1, 2 or 3 colors.';
    if (input.stock !== 'standard' && input.stock !== 'heavy') errors.stock = 'Choose standard or heavy stock.';
    if (typeof input.note !== 'string') errors.note = 'Use text for the note, or leave it empty.';
    return {valid: Object.keys(errors).length === 0, errors: errors};
  }
  function calculate(input) {
    if (!validate(input).valid) throw new Error('The edition details are invalid.');
    var quantity = Number(input.quantity.trim());
    var colors = Number(input.colors);
    var rate = 18 + 7 * colors + (input.stock === 'heavy' ? 10 : 0);
    var studio = 2500;
    var setup = 1200 * colors;
    var print = quantity * rate;
    return {quantity: quantity, colors: colors, stock: input.stock, rateCents: rate, studioCents: studio, setupCents: setup, printCents: print, totalCents: studio + setup + print};
  }
  function exactText(input, quote) {
    return [
      'OVERPRINT — Edition estimate',
      'Project: ' + input.title,
      'Quantity: ' + quote.quantity + ' copies',
      'Colors: ' + quote.colors,
      'Stock: ' + (quote.stock === 'heavy' ? 'Heavy' : 'Standard'),
      'Print rate: ' + money(quote.rateCents) + ' per copy',
      'Studio fee: ' + money(quote.studioCents),
      'Color setup: ' + quote.colors + ' × $12.00 = ' + money(quote.setupCents),
      'Print subtotal: ' + quote.quantity + ' × ' + money(quote.rateCents) + ' = ' + money(quote.printCents),
      'Total: ' + money(quote.totalCents) + ' USD',
      'Note: ' + (input.note || '(none)'),
      ''
    ].join('\n');
  }
  function makePrepared(input) {
    var quote = calculate(input);
    return {input: copyInput(input), quote: quote, text: exactText(input, quote)};
  }
  function copyPrepared(prepared) {
    if (!prepared) return null;
    return {input: copyInput(prepared.input), quote: Object.assign({}, prepared.quote), text: prepared.text};
  }
  function createState() { return {input: copyInput(FIXTURE), prepared: null, stale: false, kept: null}; }
  function edit(state, input) {
    return Object.assign({}, state, {input: copyInput(input), stale: Boolean(state.prepared)});
  }
  function prepare(state) {
    var result = validate(state.input);
    if (!result.valid) return {ok: false, errors: result.errors, state: state};
    return {ok: true, errors: {}, state: Object.assign({}, state, {prepared: makePrepared(state.input), stale: false})};
  }
  function canUsePrepared(state) { return Boolean(state.prepared && !state.stale && validate(state.input).valid); }
  function keep(state) {
    if (!canUsePrepared(state)) return {ok: false, state: state};
    return {ok: true, state: Object.assign({}, state, {kept: copyPrepared(state.prepared)})};
  }
  function recover(state) {
    if (!state.kept) return {ok: false, state: state};
    return {ok: true, state: Object.assign({}, state, {input: copyInput(state.kept.input), prepared: copyPrepared(state.kept), stale: false})};
  }
  function reset(state) { return Object.assign({}, state, {input: copyInput(FIXTURE), prepared: null, stale: false}); }
  function forget(state) { return Object.assign({}, state, {kept: null}); }
  function serialize(prepared) {
    var expected = makePrepared(prepared.input);
    if (expected.text !== prepared.text || JSON.stringify(expected.quote) !== JSON.stringify(prepared.quote)) throw new Error('Prepared estimate does not match its fields.');
    return JSON.stringify({version: 1, prepared: expected});
  }
  function parseKept(serialized) {
    try {
      var value = JSON.parse(serialized);
      if (!value || value.version !== 1 || !value.prepared || !validate(value.prepared.input).valid) return {ok: false};
      var expected = makePrepared(value.prepared.input);
      if (value.prepared.text !== expected.text || JSON.stringify(value.prepared.quote) !== JSON.stringify(expected.quote)) return {ok: false};
      return {ok: true, prepared: expected};
    } catch (error) { return {ok: false}; }
  }
  return {STORAGE_KEY: STORAGE_KEY, FILE_NAME: FILE_NAME, FIXTURE: FIXTURE, money: money, validate: validate, calculate: calculate, exactText: exactText, makePrepared: makePrepared, createState: createState, edit: edit, prepare: prepare, canUsePrepared: canUsePrepared, keep: keep, recover: recover, reset: reset, forget: forget, serialize: serialize, parseKept: parseKept};
}));
