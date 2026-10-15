(function () {
  'use strict';
  const model = window.KilnBatch;
  const storageKey = 'kiln-notes.dry-batch.v1';
  const ids = ['batch-form', 'recipe', 'grams', 'note', 'recipe-error', 'grams-error', 'note-error', 'note-count', 'result-panel', 'version-label', 'result-status', 'empty-result', 'prepared-result', 'result-recipe', 'result-batch', 'result-quantities', 'result-total', 'result-note', 'keep', 'export', 'restore', 'reset', 'forget', 'action-help', 'storage-status'];
  const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  let state = model.create();
  let kept = null;
  let storageExists = false;
  let message = 'No kept copy in this browser.';
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      storageExists = true;
      const recovered = model.decodeKept(raw);
      if (recovered) {
        state = recovered;
        kept = model.snapshot(recovered);
        message = `Restored your kept ${kept.title} worksheet at ${kept.batchGrams} g, including its note.`;
      } else message = 'The kept copy could not be read. Your draft is ready; prepare a new sheet or forget the unreadable copy.';
    }
  } catch (_) {
    message = 'Browser storage could not be read. You can still prepare and download a worksheet.';
  }
  const link = new URL(window.location.href);
  const requestedRecipe = link.searchParams.get('recipe');
  const requestedGrams = link.searchParams.get('grams');
  if (requestedRecipe !== null || requestedGrams !== null) {
    const patch = {};
    if (requestedRecipe !== null && Object.prototype.hasOwnProperty.call(model.formulas, requestedRecipe)) patch.recipe = requestedRecipe;
    if (requestedGrams !== null) patch.grams = requestedGrams;
    state = model.edit(state, patch);
    message = kept ? `The exercise link set the draft inputs. Your kept ${kept.title} copy at ${kept.batchGrams} g is still available.` : 'The exercise link set your draft. Prepare the worksheet to see its quantities.';
    link.searchParams.delete('recipe');
    link.searchParams.delete('grams');
    try { window.history.replaceState(null, '', link); } catch (_) { /* The worksheet remains usable on file URLs. */ }
  }
  function syncFields() {
    for (const key of ['recipe', 'grams', 'note']) elements[key].value = state.input[key];
  }
  function render() {
    const current = model.isCurrent(state);
    for (const key of ['recipe', 'grams', 'note']) {
      elements[`${key}-error`].textContent = state.errors[key] || '';
      elements[key].setAttribute('aria-invalid', state.errors[key] ? 'true' : 'false');
    }
    elements['note-count'].textContent = `${state.input.note.length} / 300`;
    elements.keep.disabled = !current;
    elements.export.disabled = !current;
    elements.restore.disabled = !kept;
    elements.forget.disabled = !storageExists;
    elements['result-panel'].classList.toggle('is-current', current);
    elements['result-panel'].classList.toggle('is-stale', Boolean(state.sheet && !current));
    elements['empty-result'].hidden = Boolean(state.sheet);
    elements['prepared-result'].hidden = !state.sheet;
    if (state.sheet) {
      const sheet = state.sheet;
      elements['version-label'].textContent = `Version ${sheet.revision}`;
      elements['result-status'].textContent = current ? `Prepared ${sheet.title} at ${sheet.batchGrams} g · Current` : `Stale · Showing the last ${sheet.title} preparation at ${sheet.batchGrams} g. Prepare again to use your edits.`;
      elements['result-recipe'].textContent = sheet.title;
      elements['result-batch'].textContent = `${sheet.batchGrams} g`;
      elements['result-quantities'].replaceChildren(...sheet.ingredients.map(row => {
        const tr = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = row.label;
        const amount = document.createElement('td');
        amount.className = 'amount';
        amount.textContent = model.formatGrams(row.grams);
        const unit = document.createElement('td');
        unit.className = 'unit';
        unit.textContent = 'g';
        tr.append(label, amount, unit);
        return tr;
      }));
      elements['result-total'].textContent = model.formatGrams(sheet.totalGrams);
      elements['result-note'].textContent = sheet.note || 'No studio note';
    } else {
      elements['version-label'].textContent = 'Unprepared';
      elements['result-status'].textContent = Object.keys(state.errors).length ? 'Not prepared · Correct the marked fields to continue.' : 'Ready to prepare';
    }
    elements['action-help'].textContent = current ? 'Keep replaces the one saved copy. Download creates a text file of this current preparation.' : state.sheet ? 'Keeping and downloading are blocked while this sheet is stale. Prepare the current inputs again.' : 'Prepare a current worksheet to enable keeping and downloading.';
    elements['storage-status'].textContent = message;
  }
  for (const key of ['recipe', 'grams', 'note']) {
    elements[key].addEventListener('input', function () {
      state = model.edit(state, { [key]: elements[key].value });
      message = kept ? `Your kept ${kept.title} copy at ${kept.batchGrams} g is still available. These edits have not been kept.` : 'These edits have not been kept. Prepare and keep a version to recover it after reload.';
      render();
    });
  }
  elements['batch-form'].addEventListener('submit', function (event) {
    event.preventDefault();
    state = model.prepare(model.edit(state, { recipe: elements.recipe.value, grams: elements.grams.value, note: elements.note.value }));
    if (model.isCurrent(state)) message = kept ? 'Your current preparation is separate from the kept copy. Keep it to replace that copy.' : 'This preparation has not been kept. Keep it in this browser or download its text.';
    render();
    const firstError = ['recipe', 'grams', 'note'].find(key => state.errors[key]);
    if (firstError) elements[firstError].focus();
  });
  elements.keep.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    try {
      const copy = model.snapshot(state);
      localStorage.setItem(storageKey, JSON.stringify(copy));
      kept = copy;
      storageExists = true;
      message = `Kept ${kept.title} at ${kept.batchGrams} g, version ${kept.revision}. Reload restores these quantities and this note.`;
    } catch (_) {
      message = 'Keeping failed because browser storage is unavailable. Your current preparation is still here; download its text to keep a file.';
    }
    render();
  });
  elements.export.addEventListener('click', function () {
    if (!model.isCurrent(state)) return;
    try {
      const url = URL.createObjectURL(new Blob([model.text(state)], { type: 'text/plain;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kiln-notes-${state.sheet.recipe}-${state.sheet.batchGrams}g.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      message = `Text download requested for the current ${state.sheet.title} worksheet at ${state.sheet.batchGrams} g, including its prepared note.`;
    } catch (_) {
      message = 'This browser could not create the text download. Your prepared worksheet is still here.';
    }
    render();
  });
  elements.restore.addEventListener('click', function () {
    if (!kept) return;
    state = model.fromKept(kept);
    message = `Restored kept ${kept.title} at ${kept.batchGrams} g and discarded the draft edits.`;
    syncFields();
    render();
    elements.recipe.focus();
  });
  elements.reset.addEventListener('click', function () {
    state = model.create();
    message = kept ? `Worksheet reset to Ash no. 03 at 250 g. Your kept ${kept.title} copy remains available.` : 'Worksheet reset to Ash no. 03 at 250 g, with an empty note and no prepared result.';
    syncFields();
    render();
    elements.recipe.focus();
  });
  elements.forget.addEventListener('click', function () {
    try {
      localStorage.removeItem(storageKey);
      kept = null;
      storageExists = false;
      message = 'The kept copy was removed from this browser. Your current draft and preparation stay in place.';
    } catch (_) {
      message = 'The browser could not remove the kept copy. It may return after reload; your current worksheet stays in place.';
    }
    render();
  });
  syncFields();
  render();
})();
