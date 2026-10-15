(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GoodMeasure = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATALOGUE = Object.freeze([
    {id:'GM01',name:'Écru stripe with a narrow indigo selvedge',width:145,price:1400,fibre:'Cotton'},
    {id:'GM02',name:'Soft crosshatch in pine and chalk',width:150,price:1800,fibre:'Linen'},
    {id:'GM03',name:'Small checks with a raised oat thread',width:140,price:2200,fibre:'Cotton / linen'},
    {id:'GM04',name:'Plain weave in deep aubergine',width:148,price:1600,fibre:'Cotton'},
    {id:'GM05',name:'Washed twill with a fine diagonal grain',width:152,price:2000,fibre:'Linen'},
    {id:'GM06',name:'Windowpane with uneven blue lines',width:142,price:2400,fibre:'Cotton'}
  ].map(Object.freeze));
  const STORAGE_KEY = 'good-measure.cut-list.v1';
  const metres = cm => `${Math.floor(cm / 100)}.${String(cm % 100).padStart(2,'0')}`;
  const money = pence => `GBP ${Math.floor(pence / 100)}.${String(pence % 100).padStart(2,'0')}`;
  function parseLength(value) {
    const text = String(value ?? '').trim();
    if (!/^\d{1,2}(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    const cm = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
    return cm >= 25 && cm <= 500 && cm % 25 === 0 ? cm : null;
  }
  function blankDraft() { return {project:'',note:'',cuts:{}}; }
  function validate(draft) {
    const errors = {};
    const project = String(draft.project ?? '').trim();
    const note = String(draft.note ?? '').replace(/\r\n?/g,'\n').trim();
    if (!project || project.length > 80 || /[\x00-\x1f\x7f]/.test(project)) errors.project = 'Name your project using 1–80 characters on one line.';
    if (note.length > 500 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(note)) errors.note = 'Use a note of at most 500 characters.';
    const chosen = CATALOGUE.filter(f => Object.prototype.hasOwnProperty.call(draft.cuts || {}, f.id));
    if (!chosen.length) errors.cuts = 'Choose at least one fabric for your cut list.';
    const cuts = chosen.map(f => {
      const cm = parseLength(draft.cuts[f.id]);
      if (cm === null) errors[f.id] = 'Enter 0.25–5.00 m in quarter-metre steps, such as 1.25.';
      return {...f,cm,cost:cm === null ? null : cm * f.price / 100};
    });
    const unknown = Object.keys(draft.cuts || {}).some(id => !CATALOGUE.some(f => f.id === id));
    if (unknown) errors.cuts = 'The list includes an unknown fabric. Choose from the six sample fabrics.';
    if (Object.keys(errors).length) return {ok:false,errors};
    const totalCm = cuts.reduce((sum,c) => sum + c.cm, 0);
    const totalPence = cuts.reduce((sum,c) => sum + c.cost, 0);
    const result = {project,note,cuts,totalCm,totalPence};
    result.text = exportText(result);
    return {ok:true,result,errors:{}};
  }
  function exportText(r) {
    const lines = ['GOOD MEASURE — CUT LIST',`Project: ${r.project}`,''];
    r.cuts.forEach(c => {
      lines.push(`${c.id} | ${c.name}`,`Width: ${c.width} cm | Fibre: ${c.fibre}`,`Length: ${metres(c.cm)} m | Price per metre: ${money(c.price)} | Cut cost: ${money(c.cost)}`,'');
    });
    lines.push(`Total length: ${metres(r.totalCm)} m`,`Total cost: ${money(r.totalPence)}`,'',`Note: ${r.note || '(none)'}`,'','Local sample catalogue. Not an order or stock reservation.');
    return lines.join('\n') + '\n';
  }
  function draftFromResult(r) {
    return {project:r.project,note:r.note,cuts:Object.fromEntries(r.cuts.map(c => [c.id,metres(c.cm)]))};
  }
  function createController(storage) {
    const state = {draft:blankDraft(),prepared:null,stale:false,errors:{}};
    function canAct() { return !!state.prepared && !state.stale && !Object.keys(state.errors).length; }
    function edit(draft) {
      state.draft = {project:String(draft.project ?? ''),note:String(draft.note ?? ''),cuts:{...draft.cuts}};
      if (state.prepared) state.stale = true;
      state.errors = {};
    }
    function prepare() {
      const checked = validate(state.draft);
      state.errors = checked.errors;
      if (!checked.ok) { if (state.prepared) state.stale = true; return checked; }
      state.prepared = checked.result;
      state.stale = false;
      return checked;
    }
    function readKept() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return {ok:true,present:false};
        const data = JSON.parse(raw);
        if (data.version !== 1 || !data.draft || typeof data.text !== 'string') throw new Error('format');
        const checked = validate(data.draft);
        if (!checked.ok || checked.result.text !== data.text) throw new Error('content');
        return {ok:true,present:true,result:checked.result};
      } catch (_) { return {ok:false,present:false,error:'The browser copy is unavailable or could not be verified. Your current form is unchanged. You can forget the copy and keep a fresh prepared list.'}; }
    }
    function keep() {
      if (!canAct()) return {ok:false,error:'Prepare a valid current list before keeping it.'};
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify({version:1,draft:draftFromResult(state.prepared),text:state.prepared.text}));
        return {ok:true};
      } catch (_) { return {ok:false,error:'The browser could not keep this list. Your prepared list is still available; download it instead.'}; }
    }
    function recover() {
      const kept = readKept();
      if (!kept.ok) return kept;
      if (!kept.present) return {ok:false,error:'There is no kept copy in this browser.'};
      state.draft = draftFromResult(kept.result);
      state.prepared = kept.result;
      state.stale = false;
      state.errors = {};
      return {ok:true};
    }
    function forget() {
      try { storage.removeItem(STORAGE_KEY); return {ok:true}; }
      catch (_) { return {ok:false,error:'The browser could not forget its copy. Your current form is unchanged.'}; }
    }
    function reset() { state.draft=blankDraft(); state.prepared=null; state.stale=false; state.errors={}; }
    function downloadText() { if (!canAct()) throw new Error('Prepare a valid current list before downloading.'); return state.prepared.text; }
    return {state,edit,prepare,canAct,keep,readKept,recover,forget,reset,downloadText};
  }
  return {CATALOGUE,STORAGE_KEY,metres,money,parseLength,validate,exportText,draftFromResult,createController};
});
