(function(){
  'use strict';
  const C=FormCatalogue,M=FormShortlist,$=id=>document.getElementById(id);
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let state=M.initial(),category='All',keptRecord=null,storedPresent=false;
  function say(message){$('feedback').textContent=message;}
  function readKept(){
    try{
      const raw=localStorage.getItem(M.STORAGE_KEY);storedPresent=raw!==null;
      if(!raw){keptRecord=null;return {kind:'empty'};}
      let parsed;try{parsed=JSON.parse(raw);}catch(_error){keptRecord=null;return {kind:'invalid'};}
      const restored=M.restore(parsed);
      if(!restored){keptRecord=null;return {kind:'invalid'};}
      keptRecord=parsed;return {kind:'valid',state:restored};
    }catch(_error){keptRecord=null;return {kind:'blocked'};}
  }
  function updateStorage(){
    $('reload-kept').disabled=!keptRecord;
    $('forget').disabled=!storedPresent;
    $('kept-status').textContent=keptRecord?`Kept version ${String(keptRecord.prepared.version).padStart(2,'0')} · ${keptRecord.input.label} · ${keptRecord.input.ids.length} object${keptRecord.input.ids.length===1?'':'s'}.`:storedPresent?'A stored record could not be read. Forget it to remove that local record.':'No shortlist is kept in this browser.';
  }
  function syncFields(){$('workspace-label').value=state.input.label;$('workspace-note').value=state.input.note;$('workspace-label').removeAttribute('aria-invalid');}
  function card(item){
    return `<article class="object-card" data-id="${item.id}" id="object-${item.id}"><div class="item-art"><span class="mono">${item.code} / ${item.status.toUpperCase()}</span><img src="assets/art/${item.art}" alt="${escape(item.name)} — original fictional specimen"></div><div class="item-body"><div class="item-heading"><h3>${item.name}</h3><span class="item-category">${item.category.toUpperCase()}</span></div><dl class="item-specs"><div><dt>W × D × H</dt><dd class="measure"><span>${item.w} × ${item.d} × ${item.h}</span><small>mm</small></dd></div><div><dt>Material</dt><dd>${item.material}</dd></div><div><dt>Reference</dt><dd class="reference"><span>${M.money(item.price)}</span><small>USD</small></dd></div></dl><button type="button" class="object-select" id="select-${item.id}" data-select="${item.id}" aria-pressed="false" aria-label="Add ${escape(item.name)} to shortlist"><span>Add to shortlist</span><span aria-hidden="true">＋</span></button><details class="object-details"><summary>Form &amp; planning notes</summary><p>${item.description}</p><p><strong>For your workspace</strong><br>${item.use}</p><p class="item-detail">${item.finish}<br>${item.detail}</p></details></div></article>`;
  }
  $('catalogue-grid').innerHTML=C.items.map(card).join('');
  function filter(){
    const query=$('search').value.trim().toLowerCase(),material=$('material').value;
    let shown=0;
    C.items.forEach(item=>{
      const haystack=[item.name,item.code,item.material,item.status].join(' ').toLowerCase();
      const visible=(category==='All'||item.category===category)&&(material==='All'||item.materialGroup===material)&&(!query||haystack.includes(query));
      $('object-'+item.id).hidden=!visible;if(visible)shown++;
    });
    $('filter-count').textContent=`${shown} of 6 objects shown`;
    $('empty-filter').hidden=shown!==0;
    document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.category===category));
  }
  function resetFilters(){category='All';$('search').value='';$('material').value='All';filter();}
  function comparison(){
    const items=state.input.ids.map(id=>C.byId(id));
    $('selected-count').textContent=items.length;
    $('selection-route').hidden=items.length===0;
    $('selection-route-count').textContent=items.length;
    document.querySelectorAll('[data-count]').forEach(el=>{el.textContent=items.length;el.setAttribute('aria-label',items.length+' objects selected');});
    $('selection-empty').hidden=items.length>0;
    $('clear-selection').disabled=!items.length;
    C.items.forEach(item=>{
      const selected=state.input.ids.includes(item.id),button=$('select-'+item.id);
      button.setAttribute('aria-pressed',selected);
      button.setAttribute('aria-label',(selected?'Remove ':'Add ')+item.name+(selected?' from shortlist':' to shortlist'));
      button.children[0].textContent=selected?'Remove from shortlist':'Add to shortlist';button.children[1].textContent=selected?'−':'＋';
    });
    if(!items.length){$('comparison').innerHTML='';return;}
    $('comparison').innerHTML=`<table class="comparison-table"><caption class="sr-only">Current selection: exterior dimensions, materials and illustrative prices</caption><thead><tr><th scope="col">Object</th><th scope="col">Width<small>mm</small></th><th scope="col">Depth<small>mm</small></th><th scope="col">Height<small>mm</small></th><th scope="col">Material</th><th scope="col">Reference<small>USD</small></th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${items.map(item=>`<tr><th scope="row"><small>${item.code} / ${item.status}</small>${item.name}</th><td data-label="Width"><span>${item.w}<small class="phone-unit">mm</small></span></td><td data-label="Depth"><span>${item.d}<small class="phone-unit">mm</small></span></td><td data-label="Height"><span>${item.h}<small class="phone-unit">mm</small></span></td><td data-label="Material"><span>${item.material}</span></td><td data-label="Illustrative USD"><span>${M.money(item.price)}</span></td><td><button class="remove-item" type="button" data-remove="${item.id}" aria-label="Remove ${item.name} from shortlist">Remove</button></td></tr>`).join('')}</tbody></table><p class="selection-caption">${items.length} selected object${items.length===1?'':'s'} · Exterior measurements in mm · Illustrative research prices in USD</p>`;
  }
  function prepared(){
    const current=M.isCurrent(state),p=state.prepared;
    $('keep').disabled=!current;$('download').disabled=!current;
    $('prepared-empty').hidden=!!p;$('prepared-content').hidden=!p;
    $('prepared-status').textContent=!p?'Not prepared':current?'Current':'Stale';
    $('prepared-status').dataset.state=!p?'empty':current?'current':'stale';
    if(!p){$('prepared-content').innerHTML='';$('prepared-help').textContent='Keep and Download become available after preparation.';return;}
    const items=p.input.ids.map(id=>C.byId(id));
    $('prepared-content').innerHTML=`<div class="prepared-sheet"><div class="prepared-title-line"><h3>${escape(p.input.label)}</h3><span class="mono">VERSION ${String(p.version).padStart(2,'0')} / ${items.length} OBJECT${items.length===1?'':'S'}</span></div><ol class="prepared-objects">${items.map(item=>`<li><span class="mono">${item.code}</span><div><p class="prepared-object-name">${item.name}</p><p class="prepared-object-meta">${item.material}<br>${item.status}</p></div><div><p class="prepared-object-dimensions">${item.w} × ${item.d} × ${item.h}<small>mm</small></p><p class="prepared-object-price">USD ${M.money(item.price)} / illustrative</p></div></li>`).join('')}</ol><p class="prepared-note"><span>YOUR NOTE</span>${escape(p.input.note||'No workspace note added.')}</p></div>`;
    $('prepared-help').textContent=current?'This sheet matches your current inputs. Keep stores one local version; Download creates its exact text.':'This earlier sheet no longer matches the current inputs. Prepare shortlist again before keeping or downloading.';
  }
  function render(){comparison();prepared();updateStorage();}
  function setIds(ids,message){state=M.edit(state,'ids',ids);render();say(message+(state.prepared&&!M.isCurrent(state)?' The prepared sheet is stale. Prepare again to keep or download.':''));}
  $('catalogue-grid').addEventListener('click',event=>{
    const button=event.target.closest('[data-select]');if(!button)return;
    const id=button.dataset.select,item=C.byId(id),exists=state.input.ids.includes(id);
    setIds(exists?state.input.ids.filter(value=>value!==id):[...state.input.ids,id],`${item.short} ${exists?'removed from':'added to'} the working comparison.`);
  });
  $('comparison').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove]');if(!button)return;
    const id=button.dataset.remove;setIds(state.input.ids.filter(value=>value!==id),C.byId(id).short+' removed from the working comparison.');
    if(!$('select-'+id).closest('.object-card').hidden)$('select-'+id).focus();else $('prepare').focus();
  });
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;filter();}));
  $('search').addEventListener('input',filter);$('material').addEventListener('change',filter);
  $('reset-filters').addEventListener('click',()=>{resetFilters();$('search').focus();say('All six objects are shown. Your selections are unchanged.');});
  $('clear-selection').addEventListener('click',()=>{setIds([],'Selections cleared. Workspace name and note are retained.');$('prepare').focus();});
  [['workspace-label','label'],['workspace-note','note']].forEach(([id,field])=>$(id).addEventListener('input',()=>{
    state=M.edit(state,field,$(id).value);$(id).removeAttribute('aria-invalid');prepared();
    say(state.prepared?'Inputs changed. Prepare again to keep or download the current shortlist.':'Workspace details updated. Select objects and prepare the shortlist when ready.');
  }));
  $('prepare').addEventListener('click',()=>{
    const result=M.prepare(state);
    if(!result.ok){say(result.message);if(result.field==='label'){$('workspace-label').setAttribute('aria-invalid','true');$('workspace-label').focus();}else if(result.field==='selection'){$('search').focus();}return;}
    state=result.state;render();say(`Prepared version ${String(state.prepared.version).padStart(2,'0')} for ${state.input.label}. This sheet is current.`);
  });
  $('keep').addEventListener('click',()=>{
    const result=M.keep(state);if(!result.ok){say(result.message);return;}
    try{localStorage.setItem(M.STORAGE_KEY,JSON.stringify(result.record));keptRecord=result.record;storedPresent=true;updateStorage();say(`Version ${String(state.prepared.version).padStart(2,'0')} kept in this browser. Reload restores this version.`);}catch(_error){say('The browser blocked local keeping. Your current shortlist is intact; download its text before closing the page.');}
  });
  $('reload-kept').addEventListener('click',()=>{
    const loaded=readKept();
    if(loaded.kind==='valid'){state=loaded.state;syncFields();resetFilters();render();say('Kept work reloaded. It replaced unkept edits and restored a current prepared sheet.');}
    else{updateStorage();say(loaded.kind==='blocked'?'The browser blocked access to kept work. Current work remains visible.':'Kept work is missing or invalid. Current work remains visible.');}
  });
  $('forget').addEventListener('click',()=>{
    try{localStorage.removeItem(M.STORAGE_KEY);keptRecord=null;storedPresent=false;updateStorage();say('Kept work forgotten. Current work remains on screen; a later browser reload will start empty.');}catch(_error){say('The browser blocked forgetting the kept version. Current work remains intact.');}
  });
  $('download').addEventListener('click',()=>{
    if(!M.isCurrent(state)){say('Prepare the current selection before downloading.');return;}
    const blob=new Blob([M.text(state.prepared)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='form-bureau-shortlist-v'+String(state.prepared.version).padStart(2,'0')+'.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    say(`Text download created for prepared version ${String(state.prepared.version).padStart(2,'0')}. Downloading does not keep the browser version.`);
  });
  window.addEventListener('storage',event=>{
    if(event.key!==M.STORAGE_KEY&&event.key!==null)return;
    const loaded=readKept();updateStorage();say(loaded.kind==='valid'?'Another tab changed the kept version. Current work is unchanged; Reload kept work reads the latest version.':'Another tab removed or changed the kept record. Current work stays visible.');
  });
  const loaded=readKept();
  if(loaded.kind==='valid'){state=loaded.state;syncFields();say('The last kept shortlist is restored and current. Unkept edits from an earlier visit are not retained.');}
  else if(loaded.kind==='invalid')say('The stored shortlist is damaged or from another catalogue version. It was not loaded. Forget kept work removes that stored record.');
  else if(loaded.kind==='blocked')say('Local storage is unavailable. Prepare and download text to take your research away.');
  filter();render();
})();
