/* COMMON TONGUE: pure proof state and explicitly scoped storage operations. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CommonTongueModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const IDS = ['P01', 'P02', 'P03', 'P04'];
  const STORAGE_KEY = 'common-tongue.reading-proof.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => typeof value === 'string';
  function validate(draft) {
    const errors = [];
    if (!draft || typeof draft !== 'object') return [{field:'draft',message:'The reading text is missing. Restore the original scene or recover a kept proof.'}];
    if (!text(draft.title) || !draft.title.trim()) errors.push({field:'project-title',message:'Give the proof a title.'});
    if (!text(draft.note)) errors.push({field:'note',message:'The editorial note must be text. It can be empty.'});
    if (!text(draft.byline) || !draft.byline.trim()) errors.push({field:'byline',message:'The proof needs its writer and translator credit.'});
    if (draft.sourceLanguage !== 'English' || draft.translationLanguage !== 'French') errors.push({field:'languages',message:'This proof pairs English with French.'});
    if (!Array.isArray(draft.pairs) || draft.pairs.length !== 4) errors.push({field:'pairs',message:'Retain all four paragraph pairs, P01 through P04.'});
    if (Array.isArray(draft.pairs)) {
      const ids = draft.pairs.map(pair => pair && pair.id);
      if (ids.length !== 4 || ids.some((id, index) => id !== IDS[index]) || new Set(ids).size !== 4) errors.push({field:'pairs',message:'Paragraph IDs must appear once each, in order: P01, P02, P03, P04.'});
      draft.pairs.forEach((pair, index) => {
        if (!pair || !text(pair.source) || !pair.source.trim()) errors.push({field:'source-'+(index+1),message:'Add the full English paragraph for '+(pair?.id || IDS[index] || 'this pair')+'.'});
        if (!pair || !text(pair.translation) || !pair.translation.trim()) errors.push({field:'translation-'+(index+1),message:'Add the full French paragraph for '+(pair?.id || IDS[index] || 'this pair')+'.'});
      });
    }
    return errors;
  }
  function serialize(draft) {
    const errors = validate(draft);
    if (errors.length) throw new Error(errors[0].message);
    const lines = ['COMMON TONGUE — Reading proof', '', draft.title, draft.byline, 'English → French', ''];
    for (const pair of draft.pairs) lines.push(pair.id, 'English', pair.source, '', 'French', pair.translation, '');
    lines.push('Editorial note', draft.note, '');
    return lines.join('\n');
  }
  const create = draft => ({draft:clone(draft),prepared:null,dirty:false});
  function edit(state, draft) {
    return {...state,draft:clone(draft),dirty:!!state.prepared};
  }
  function prepare(state) {
    const errors = validate(state.draft);
    if (errors.length) return {ok:false,state,errors};
    const draft = clone(state.draft);
    return {ok:true,errors:[],state:{draft,dirty:false,prepared:{draft:clone(draft),text:serialize(draft)}}};
  }
  function current(state) {
    return !!state?.prepared && !state.dirty && !validate(state.draft).length && JSON.stringify(state.draft) === JSON.stringify(state.prepared.draft) && state.prepared.text === serialize(state.draft);
  }
  function exportText(state) {
    if (!current(state)) return {ok:false,message:state?.prepared ? 'The proof has changed. Prepare it again before keeping or downloading.' : 'Prepare a proof before keeping or downloading.'};
    return {ok:true,text:state.prepared.text};
  }
  function snapshot(state) {
    const result = exportText(state);
    if (!result.ok) return result;
    return {ok:true,value:JSON.stringify({version:1,draft:state.draft,prepared:state.prepared})};
  }
  function recover(raw) {
    try {
      const kept = JSON.parse(raw);
      if (!kept || kept.version !== 1 || validate(kept.draft).length || !kept.prepared || validate(kept.prepared.draft).length) throw new Error('Invalid snapshot');
      if (JSON.stringify(kept.draft) !== JSON.stringify(kept.prepared.draft) || kept.prepared.text !== serialize(kept.draft)) throw new Error('Incomplete proof');
      return {ok:true,state:{draft:clone(kept.draft),prepared:clone(kept.prepared),dirty:false}};
    } catch (_) {
      return {ok:false,message:'The kept copy cannot be read as a complete proof. Your current text is unchanged. You can forget the unreadable copy.'};
    }
  }
  function readKept(storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) return {ok:true,found:false};
      const result = recover(raw);
      return result.ok ? {...result,found:true} : {...result,found:true};
    } catch (_) {
      return {ok:false,found:false,unavailable:true,message:'Browser storage is unavailable. You can still edit, prepare and download your proof.'};
    }
  }
  function keep(state, storage) {
    const result = snapshot(state);
    if (!result.ok) return result;
    try {
      storage.setItem(STORAGE_KEY,result.value);
      if (storage.getItem(STORAGE_KEY) !== result.value) throw new Error('Storage did not retain proof');
      return {ok:true,message:'This complete proof is kept in this browser. Recover it here after a reset or reload.'};
    } catch (_) { return {ok:false,message:'The browser could not confirm a kept copy. Your prepared text is unchanged; download it to keep a file.'}; }
  }
  function forget(storage) {
    try { storage.removeItem(STORAGE_KEY); return {ok:true,message:'The kept COMMON TONGUE proof was removed. Your current text and proof are unchanged.'}; }
    catch (_) { return {ok:false,message:'The browser could not remove the kept copy. Your current text and proof are unchanged.'}; }
  }
  return {IDS,STORAGE_KEY,clone,validate,serialize,create,edit,prepare,current,exportText,snapshot,recover,readKept,keep,forget};
});
