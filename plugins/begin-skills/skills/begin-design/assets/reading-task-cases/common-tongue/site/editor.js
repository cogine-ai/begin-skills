(function () {
 'use strict';
 const M = window.CommonTongueModel;
 const fixture = window.CommonTongueFixture;
 const $ = id => document.getElementById(id);
 let state = M.create(fixture);
 const areas = Array.from(document.querySelectorAll('#proof-form textarea'));
 const proofActions = Array.from(document.querySelectorAll('[data-proof-action]'));
 let storage;
 try { storage=window.localStorage; }
 catch (_) { storage={getItem(){throw Error('Unavailable')},setItem(){throw Error('Unavailable')},removeItem(){throw Error('Unavailable')}}; }
 function notify(message,tone='neutral') { $('status').textContent=message; $('status').dataset.tone=tone; }
 function resize(area) { area.style.height='auto'; area.style.height=(area.scrollHeight+2)+'px'; }
 function readDraft() {
  return {title:$('project-title').value,byline:fixture.byline,sourceLanguage:'English',translationLanguage:'French',note:$('note').value,
   pairs:Array.from(document.querySelectorAll('.edit-pair')).map((pair,index)=>({id:pair.dataset.pairId,source:pair.querySelector('[id^="source-"]')?.value,translation:pair.querySelector('[id^="translation-"]')?.value}))};
 }
 function fillDraft() {
  $('project-title').value=state.draft.title; $('note').value=state.draft.note;
  state.draft.pairs.forEach((pair,index)=>{const row=document.querySelectorAll('.edit-pair')[index];row.dataset.pairId=pair.id;$('source-'+(index+1)).value=pair.source;$('translation-'+(index+1)).value=pair.translation;});
  areas.forEach(resize);
 }
 function clearErrors() {
  $('errors').replaceChildren(); $('errors').hidden=true;
  areas.forEach(area=>{area.removeAttribute('aria-invalid');area.removeAttribute('aria-describedby')});
 }
 function showErrors(errors) {
  clearErrors();
  const heading=document.createElement('strong');heading.textContent='Complete these parts before preparing the proof';
  const list=document.createElement('ul');
  errors.forEach((error,index)=>{
   const item=document.createElement('li'); item.id='error-'+index;
   const field=$(error.field);
   if(field) {const link=document.createElement('a');link.href='#'+error.field;link.textContent=error.message;link.addEventListener('click',()=>field.focus());item.append(link);field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',item.id);}
   else item.textContent=error.message;
   list.append(item);
  });
  $('errors').append(heading,list);$('errors').hidden=false;$('errors').focus();
 }
 function paragraph(text,language) { const element=document.createElement('p');element.textContent=text;if(language)element.lang=language;return element; }
 function languageBlock(label,text,lang) {
  const block=document.createElement('div');
  const heading=document.createElement('span');heading.className='language-label';heading.textContent=label;
  block.append(heading,paragraph(text,lang));return block;
 }
 function renderProof() {
  const current=M.current(state);
  proofActions.forEach(button=>button.disabled=!current);
  $('result-end-actions').hidden=!state.prepared;
  if(!state.prepared) { $('result-state').textContent='Not prepared';$('proof-output').hidden=true;$('exact-panel').hidden=true;$('result-empty').hidden=false;$('proof-output').replaceChildren();$('exact-text').textContent='';return; }
  $('result-state').textContent=$('result-end-state').textContent=current?'Current proof · ready to keep':'Earlier proof · edits pending';
  $('result-empty').hidden=true;$('proof-output').hidden=false;$('exact-panel').hidden=false;
  const draft=state.prepared.draft,fragment=document.createDocumentFragment();
  const title=document.createElement('h3');
  if(draft.title===fixture.title) {
   const first=document.createElement('span'),last=document.createElement('span');
   first.className=last.className='proof-title-phrase';first.textContent='A Place for ';last.textContent='the Key';
   title.append(first,last);
  } else title.textContent=draft.title;
  fragment.append(title);
  const credit=paragraph(draft.byline);credit.className='proof-credit';fragment.append(credit);
  const languages=paragraph('English original / French translation');languages.className='proof-language-key';fragment.append(languages);
  draft.pairs.forEach(pair=>{
   const section=document.createElement('section');section.className='proof-pair';section.setAttribute('aria-label','Paragraph pair '+pair.id);
   const id=document.createElement('h4');id.className='pair-id';id.textContent=pair.id;
   section.append(id,languageBlock('English',pair.source,'en'),languageBlock('French',pair.translation,'fr'));fragment.append(section);
  });
  const note=document.createElement('section');note.className='proof-note';const heading=document.createElement('h4');heading.textContent='Editorial note';note.append(heading,paragraph(draft.note));fragment.append(note);
  $('proof-output').replaceChildren(fragment);$('exact-text').textContent=state.prepared.text;
 }
 function refreshRecovery(afterKeep=false) {
  const result=M.readKept(storage);
  $('recovery').hidden=!result.found;
  $('recover').disabled=!result.ok||!result.found;
  if(result.found) {
   $('recovery-message').textContent=result.ok?(afterKeep?'This complete proof is kept in this browser. Recover it to replace the current editable text and result.':'Recover the kept proof to replace the text and result currently on this page. Recovery is your choice.'):result.message;
  }
  return result;
 }
 areas.forEach(area=>area.addEventListener('input',()=>{
  resize(area);state=M.edit(state,readDraft());clearErrors();
  renderProof();notify(state.prepared?'Your text changed. The earlier proof stays below; prepare again before keeping or downloading.':'Your text is ready for preparation.');
 }));
 $('proof-form').addEventListener('submit',event=>{
  event.preventDefault();state={...state,draft:readDraft()};
  const result=M.prepare(state);
  if(!result.ok){showErrors(result.errors);renderProof();notify('The proof was not prepared. Correct the fields listed above; the earlier output is retained.','error');return;}
  state=result.state;clearErrors();renderProof();notify('The complete proof is current. Read it below, then keep it or download the text.','success');
  $('prepared-result').focus();$('prepared-result').scrollIntoView({behavior:'auto',block:'start'});
 });
 function keepProof() {
  state={...state,draft:readDraft()};const result=M.keep(state,storage);notify(result.message,result.ok?'success':'error');if(result.ok)refreshRecovery(true);renderProof();
 }
 function downloadProof() {
  state={...state,draft:readDraft()};const result=M.exportText(state);
  if(!result.ok){notify(result.message,'error');renderProof();return;}
  const blob=new Blob([result.text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='common-tongue-reading-proof.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('The browser was asked to download the complete UTF-8 proof as common-tongue-reading-proof.txt.');
 }
 proofActions.forEach(button=>button.addEventListener('click',button.dataset.proofAction==='keep'?keepProof:downloadProof));
 $('reset').addEventListener('click',()=>{
  state=M.create(fixture);fillDraft();clearErrors();renderProof();refreshRecovery();notify('The original scene is restored. The current proof is cleared; reset does not remove a kept copy.');$('project-title').focus();
 });
 $('recover').addEventListener('click',()=>{
  const result=M.readKept(storage);
  if(!result.ok||!result.found){notify(result.message||'There is no kept proof in this browser.','error');refreshRecovery();return;}
  state=result.state;fillDraft();clearErrors();renderProof();notify('Your kept title, all eight passages, note and exact proof have been recovered.','success');$('prepared-result').focus();$('prepared-result').scrollIntoView({behavior:'auto',block:'start'});
 });
 $('forget').addEventListener('click',()=>{const result=M.forget(storage);notify(result.message,result.ok?'success':'error');if(result.ok)refreshRecovery();});
 $('prepare').disabled=false;areas.forEach(resize);renderProof();
 const initial=refreshRecovery();if(!initial.ok)notify(initial.message,'error');
 window.addEventListener('resize',()=>areas.forEach(resize));
 if(document.fonts)document.fonts.ready.then(()=>areas.forEach(resize));
})();
