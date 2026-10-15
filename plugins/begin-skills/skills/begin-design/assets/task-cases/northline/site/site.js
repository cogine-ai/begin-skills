/* Northline: local preparation only. No network or commission submission. */
(function (root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./core.js') : root.NorthlineCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.NorthlineApp = api; if (root.document) api.mount(root.document, root); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  function mount(doc, env) {
    const el = id => doc.getElementById(id);
    if (!el('workbench')) return null;
    let state = core.initial(), storage = null, savedBefore = false, renderedStudy = null;
    let storageMessage = 'Saved briefs stay in this browser. Unsaved edits are lost on reload.';
    try {
      storage = env.localStorage;
      if (!storage) throw new Error('Storage unavailable');
      const raw = storage.getItem(core.STORAGE_KEY);
      if (raw !== null) {
        state = core.restore(raw); savedBefore = true;
        storageMessage = 'Restored the saved prepared brief from this browser.';
      }
    } catch (error) {
      storageMessage = storage ? 'The saved brief could not be read. Reset to clear it, or prepare and save a fresh brief.' :
        'Browser storage is unavailable. You can prepare a brief for this visit; copy it before closing.';
    }
    // A study link is a deliberate visitor choice; it is separate from their project type.
    const params = new URLSearchParams(env.location?.search || '');
    const linked = params.get('study');
    if (core.findStudy(linked)) {
      state = core.change(state, 'study', linked);
      if (state.prepared && !core.isCurrent(state)) storageMessage = 'The linked study changed your saved brief. Prepare again before saving.';
    }
    // Consume the entry selection, so a reset and reload start from the original values.
    if (params.has('study') && env.history?.replaceState && env.location?.href) {
      try { const url = new URL(env.location.href); url.searchParams.delete('study'); env.history.replaceState(null, '', url.href); } catch (_) { /* Some file origins disallow history updates. */ }
    }
    const put = (id, text) => { const node=el(id); if (node.textContent !== text) node.textContent=text; };
    const value = (id, val) => { if (el(id).value !== val) el(id).value=val; };
    function render() {
      const study = core.findStudy(state.input.study);
      value('study-select', study.id); value('project-type', state.input.type);
      value('project-title', state.input.title); value('project-goal', state.input.goal);
      put('study-title',study.title); put('study-category',study.number+' / '+study.category);
      put('study-dimensions',study.dimensions); put('study-question',study.question); put('study-approach',study.approach);
      if (renderedStudy !== study.id) {
        // This is trusted, original SVG from the local catalogue. Typed input never enters this path.
        el('plan').innerHTML=study.svg;
        el('phone-plan').innerHTML=study.roomSvg;
        renderedStudy=study.id;
      }
      el('full-drawing').setAttribute('href','art/'+study.id+'.svg');
      core.ROLES.forEach(role => {
        el(role).checked=state.input.layers[role];
        const onoff = state.input.layers[role] ? 'On' : 'Off';
        put(role+'-state',onoff); put(role+'-note-state',onoff); put(role+'-note',study.roles[role]);
      });
      ['plan','phone-plan'].forEach(id => {
        el(id).querySelectorAll('[data-layer]').forEach(group => {
          group.toggleAttribute('hidden',!state.input.layers[group.getAttribute('data-layer')]);
          group.setAttribute('aria-hidden',String(!state.input.layers[group.getAttribute('data-layer')]));
        });
      });
      const shown=core.roleNames(state.input.layers);
      const off=core.ROLES.filter(role=>!state.input.layers[role]).map(role=>role[0].toUpperCase()+role.slice(1));
      put('visible-roles', 'Visible: '+(shown.length ? shown.join(', ') : 'none')+'.'+(off.length ? ' Hidden: '+off.join(', ')+'.' : '')+
        (!shown.length ? ' Room geometry only.' : ''));
      const current=core.isCurrent(state);
      el('summary-content').hidden=!state.prepared;
      el('save-brief').disabled=!current;
      el('brief-status-label').setAttribute('data-state',state.prepared ? (current ? 'current' : 'stale') : 'empty');
      put('brief-status-label',state.prepared ? (current ? 'Current' : 'Stale — reprepare') : 'Not prepared');
      put('prepared-status',state.prepared ? (current ? 'This summary matches your current project, study, and light roles.' :
        'Your choices changed. This previous summary is stale; prepare again before saving.') :
        'Fill in a title and goal, then prepare your brief.');
      if (state.prepared) {
        const input=state.prepared.input, ref=core.findStudy(input.study), roles=core.roleNames(input.layers);
        put('summary-title',input.title); put('summary-type',input.type); put('summary-goal',input.goal);
        put('summary-study',ref.title+' · '+ref.category+' · '+ref.dimensions);
        put('summary-roles',roles.length ? roles.join(', ') : 'None — room geometry only; no light roles included.');
      }
      put('storage-status',storageMessage);
    }
    function clearError(field) {
      el(field+'-error').hidden=true; put(field+'-error','');
      el('project-'+field).removeAttribute('aria-invalid');
    }
    function edit(field, val) {
      const previous=state.revision;
      state=core.change(state,field,val);
      if (state.revision !== previous) storageMessage = savedBefore ?
        'Unsaved changes. Reload returns the last saved prepared brief.' : 'Changes are local to this visit. Prepare a current brief before saving.';
      if (['title','goal'].includes(field)) clearError(field);
      render();
    }
    el('study-select').addEventListener('change',event=>edit('study',event.target.value));
    el('project-type').addEventListener('change',event=>edit('type',event.target.value));
    ['title','goal'].forEach(field=>el('project-'+field).addEventListener('input',event=>edit(field,event.target.value)));
    core.ROLES.forEach(role=>el(role).addEventListener('change',event=>edit(role,event.target.checked)));
    el('brief-form').addEventListener('submit',event=>{
      event.preventDefault();
      const result=core.prepare(state); state=result.state;
      ['title','goal'].forEach(field=>{
        clearError(field);
        if (result.errors[field]) { el(field+'-error').hidden=false; put(field+'-error',result.errors[field]); el('project-'+field).setAttribute('aria-invalid','true'); }
      });
      render();
      const first=Object.keys(result.errors)[0];
      if (first) {
        put('prepared-status','Brief not prepared. Complete the required title and goal.');
        el('project-'+first).focus();
      } else el('summary-content').focus();
    });
    el('save-brief').addEventListener('click',()=>{
      if (!core.isCurrent(state)) { storageMessage='Prepare a current brief before saving.'; render(); return; }
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.setItem(core.STORAGE_KEY,core.serialize(state)); savedBefore=true;
        storageMessage='Saved in this browser. Reload to restore this prepared brief.';
      } catch (_) { storageMessage='Could not save in this browser. Your prepared brief is still readable; copy it before closing.'; }
      render();
    });
    el('reset-brief').addEventListener('click',()=>{
      state=core.initial(); savedBefore=false;
      ['title','goal'].forEach(clearError);
      try {
        if (!storage) throw new Error('Storage unavailable');
        storage.removeItem(core.STORAGE_KEY);
        storageMessage='Reset complete. Saved brief cleared; original values restored.';
      } catch (_) { storageMessage='Original values restored for this visit. Browser storage could not be cleared; a saved brief may return after reload.'; }
      render(); el('study-select').focus();
    });
    render(); el('workbench').hidden=false;
    return {getState:()=>core.clone(state)};
  }
  return {mount};
});
