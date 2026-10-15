(function () {
  'use strict';
  const model = window.ProofnoteModel;
  const key = 'proofnote-reading-v1';
  const warning = document.getElementById('storage-warning');
  const status = document.getElementById('operation-status');
  const undoButton = document.getElementById('undo-change');
  const drafts = {};
  let feedbackMessage = '';
  let storageMode = 'ready';
  let state = model.fresh();
  try {
    const raw = window.localStorage.getItem(key);
    try { state = model.parse(raw); }
    catch (_) {
      storageMode = 'damaged';
      warning.textContent = 'Your saved sample could not be read and remains untouched. New notes can be kept on this page. Choose Reset notes to start clean local storage.';
    }
  } catch (_) {
    storageMode = 'unavailable';
    warning.textContent = 'Browser storage is unavailable. You can keep notes on this page, but they will be lost when you reload. This browser is the only copy.';
  }
  const queryPassage = new URLSearchParams(window.location.search).get('passage');
  if (model.ids.includes(queryPassage)) state.selected = queryPassage;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function announce(message) {
    feedbackMessage = message;
    status.textContent = message;
    const nearby = document.querySelector('.note-inline-status');
    if (nearby) nearby.textContent = message;
  }
  function persist() {
    try { window.history.replaceState(null, '', `${window.location.pathname}?passage=${state.selected}`); }
    catch (_) { /* Local note persistence does not depend on address-bar updates. */ }
    if (storageMode !== 'ready') return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch (_) {
      storageMode = 'unavailable';
      warning.textContent = 'Your latest change could not be saved in this browser. The current notes are kept on this page; reload may restore older saved notes. Copy any new wording you want to keep.';
      warning.hidden = false;
      return false;
    }
  }
  function savedNote(id, note) {
    const card = element('div', 'saved-note');
    card.append(element('div', 'note-label', `Your note · ${model.labels[id]}`));
    card.append(element('p', 'note-text', note.text));
    const row = element('div', 'note-actions');
    const time = new Date(note.updatedAt);
    const localTime = time.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
    const meta = element('span', 'saved-meta', `${storageMode === 'ready' ? 'Saved in this browser' : 'Kept on this page'} · ${localTime}`);
    meta.title = time.toLocaleString();
    row.append(meta);
    const actions = element('div', 'action-links');
    for (const action of ['edit', 'delete']) {
      const button = element('button', '', action === 'edit' ? 'Edit' : 'Delete');
      button.type = 'button';
      button.dataset.noteAction = action;
      button.dataset.passage = id;
      button.setAttribute('aria-label', `${action === 'edit' ? 'Edit' : 'Delete'} your note on ${model.labels[id]}`);
      actions.append(button);
    }
    row.append(actions);
    card.append(row);
    return card;
  }
  function noteForm(id) {
    const draft = drafts[id] || { text: '', editing: false };
    drafts[id] = draft;
    const form = element('form', 'note-form');
    form.dataset.formPassage = id;
    form.noValidate = true;
    const label = element('label', '', `Your note on ${model.labels[id]}`);
    label.htmlFor = `note-${id}`;
    const input = element('textarea');
    input.id = `note-${id}`;
    input.name = 'note';
    input.rows = 3;
    input.maxLength = 600;
    input.required = true;
    input.placeholder = 'What does this sentence make you think?';
    input.value = draft.text;
    input.setAttribute('aria-describedby', `hint-${id} error-${id} draft-${id}`);
    const hint = element('div', 'note-hint');
    hint.id = `hint-${id}`;
    hint.append(element('span', '', storageMode === 'ready' ? '1–600 characters. Save to keep it after reload.' : '1–600 characters. Kept on this page only.'));
    const counter = element('span', 'counter', `${draft.text.length} / 600`);
    counter.setAttribute('aria-hidden', 'true');
    hint.append(counter);
    const error = element('p', 'note-error');
    error.id = `error-${id}`;
    error.setAttribute('role', 'alert');
    const actions = element('div', 'form-actions');
    const save = element('button', 'button', draft.editing ? 'Save changes' : 'Save note');
    save.type = 'submit';
    save.append(element('span', '', '↳'));
    save.lastElementChild.setAttribute('aria-hidden', 'true');
    const cancel = element('button', 'cancel-edit', draft.editing ? 'Cancel edit' : 'Clear draft');
    cancel.type = 'button';
    cancel.dataset.noteAction = 'cancel';
    cancel.dataset.passage = id;
    actions.append(save, cancel);
    const draftState = element('p', 'draft-state', draft.text ? (draft.editing ? 'Unsaved edit · the saved note stays unchanged until you save' : 'Unsaved note · choose Save note when you are ready') : '');
    draftState.id = `draft-${id}`;
    input.addEventListener('input', () => {
      drafts[id].text = input.value;
      counter.textContent = `${input.value.length} / 600`;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      draftState.textContent = input.value ? (draft.editing ? 'Unsaved edit · the saved note stays unchanged until you save' : 'Unsaved note · choose Save note when you are ready') : '';
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const clean = input.value.trim();
      if (!clean || clean.length > 600) {
        error.textContent = 'Write a note of 1–600 characters, then choose Save note.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      const wasEdit = Boolean(state.notes[id]);
      state = model.change(state, 'save', id, clean);
      delete drafts[id];
      const saved = persist();
      render();
      announce(`${wasEdit ? 'Updated' : 'Saved'} your note on ${model.labels[id]}${saved ? ' in this browser.' : ' for this page only.'} You can edit it or undo this change.`);
      document.querySelector(`[data-notes="${id}"] [data-note-action="edit"]`).focus({ preventScroll: true });
    });
    form.append(label, input, hint, error, actions, draftState);
    return form;
  }
  function render() {
    warning.hidden = storageMode === 'ready';
    const count = Object.keys(state.notes).length;
    document.getElementById('note-count').textContent = `${count} ${storageMode === 'ready' ? 'saved ' : 'page '}${count === 1 ? 'note' : 'notes'}`;
    undoButton.hidden = !state.undo;
    if (state.undo) undoButton.setAttribute('aria-label', `Undo: ${state.undo.operation}`);
    for (const button of document.querySelectorAll('[data-select]')) button.setAttribute('aria-pressed', String(button.dataset.select === state.selected));
    for (const id of model.ids) {
      const slot = document.querySelector(`[data-notes="${id}"]`);
      const active = id === state.selected;
      slot.classList.toggle('is-active', active);
      slot.replaceChildren();
      if (state.notes[id] && !(active && drafts[id]?.editing)) slot.append(savedNote(id, state.notes[id]));
      if (active && (!state.notes[id] || drafts[id]?.editing)) {
        if (!state.notes[id] && !drafts[id]?.text) slot.append(element('p', 'note-empty', 'Keep a thought with this sentence.'));
        slot.append(noteForm(id));
      }
      if (active) {
        const recovery = element('div', 'inline-recovery');
        recovery.append(element('p', 'note-inline-status', feedbackMessage));
        if (state.undo) recovery.append(undoButton);
        slot.append(recovery);
      }
    }
  }
  function select(id, moveToPassage) {
    const old = state.selected;
    state.selected = id;
    persist();
    render();
    const draftMessage = old !== id && drafts[old]?.text ? ` Your draft on ${model.labels[old]} stays on this page.` : '';
    announce(`${model.labels[id]} selected.${draftMessage}`);
    if (moveToPassage) {
      const passage = document.getElementById(`passage-${id}`);
      passage.focus({ preventScroll: true });
      passage.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }
  document.addEventListener('click', (event) => {
    const selection = event.target.closest('[data-select]');
    if (selection) { select(selection.dataset.select, true); return; }
    const action = event.target.closest('[data-note-action]');
    if (!action) return;
    const id = action.dataset.passage;
    if (action.dataset.noteAction === 'edit' && state.notes[id]) {
      state.selected = id;
      drafts[id] = { text: state.notes[id].text, editing: true };
      persist();
      render();
      announce(`Editing your note on ${model.labels[id]}. Save changes to keep the new wording.`);
      document.getElementById(`note-${id}`).focus({ preventScroll: true });
    } else if (action.dataset.noteAction === 'delete' && state.notes[id]) {
      state = model.change(state, 'delete', id);
      delete drafts[id];
      persist();
      render();
      announce(`Deleted your note on ${model.labels[id]}. Undo last change restores it.`);
      document.getElementById(`note-${id}`).focus({ preventScroll: true });
    } else if (action.dataset.noteAction === 'cancel') {
      const editing = Boolean(drafts[id]?.editing);
      delete drafts[id];
      render();
      announce(editing ? `Cancelled the edit on ${model.labels[id]}. Your saved note is unchanged.` : `Cleared the unsaved draft on ${model.labels[id]}.`);
      const target = document.getElementById(`note-${id}`) || document.querySelector(`[data-notes="${id}"] [data-note-action="edit"]`);
      target.focus({ preventScroll: true });
    }
  });
  undoButton.addEventListener('click', () => {
    if (!state.undo) return;
    const operation = state.undo.operation;
    state = model.undo(state);
    for (const id of model.ids) delete drafts[id];
    persist();
    render();
    announce(`Undid: ${operation.charAt(0).toLowerCase() + operation.slice(1)}. Your previous notes are restored.`);
    document.getElementById(`passage-${state.selected}`).focus({ preventScroll: true });
  });
  document.getElementById('reset-notes').addEventListener('click', () => {
    state = model.change(state, 'reset');
    for (const id of model.ids) delete drafts[id];
    if (storageMode !== 'ready') {
      try { window.localStorage.removeItem(key); storageMode = 'ready'; }
      catch (_) {
        storageMode = 'unavailable';
        warning.textContent = 'Browser storage is unavailable. Reset changed this page only. Notes on this page will be lost when you reload.';
      }
    }
    persist();
    render();
    announce(`Reset all Proofnote notes${storageMode === 'ready' ? ' in this browser' : ' on this page'}. Passage 1 is selected. Undo last change restores readable notes from before the reset.`);
    undoButton.focus({ preventScroll: true });
    undoButton.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
  render();
  if (Object.keys(state.notes).length) announce('Your saved notes are back with their passages. Choose a sentence to continue.');
})();
