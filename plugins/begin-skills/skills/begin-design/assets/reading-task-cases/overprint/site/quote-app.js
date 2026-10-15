(function () {
  'use strict';
  var model = window.OverprintQuote;
  var state = model.createState();
  var ids = {title: 'project-title', quantity: 'quantity', colors: 'colors', stock: 'stock', note: 'note'};
  var fieldNames = Object.keys(ids);
  var storageIssue = false;
  var storageMessage = '';
  var showRecoveryOffer = false;
  function el(id) { return document.getElementById(id); }
  function readInput() {
    var input = {};
    fieldNames.forEach(function (name) { input[name] = el(ids[name]).value; });
    return input;
  }
  function writeInput() { fieldNames.forEach(function (name) { el(ids[name]).value = state.input[name]; }); }
  function say(id, message) { el(id).textContent = message; }
  function renderValidation() {
    var check = model.validate(state.input);
    fieldNames.forEach(function (name) {
      var error = check.errors[name] || '';
      var target = el(ids[name] + '-error');
      if (target) target.textContent = error;
      el(ids[name]).setAttribute('aria-invalid', error ? 'true' : 'false');
    });
    el('prepare').disabled = !check.valid;
    return check.valid;
  }
  function renderResult() {
    var prepared = state.prepared;
    var ready = model.canUsePrepared(state);
    el('download').disabled = !ready;
    el('keep').disabled = !ready;
    el('result-empty').hidden = Boolean(prepared);
    el('result-content').hidden = !prepared;
    el('prepared-result').setAttribute('aria-labelledby', prepared ? 'result-project' : 'result-heading');
    var status = !prepared ? 'Not prepared' : state.stale ? 'Out of date' : 'Ready';
    say('result-status', status);
    el('result-status').dataset.state = !prepared ? 'empty' : state.stale ? 'stale' : 'ready';
    if (prepared) {
      var q = prepared.quote;
      say('result-project', prepared.input.title);
      say('result-quantity', q.quantity + ' copies');
      say('result-colors', q.colors + (q.colors === 1 ? ' color' : ' colors'));
      say('result-stock', q.stock === 'heavy' ? 'Heavy' : 'Standard');
      say('result-rate', model.money(q.rateCents));
      say('result-studio', model.money(q.studioCents));
      say('result-setup-detail', q.colors + ' × $12.00');
      say('result-setup', model.money(q.setupCents));
      say('result-print-detail', q.quantity + ' × ' + model.money(q.rateCents));
      say('result-print', model.money(q.printCents));
      say('result-total', model.money(q.totalCents));
      say('result-note', prepared.input.note || 'No note added.');
      say('exact-text', prepared.text);
    } else {
      say('exact-text', '');
    }
    el('recover').disabled = !state.kept;
    el('forget').disabled = !state.kept && !storageIssue;
    el('recovery-banner').hidden = !state.kept || !showRecoveryOffer;
  }
  function render() { renderValidation(); renderResult(); }
  function changed() {
    state = model.edit(state, readInput());
    var valid = model.validate(state.input).valid;
    render();
    say('form-feedback', valid ? '' : 'Check the marked fields before preparing.');
    say('output-feedback', state.prepared ? 'The displayed estimate is out of date. Prepare again before keeping or downloading.' : 'Prepare an estimate to enable these actions.');
  }
  fieldNames.forEach(function (name) { el(ids[name]).addEventListener('input', changed); });
  el('quote-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var current = readInput();
    if (JSON.stringify(current) !== JSON.stringify(state.input)) state = model.edit(state, current);
    var outcome = model.prepare(state);
    state = outcome.state;
    render();
    if (!outcome.ok) {
      say('form-feedback', 'Check the marked fields before preparing.');
      var first = Object.keys(outcome.errors)[0];
      if (first) el(ids[first]).focus();
      return;
    }
    say('form-feedback', '');
    say('output-feedback', 'Estimate prepared: ' + model.money(state.prepared.quote.totalCents) + ' USD. Ready to download or keep.');
  });
  el('keep').addEventListener('click', function () {
    if (!model.canUsePrepared(state)) return;
    try {
      window.localStorage.setItem(model.STORAGE_KEY, model.serialize(state.prepared));
      state = model.keep(state).state;
      showRecoveryOffer = false;
      storageIssue = false;
      storageMessage = 'This prepared estimate is kept on this device. It replaced any earlier OVERPRINT copy.';
    } catch (error) {
      storageMessage = 'This browser could not keep the estimate. Your prepared ticket is still here; download the text for a copy.';
    }
    render();
    say('storage-feedback', storageMessage);
    say('output-feedback', storageMessage);
  });
  el('download').addEventListener('click', function () {
    if (!model.canUsePrepared(state)) return;
    var objectUrl;
    try {
      var file = new Blob([state.prepared.text], {type: 'text/plain;charset=utf-8'});
      objectUrl = URL.createObjectURL(file);
      var link = document.createElement('a');
      link.href = objectUrl;
      link.download = model.FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
      say('output-feedback', 'Text download requested: ' + model.FILE_NAME + '.');
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      say('output-feedback', 'The browser could not start the download. Open the exact download text above and copy it.');
    }
  });
  el('recover').addEventListener('click', function () {
    var outcome = model.recover(state);
    if (!outcome.ok) return;
    state = outcome.state;
    showRecoveryOffer = false;
    writeInput();
    render();
    say('form-feedback', '');
    say('output-feedback', 'Kept estimate recovered with its exact fields and prepared text.');
    say('storage-feedback', 'Your kept edition is open. Recovery replaced the earlier fields at this desk.');
  });
  el('reset').addEventListener('click', function () {
    state = model.reset(state);
    showRecoveryOffer = false;
    writeInput();
    render();
    say('form-feedback', '');
    say('output-feedback', 'Atlas example restored. Prepare it to create the $99.40 estimate.');
    say('storage-feedback', state.kept ? 'Your kept copy is still available to recover.' : storageMessage);
  });
  el('forget').addEventListener('click', function () {
    try {
      window.localStorage.removeItem(model.STORAGE_KEY);
      state = model.forget(state);
      showRecoveryOffer = false;
      storageIssue = false;
      storageMessage = 'The kept OVERPRINT estimate was forgotten. The current fields and ticket are unchanged.';
    } catch (error) {
      storageMessage = 'This browser could not forget the kept copy. Your current fields and known kept copy are still available.';
    }
    render();
    say('storage-feedback', storageMessage);
  });
  try {
    var saved = window.localStorage.getItem(model.STORAGE_KEY);
    if (saved !== null) {
      var loaded = model.parseKept(saved);
      if (loaded.ok) {
        state.kept = loaded.prepared;
        showRecoveryOffer = true;
        storageMessage = 'A kept copy is available. Recover it when you want to replace the current fields.';
      } else {
        storageIssue = true;
        storageMessage = 'The kept copy could not be read. Your fields are untouched. You can forget that copy or prepare a new one.';
      }
    }
  } catch (error) {
    storageMessage = 'This browser does not allow access to kept estimates. You can still prepare and download text.';
  }
  render();
  say('storage-feedback', storageMessage);
}());
