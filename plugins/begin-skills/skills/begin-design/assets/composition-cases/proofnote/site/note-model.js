(function (root) {
  'use strict';
  const ids = ['pause', 'welcome', 'seat'];
  const labels = { pause: 'Passage 1', welcome: 'Passage 2', seat: 'Passage 3' };
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const fresh = () => ({ version: 1, selected: 'pause', notes: {}, undo: null });
  function validNotes(notes) {
    if (!notes || typeof notes !== 'object' || Array.isArray(notes)) throw new Error('Invalid notes');
    const result = {};
    for (const [id, note] of Object.entries(notes)) {
      if (!ids.includes(id) || !note || typeof note.text !== 'string' || !note.text.trim() || note.text.length > 600 || typeof note.updatedAt !== 'string' || !Number.isFinite(Date.parse(note.updatedAt))) throw new Error('Invalid note');
      result[id] = { text: note.text, updatedAt: note.updatedAt };
    }
    return result;
  }
  function parse(raw) {
    if (raw === null) return fresh();
    const input = JSON.parse(raw);
    if (!input || input.version !== 1 || !ids.includes(input.selected)) throw new Error('Invalid saved sample');
    const state = { version: 1, selected: input.selected, notes: validNotes(input.notes), undo: null };
    if (input.undo !== null && input.undo !== undefined) {
      const undo = input.undo;
      if (!undo || !ids.includes(undo.selected) || typeof undo.operation !== 'string' || undo.operation.length > 200) throw new Error('Invalid recovery point');
      state.undo = { notes: validNotes(undo.notes), selected: undo.selected, operation: undo.operation };
    }
    return state;
  }
  function change(state, action, id, text, now) {
    const next = copy(state);
    let operation;
    if (action === 'save') {
      if (!ids.includes(id)) throw new Error('Choose a passage');
      const clean = typeof text === 'string' ? text.trim() : '';
      if (!clean || clean.length > 600) throw new Error('Write a note of 1–600 characters.');
      operation = `${state.notes[id] ? 'Edited' : 'Saved'} your note on ${labels[id]}`;
      next.notes[id] = { text: clean, updatedAt: now || new Date().toISOString() };
      next.selected = id;
    } else if (action === 'delete') {
      if (!ids.includes(id) || !state.notes[id]) throw new Error('No saved note to delete');
      operation = `Deleted your note on ${labels[id]}`;
      delete next.notes[id];
      next.selected = id;
    } else if (action === 'reset') {
      operation = 'Reset all Proofnote notes';
      next.notes = {};
      next.selected = 'pause';
    } else throw new Error('Unknown note action');
    next.undo = { notes: copy(state.notes), selected: state.selected, operation };
    return next;
  }
  function undo(state) {
    if (!state.undo) return copy(state);
    return { version: 1, notes: copy(state.undo.notes), selected: state.undo.selected, undo: null };
  }
  const model = { ids, labels, fresh, parse, change, undo };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.ProofnoteModel = model;
})(typeof window !== 'undefined' ? window : globalThis);
