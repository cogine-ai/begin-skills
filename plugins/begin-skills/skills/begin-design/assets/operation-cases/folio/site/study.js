(() => {
'use strict';
const STORAGE_KEY = 'folio.hush-vessel.workspace.v1';
const MAX_PINS = 12, MIN_POS = .04, MAX_POS = .96;
const $ = id => document.getElementById(id);
const snapshot = pin => ({title: pin.title, text: pin.text, x: pin.x, y: pin.y});
const copy = value => JSON.parse(JSON.stringify(value));
const clamp = n => Math.max(MIN_POS, Math.min(MAX_POS, Math.round(n * 100) / 100));
const dirty = pin => !pin.saved || Object.keys(snapshot(pin)).some(k => pin[k] !== pin.saved[k]);
const initial = () => {
 const pins = [
  {id:'p1',number:1,title:'The blue fold',text:'The blue interior narrows into a dark seam. It feels like a place for a thought to settle.',x:.53,y:.38},
  {id:'p2',number:2,title:'An interrupted rim',text:'The rim refuses to become a perfect circle. One edge seems to tuck behind the other, like a folded piece of paper.',x:.34,y:.33},
  {id:'p3',number:3,title:'The resting foot',text:'A small pale foot lifts the heavy-looking body just clear of its shadow. That thin gap changes the whole object.',x:.48,y:.81}
 ];
 pins.forEach(p => p.saved = snapshot(p));
 return {version:1,subject:'hush-vessel',nextNumber:4,selected:'p1',pins,undo:null};
};
function validSnapshot(v) {
 return v && typeof v === 'object' && !Array.isArray(v) && typeof v.title === 'string' && v.title.length <= 64 && typeof v.text === 'string' && v.text.length <= 600 && Number.isFinite(v.x) && v.x >= MIN_POS && v.x <= MAX_POS && Number.isFinite(v.y) && v.y >= MIN_POS && v.y <= MAX_POS;
}
function normalizePin(p) {
 if (!p || typeof p !== 'object' || !/^p\d{1,7}$/.test(p.id) || !Number.isInteger(p.number) || p.number < 1 || p.number > 9999999 || p.id !== `p${p.number}` || !validSnapshot(p) || !(p.saved === null || validSnapshot(p.saved))) throw Error('Unsupported pin');
 return {id:p.id,number:p.number,...snapshot(p),saved:p.saved ? snapshot(p.saved) : null};
}
function normalize(raw) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1 || raw.subject !== 'hush-vessel' || !Array.isArray(raw.pins) || raw.pins.length > MAX_PINS || !Number.isInteger(raw.nextNumber) || raw.nextNumber < 1 || raw.nextNumber > 9999999) throw Error('Unsupported workspace');
 const pins = raw.pins.map(normalizePin);
 if (new Set(pins.map(p => p.id)).size !== pins.length || new Set(pins.map(p => p.number)).size !== pins.length || pins.some(p=>p.number>=raw.nextNumber)) throw Error('Duplicate or inconsistent pins');
 let undo = null;
 if (raw.undo !== null && raw.undo !== undefined) {
  if (!raw.undo || !Number.isInteger(raw.undo.index) || raw.undo.index < 0 || raw.undo.index > MAX_PINS) throw Error('Unsupported undo');
  const pin=normalizePin(raw.undo.pin);
  if(pins.some(p=>p.id===pin.id) || pin.number>=raw.nextNumber) throw Error('Inconsistent undo');
  undo={pin,index:raw.undo.index};
 }
 return {version:1,subject:'hush-vessel',nextNumber:raw.nextNumber,selected:pins.some(p=>p.id===raw.selected)?raw.selected:(pins[0]?.id||null),pins,undo};
}
let state = initial(), recoverable = true, volatile = false, placing = false;
let initialMessage = 'Working copy kept in this browser';
try {
 const raw=localStorage.getItem(STORAGE_KEY);
 if(raw){state=normalize(JSON.parse(raw));initialMessage='Your working copy was recovered';}
 else {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(localStorage.getItem(STORAGE_KEY)!==JSON.stringify(state))throw Error('Readback failed');}
} catch(error) {
 if(error.name === 'SecurityError' || error.name === 'QuotaExceededError') {recoverable=false;initialMessage='Browser recovery unavailable. Keep this page open and export your work.';}
 else {initialMessage='Previous working copy could not be read. The sample study is shown.';}
}
function write(candidate) {
 try {
  const encoded=JSON.stringify(candidate);
  localStorage.setItem(STORAGE_KEY,encoded);
  if(localStorage.getItem(STORAGE_KEY)!==encoded)throw Error('Readback failed');
  recoverable=true;volatile=false;return true;
 } catch(error) {recoverable=false;volatile=true;return false;}
}
function persist() {const ok=write(state);renderStorage(ok?'Working copy kept in this browser':'Browser recovery unavailable. Keep this page open and export your work.');return ok;}
function renderStorage(message){$('storage-status').textContent=message;$('storage-dot').classList.toggle('unavailable',!recoverable);}
function say(text){$('action-status').textContent=text;}
function current(){return state.pins.find(p=>p.id===state.selected);}
function number(pin){return String(pin.number).padStart(2,'0');}
function position(pin){return `${Math.round(pin.x*100)}% across, ${Math.round(pin.y*100)}% down`;}
function setMode(value){placing=Boolean(value&&current());$('object-stage').classList.toggle('placing',placing);$('placement-button').setAttribute('aria-pressed',String(placing));$('placement-button').textContent=placing?'Finish placement':'Move anchor';$('placement-help').textContent=placing?'Tap the illustration to place this pin. Press Enter on the illustration to center it, or finish placement to keep its current spot.':'Drag a pin, or select one and use the arrow keys. “Move anchor” lets you tap a new place.';}
function renderPins(){
 const layer=$('pins-layer');layer.replaceChildren();
 state.pins.forEach(pin=>{
  const button=document.createElement('button');button.type='button';button.className=`pin${pin.id===state.selected?' selected':''}${dirty(pin)?' draft':''}`;button.dataset.pinId=pin.id;button.style.left=`${pin.x*100}%`;button.style.top=`${pin.y*100}%`;
  button.setAttribute('aria-label',`Pin ${number(pin)}: ${pin.title||'Untitled detail'}. ${dirty(pin)?'Draft':'Saved'}. ${position(pin)}. Arrow keys move this pin; Shift moves faster.`);button.setAttribute('aria-pressed',String(pin.id===state.selected));
  const span=document.createElement('span');span.textContent=number(pin);button.append(span);button.addEventListener('click',()=>select(pin.id,false));button.addEventListener('keydown',event=>{
   const moves={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]};
   if(!moves[event.key])return;event.preventDefault();state.selected=pin.id;const [dx,dy]=moves[event.key];pin.x=clamp(pin.x+dx*(event.shiftKey?5:1));pin.y=clamp(pin.y+dy*(event.shiftKey?5:1));persist();renderAll();document.querySelector(`[data-pin-id="${pin.id}"]`)?.focus();say(`Pin ${number(pin)} moved to ${position(pin)}. Save note to keep this checkpoint.`);
  });
  let drag=null;
  button.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={pointer:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};button.setPointerCapture(event.pointerId);layer.classList.add('direct-manipulation');state.selected=pin.id;setMode(false);syncPinAppearance();renderEditor();renderNotes();});
  button.addEventListener('pointermove',event=>{if(!drag||drag.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4)drag.moved=true;if(!drag.moved)return;const rect=$('object-stage').getBoundingClientRect();pin.x=clamp((event.clientX-rect.left)/rect.width);pin.y=clamp((event.clientY-rect.top)/rect.height);button.style.left=`${pin.x*100}%`;button.style.top=`${pin.y*100}%`;$('anchor-x').value=Math.round(pin.x*100);$('anchor-y').value=Math.round(pin.y*100);syncPinAppearance();syncEditorStatus();renderNotes();});
  const end=event=>{if(!drag||drag.pointer!==event.pointerId)return;const moved=drag.moved;drag=null;layer.classList.remove('direct-manipulation');if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);persist();renderAll();if(moved)say(`Pin ${number(pin)} moved. Save note to keep this checkpoint.`);};
  button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);layer.append(button);
 });
}
function setupAnchorContext(){
 const svg=$('object-illustration').cloneNode(true), ids=new Map();
 svg.querySelectorAll('[id]').forEach(el=>ids.set(el.id,`anchor-preview-${el.id}`));
 svg.removeAttribute('id');svg.removeAttribute('aria-labelledby');svg.setAttribute('aria-hidden','true');
 svg.querySelectorAll('*').forEach(el=>{for(const attr of [...el.attributes]){let value=attr.value;if(attr.name==='id')value=ids.get(value)||value;else for(const [id,next] of ids)value=value.replaceAll(`url(#${id})`,`url(#${next})`);el.setAttribute(attr.name,value);}});
 $('anchor-context-art').append(svg);
}
function renderAnchorContext(){
 const pin=current();if(!pin)return;
 $('anchor-context').setAttribute('aria-label',`Selected anchor preview for pin ${number(pin)}: ${pin.title||'Untitled detail'}, ${position(pin)}`);
 const marker=$('anchor-context-pin');marker.textContent=number(pin);marker.style.left=`${pin.x*100}%`;marker.style.top=`${pin.y*100}%`;marker.style.borderStyle=dirty(pin)?'dashed':'solid';
}
function syncPinAppearance(){
 for(const button of $('pins-layer').children){const pin=state.pins.find(p=>p.id===button.dataset.pinId);if(!pin)continue;button.style.left=`${pin.x*100}%`;button.style.top=`${pin.y*100}%`;button.classList.toggle('selected',pin.id===state.selected);button.classList.toggle('draft',dirty(pin));button.setAttribute('aria-pressed',String(pin.id===state.selected));button.setAttribute('aria-label',`Pin ${number(pin)}: ${pin.title||'Untitled detail'}. ${dirty(pin)?'Draft':'Saved'}. ${position(pin)}. Arrow keys move this pin; Shift moves faster.`);}
}
function renderEditor(){
 const pin=current();$('note-form').hidden=!pin;$('empty-editor').hidden=Boolean(pin);$('note-state').hidden=!pin;$('placement-button').disabled=!pin;
 if(!pin){$('editor-heading').textContent='Begin a close reading';return;}
 $('editor-heading').textContent=`${number(pin)} / ${pin.title||'Untitled detail'}`;
 $('note-title').value=pin.title;$('note-text').value=pin.text;$('anchor-x').value=Math.round(pin.x*100);$('anchor-y').value=Math.round(pin.y*100);$('editor-error').textContent='';syncEditorStatus();
}
function syncEditorStatus(){const pin=current();if(!pin)return;const isDirty=dirty(pin);$('note-state').textContent=isDirty?'Draft changes':'Saved';$('note-state').classList.toggle('draft',isDirty);$('save-note').disabled=!isDirty;$('cancel-note').disabled=!isDirty;$('cancel-note').textContent=pin.saved?'Cancel changes':'Discard new pin';$('note-count').textContent=`${pin.text.length} / 600 characters`;$('editor-heading').textContent=`${number(pin)} / ${pin.title||'Untitled detail'}`;renderAnchorContext();}
function renderNotes(){
 const list=$('notes-list');list.replaceChildren();
 state.pins.forEach(pin=>{
  const article=document.createElement('article');article.className=`note-card${pin.id===state.selected?' selected':''}`;article.dataset.noteId=pin.id;
  const top=document.createElement('div');top.className='card-top';const num=document.createElement('span');num.className='card-number';num.textContent=number(pin);const status=document.createElement('span');status.className=`state-badge${dirty(pin)?' draft':''}`;status.textContent=dirty(pin)?'Draft':'Saved';top.append(num,status);
  const title=document.createElement('h3');title.textContent=pin.title||'Untitled detail';const text=document.createElement('p');text.textContent=pin.text||'No observation yet. Open this pin to add a note.';const button=document.createElement('button');button.type='button';button.textContent=pin.id===state.selected?'Continue editing ↗':'Inspect this detail ↗';button.setAttribute('aria-label',`Edit pin ${number(pin)}: ${pin.title||'Untitled detail'}`);button.addEventListener('click',()=>select(pin.id,true));article.append(top,title,text,button);list.append(article);
 });
 if(!state.pins.length){const p=document.createElement('p');p.className='notes-empty';p.textContent='No pins yet. Add one above to begin, or undo the last removal.';list.append(p);}
 $('pin-summary').textContent=`${state.pins.length} ${state.pins.length===1?'pin':'pins'} · ${state.pins.filter(dirty).length} drafts`;
 $('add-pin').disabled=state.pins.length>=MAX_PINS;$('add-pin').title=state.pins.length>=MAX_PINS?'This study holds up to 12 pins.':'';$('undo-remove').hidden=!state.undo;$('removed-label').textContent=state.undo?`Pin ${number(state.undo.pin)} removed.`:'';$('export-study').disabled=!state.pins.length;
}
function renderAll(){const focusedPin=document.activeElement?.dataset?.pinId;renderPins();renderEditor();renderNotes();if(focusedPin)document.querySelector(`[data-pin-id="${focusedPin}"]`)?.focus({preventScroll:true});}
function select(id,scroll){if(!state.pins.some(p=>p.id===id))return;state.selected=id;setMode(false);persist();renderAll();if(scroll){$('note-editor').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('note-title').focus({preventScroll:true});}}
function addPin(){
 if(state.pins.length>=MAX_PINS){say('This study holds up to 12 pins. Remove one to add another.');return;}
 const n=state.nextNumber++;const pin={id:`p${n}`,number:n,title:'',text:'',x:.5,y:.5,saved:null};state.pins.push(pin);state.selected=pin.id;persist();renderAll();setMode(true);say(`Pin ${number(pin)} added at the center. Tap the illustration to place it, or edit its position below.`);$('object-stage').focus({preventScroll:true});
}
$('add-pin').addEventListener('click',addPin);$('empty-add').addEventListener('click',addPin);
$('placement-button').addEventListener('click',()=>{setMode(!placing);say(placing?'Placement mode: tap the illustration to move the selected pin.':'Placement finished. Save the note to keep this checkpoint.');if(placing)$('object-stage').focus({preventScroll:true});});
$('object-stage').addEventListener('click',event=>{if(!placing||event.target.closest('.pin'))return;const pin=current();if(!pin)return;const rect=$('object-stage').getBoundingClientRect();pin.x=clamp((event.clientX-rect.left)/rect.width);pin.y=clamp((event.clientY-rect.top)/rect.height);setMode(false);persist();renderAll();say(`Pin ${number(pin)} placed at ${position(pin)}. Write your observation below.`);});
$('object-stage').addEventListener('keydown',event=>{if(event.target!==$('object-stage')||!placing)return;if(event.key==='Escape'){setMode(false);say('Placement finished.');}else if(event.key==='Enter'||event.key===' '){event.preventDefault();const pin=current();pin.x=.5;pin.y=.5;setMode(false);persist();renderAll();$('note-title').focus();say(`Pin ${number(pin)} centered. You can set an exact position below.`);}});
for(const [field,key] of [['note-title','title'],['note-text','text']])$(field).addEventListener('input',event=>{const pin=current();if(!pin)return;pin[key]=event.target.value.slice(0,key==='title'?64:600);$('editor-error').textContent='';persist();syncEditorStatus();renderNotes();const button=document.querySelector(`[data-pin-id="${pin.id}"]`);if(button){button.classList.toggle('draft',dirty(pin));button.setAttribute('aria-label',`Pin ${number(pin)}: ${pin.title||'Untitled detail'}. ${dirty(pin)?'Draft':'Saved'}. ${position(pin)}. Arrow keys move this pin; Shift moves faster.`);}});
for(const [field,key] of [['anchor-x','x'],['anchor-y','y']]){
 const update=event=>{
  const pin=current();if(!pin)return;const raw=event.target.value,n=Number(raw);
  if(!raw||!Number.isInteger(n)||n<4||n>96){if(event.type==='change'){$('editor-error').textContent='Use a whole-number position between 4% and 96%.';event.target.value=Math.round(pin[key]*100);}return;}
  pin[key]=n/100;$('editor-error').textContent='';persist();syncPinAppearance();syncEditorStatus();renderNotes();
  if(event.type==='change')say(`Pin ${number(pin)} moved to ${position(pin)}.`);
 };
 $(field).addEventListener('input',update);$(field).addEventListener('change',update);
}
$('note-form').addEventListener('submit',event=>{
 event.preventDefault();const pin=current();if(!pin)return;
 if(!pin.title.trim()){$('editor-error').textContent='Add a detail name before saving.';$('note-title').focus();return;}
 if(!pin.text.trim()){$('editor-error').textContent='Add an observation before saving.';$('note-text').focus();return;}
 const candidate=copy(state),next=candidate.pins.find(p=>p.id===pin.id);next.title=next.title.trim();next.text=next.text.trim();next.saved=snapshot(next);
 if(write(candidate)){state=candidate;renderStorage('Saved note and working copy kept in this browser');renderAll();say(`Pin ${number(next)} saved. Its name, observation, and anchor are now the checkpoint.`);}
 else {renderStorage('Save failed: browser recovery is unavailable. Your draft is still here; export to keep a copy.');$('editor-error').textContent='The browser could not save this checkpoint. Your draft is still available for export.';say('The note could not be saved. Your draft remains available.');}
});
function removeCurrent(message){const pin=current();if(!pin)return;const index=state.pins.findIndex(p=>p.id===pin.id);state.undo={pin:copy(pin),index};state.pins.splice(index,1);state.selected=state.pins[Math.min(index,state.pins.length-1)]?.id||null;setMode(false);persist();renderAll();say(message||`Pin ${number(pin)} removed. Undo removal is available below the desk.`);}
$('cancel-note').addEventListener('click',()=>{const pin=current();if(!pin)return;if(!pin.saved){removeCurrent('New pin discarded. You can undo this below the desk.');return;}Object.assign(pin,snapshot(pin.saved));setMode(false);persist();renderAll();say(`Pin ${number(pin)} returned to its saved checkpoint.`);});
$('remove-note').addEventListener('click',()=>removeCurrent());
$('undo-remove').addEventListener('click',()=>{if(!state.undo)return;if(state.pins.length>=MAX_PINS){say('Remove a pin before restoring this one; the study holds 12 pins.');return;}const {pin,index}=state.undo;state.pins.splice(Math.min(index,state.pins.length),0,pin);state.selected=pin.id;state.undo=null;persist();renderAll();say(`Pin ${number(pin)} restored.`);});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function exportHTML(){
 const pins=state.pins.map(copy),svg=$('object-illustration').cloneNode(true);svg.removeAttribute('id');
 const anchors=pins.map(pin=>`<a class="export-pin${dirty(pin)?' draft':''}" href="#note-${pin.id}" style="left:${pin.x*100}%;top:${pin.y*100}%" aria-label="Read note ${number(pin)}: ${esc(pin.title||'Untitled detail')}"><span>${number(pin)}</span></a>`).join('');
 const index=pins.map(pin=>`<a href="#note-${pin.id}"><b>${number(pin)}</b> ${esc(pin.title||'Untitled detail')}</a>`).join('');
 const notes=pins.map(pin=>`<article id="note-${pin.id}"><div class="meta">PIN ${number(pin)} · ${dirty(pin)?'DRAFT — current working version':'SAVED CHECKPOINT'} · ${esc(position(pin))}</div><h2>${esc(pin.title||'Untitled detail')}</h2><p>${esc(pin.text||'No observation entered.')}</p><a class="back-to-drawing" href="#drawing">Back to illustration ↑</a></article>`).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The hush vessel — annotated Folio study</title><style>*{box-sizing:border-box}html{scroll-padding-top:24px}body{margin:0;background:#f5f4f6;color:#28252f;font:16px/1.65 Arial,sans-serif}main{max-width:1000px;margin:auto;padding:36px 24px}header{border-bottom:1px solid #bfb9c8;padding-bottom:24px}h1{font:normal 54px/1.1 Georgia,serif;margin:12px 0}h2{font:normal 30px/1.2 Georgia,serif;margin:8px 0 16px}.eyebrow,.meta{font-size:12px;letter-spacing:.04em}.intro{max-width:65ch}.figure{position:relative;background:#e5e3ec;margin:24px 0}svg{display:block;width:100%;height:auto}.export-pin{position:absolute;display:grid;place-items:center;transform:translate(-50%,-50%);width:44px;height:44px;text-decoration:none}.export-pin span{display:grid;place-items:center;background:#b9462c;color:#fff;width:30px;height:30px;border:2px solid #fff;border-radius:50%;font:700 13px/1 Arial,sans-serif;box-shadow:0 1px 5px #28252f25}.export-pin.draft span{border-style:dashed}.export-index{border-bottom:1px solid #c5c0ce;padding:12px 0 22px;display:grid;gap:4px}.export-index a{display:flex;gap:10px;align-items:center;min-height:44px;font-size:14px;color:inherit;text-underline-offset:4px;overflow-wrap:anywhere}.export-index b{font-weight:400;min-width:24px}article{padding:28px 0;border-bottom:1px solid #c5c0ce;scroll-margin-top:24px}article p{max-width:74ch;white-space:pre-wrap;overflow-wrap:anywhere}h2{overflow-wrap:anywhere}.back-to-drawing{display:inline-flex;align-items:center;min-height:44px;color:inherit;font-size:13px;text-underline-offset:4px}footer{padding:28px 0;font-size:12px;color:#655f70}a:focus{outline:3px solid #b9462c;outline-offset:3px}button{font:14px Arial;padding:12px 16px;background:#28252f;color:#fff;border:0;cursor:pointer}@media(max-width:400px){h1{font-size:40px}main{padding:24px 18px}.meta{font-size:11px}}@media print{button,.back-to-drawing{display:none}body{background:white}main{max-width:none;padding:0}article{break-inside:avoid}.figure{break-inside:avoid}.export-index{display:none}}</style></head><body><main><header><div class="eyebrow">FOLIO / OBJECTS FOR THE QUIET HOUR / STUDY 04</div><h1>The hush vessel</h1><p>Maëlle Dorian · Fictional ceramic study, 2026</p><p class="intro">A small vessel, folded inward. An original imagined object and illustration. No physical measurements are implied.</p><p class="meta">${pins.length} annotated ${pins.length===1?'pin':'pins'} · Exported ${esc(new Date().toISOString())}. Drafts are current working versions, distinct from saved checkpoints.</p><button onclick="window.print()">Print this study</button></header><div class="figure" id="drawing">${svg.outerHTML}${anchors}</div><nav class="export-index" aria-label="Complete note index">${index}</nav><section aria-label="Complete observations">${notes}</section><footer>Folio — a small exhibition for a slower look. This self-contained file includes the original illustration, anchors, and complete notes. It makes no network requests and uses built-in browser fonts. Visitor annotations remain their own words.</footer></main></body></html>`;
}
$('export-study').addEventListener('click',()=>{if(!state.pins.length){say('Add a note before exporting.');return;}const blob=new Blob([exportHTML()],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='folio-hush-vessel-study.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);say(`Annotated study prepared with ${state.pins.length} pins, including ${state.pins.filter(dirty).length} drafts. Your browser handles the download.`);});
window.addEventListener('beforeunload',event=>{if(volatile){event.preventDefault();event.returnValue='';}});
window.folioStudy=Object.freeze({storageKey:STORAGE_KEY,getState:()=>copy(state),isDraft:id=>{const p=state.pins.find(p=>p.id===id);return p?dirty(p):null;},exportHTML,limits:Object.freeze({maxPins:MAX_PINS,title:64,note:600,minPosition:4,maxPosition:96})});
setupAnchorContext();renderAll();renderStorage(initialMessage);
})();
