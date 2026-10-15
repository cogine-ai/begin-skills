(() => {
  'use strict';
  const G = window.GoodMeasure;
  const form = document.getElementById('cut-form');
  if (!form) return;
  const storage = {getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value),removeItem:key=>window.localStorage.removeItem(key)};
  const controller = G.createController(storage);
  const $ = id => document.getElementById(id);
  const result = $('result');
  const announce = message => { $('action-status').textContent = message; };
  function readForm() {
    const cuts={};
    G.CATALOGUE.forEach(f => { if ($('choose-'+f.id).checked) cuts[f.id]=$('length-'+f.id).value; });
    return {project:$('project').value,note:$('note').value,cuts};
  }
  function fillForm() {
    const d=controller.state.draft;
    $('project').value=d.project; $('note').value=d.note;
    G.CATALOGUE.forEach(f => { $('choose-'+f.id).checked=Object.hasOwn(d.cuts,f.id); $('length-'+f.id).value=d.cuts[f.id] || '0.25'; });
    updateChoices();
  }
  function updateChoices() {
    let count=0;
    G.CATALOGUE.forEach(f => {
      const selected=$('choose-'+f.id).checked;
      $('length-'+f.id).disabled=!selected;
      $('row-'+f.id).classList.toggle('selected',selected);
      if(selected) count++;
    });
    $('selection-count').textContent=`${count} ${count===1?'fabric':'fabrics'} selected`;
  }
  function showErrors() {
    const errors=controller.state.errors;
    const names=['project','note','cuts',...G.CATALOGUE.map(f=>f.id)];
    names.forEach(name=>{
      const el=$(name==='cuts'?'cuts-error':name+'-error');
      el.textContent=errors[name] || '';
      const field=$(name==='project'||name==='note'?name:'length-'+name);
      if(field) field.setAttribute('aria-invalid',errors[name]?'true':'false');
    });
    $('error-summary').hidden=!Object.keys(errors).length;
    $('error-summary').textContent=Object.keys(errors).length ? 'The list was not prepared. Check the marked fields below. Any earlier result is retained; keeping and downloading are paused.' : '';
  }
  function syncActions() {
    const ready=controller.canAct();
    $('keep-list').disabled=!ready; $('download-list').disabled=!ready;
    const s=controller.state;
    const label=!s.prepared?'Not prepared':s.stale?'Changes need preparation':'Prepared · current';
    $('result-state').textContent=label;
    $('result-state').classList.toggle('stale',!!s.stale);
    const help=!s.prepared?'Prepare a list to see your cuts and totals.':s.stale?'This is your earlier result. Prepare again to use the current changes.':'';
    $('result-help').textContent=help;
    $('result-help').hidden=!help;
  }
  function addText(tag,text,className) { const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el; }
  function renderResult() {
    result.replaceChildren();
    const r=controller.state.prepared;
    const heading=$('result-heading');
    heading.textContent=r?r.project:'Cut list';
    heading.hidden=!r;
    if(!r) { syncActions();return; }
    const list=document.createElement('ol');list.className='prepared-cuts';
    r.cuts.forEach(c=>{
      const li=document.createElement('li');
      li.append(addText('span',c.id,'fabric-id'),addText('h3',c.name),addText('p',`${c.width} cm wide · ${c.fibre}`,'cut-facts'));
      const figures=document.createElement('div');figures.className='cut-figures';
      figures.append(addText('span',`${G.metres(c.cm)} m`),addText('span',G.money(c.cost)));
      li.append(figures,addText('p',`${G.money(c.price)} per metre`,'rate'));list.append(li);
    });
    result.append(list);
    const totals=document.createElement('div');totals.className='totals';
    totals.append(addText('p','Total length'),addText('strong',`${G.metres(r.totalCm)} m`),addText('p','Total cost'),addText('strong',G.money(r.totalPence)));
    result.append(totals,addText('p',`Note: ${r.note || '(none)'}`,'prepared-note'));
    const details=document.createElement('details');const summary=addText('summary','Inspect exact export text');const pre=addText('pre',r.text);details.className='export-preview';details.append(summary,pre);result.append(details);
    syncActions();
  }
  function syncKept() {
    const kept=controller.readKept();
    $('recover-list').disabled=!kept.ok||!kept.present;
    $('forget-list').disabled=kept.ok&&!kept.present;
    $('kept-state').textContent=!kept.ok?kept.error:kept.present?`Kept here: ${kept.result.project}. Recovering replaces the current form and result.`:'No kept copy in this browser.';
  }
  form.addEventListener('input',()=>{
    updateChoices();controller.edit(readForm());showErrors();syncActions();announce(controller.state.prepared?'Changed. Prepare again before keeping or downloading.':'');
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();controller.edit(readForm());const checked=controller.prepare();showErrors();
    if(!checked.ok){syncActions();const key=Object.keys(checked.errors)[0];const target=$(key==='cuts'?'choose-GM01':key==='project'||key==='note'?key:'length-'+key);if(target)target.focus();announce('Check the marked fields. Your earlier result is unchanged.');return;}
    renderResult();announce(`Prepared ${checked.result.project}: ${G.metres(checked.result.totalCm)} metres, ${G.money(checked.result.totalPence)}.`);$('result-heading').focus();
  });
  $('keep-list').addEventListener('click',()=>{const kept=controller.keep();announce(kept.ok?'Kept this exact prepared list in this browser. It replaces any earlier kept copy.':kept.error);syncKept();});
  $('download-list').addEventListener('click',()=>{
    try{
      const text=controller.downloadText();const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');
      link.href=url;link.download='good-measure-'+controller.state.prepared.project.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.txt';
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);announce('Downloaded the exact prepared text.');
    }catch(error){announce(error.message);}
  });
  $('recover-list').addEventListener('click',()=>{const recovered=controller.recover();if(recovered.ok){fillForm();showErrors();renderResult();announce('Recovered the kept list. The form and exact result are current again.');$('result-heading').focus();}else announce(recovered.error);syncKept();});
  $('reset-list').addEventListener('click',()=>{controller.reset();fillForm();showErrors();renderResult();syncKept();announce('Current form and result reset. Any kept browser copy is still available.');$('project').focus();});
  $('forget-list').addEventListener('click',()=>{const forgotten=controller.forget();announce(forgotten.ok?'Forgot the kept browser copy. Your current form and result are unchanged.':forgotten.error);syncKept();});
  fillForm();renderResult();syncKept();
})();
