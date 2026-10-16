import { STORAGE_KEY, STATUSES, MAX_NOTE, MAX_BACKUP_BYTES, initialState, parseState, recordFor, recordsFor, queryRecords, filteredRecords, countsFor, setDraft, cancelDraft, saveDraft, companions, isId } from './model.mjs';
const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
let state = initialState();
let storageMode = 'ready';
let storageReason = '';
let writeVerified = false;
let editing = false;
let message = '';
let messageTone = '';
function readDevice() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      try { state = parseState(raw); }
      catch { storageMode = 'invalid'; storageReason = 'Stored data could not be validated. Sample records are open; the stored copy has been left unchanged.'; return; }
    }
    storageMode = 'ready';
  } catch { storageMode = 'blocked'; storageReason = 'Device storage is unavailable. Keep this tab open or download a backup before leaving.'; }
}
readDevice();
const requestedId = new URLSearchParams(location.search).get('id');
if (isId(requestedId)) state.selectedId = requestedId;
function persist() {
  if (storageMode === 'invalid') return false;
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    const readback = localStorage.getItem(STORAGE_KEY);
    if (readback !== raw) throw new Error('Readback mismatch');
    parseState(readback);
    storageMode = 'ready'; storageReason = ''; writeVerified = true; return true;
  } catch { storageMode = 'blocked'; writeVerified = false; storageReason = 'Device storage is unavailable. Keep this tab open or download a backup before leaving.'; return false; }
}
function el(tag, className, text) { const n=document.createElement(tag); if(className)n.className=className; if(text !== undefined)n.textContent=text; return n; }
function badge(status) { const n=el('span',`status ${status.toLowerCase()}`,status); return n; }
function formatTime(iso) { if(!iso)return 'Original sample'; return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)); }
function routeLinks() {
  document.querySelectorAll('[data-record-link]').forEach(a => a.href=`demo.html?id=${state.selectedId}`);
  document.querySelectorAll('[data-desk-link]').forEach(a => a.href=`index.html?id=${state.selectedId}#records`);
  document.querySelectorAll('[data-current-id]').forEach(n=>n.textContent=state.selectedId);
}
function renderStorage() {
  const ready = storageMode === 'ready';
  document.querySelectorAll('[data-storage-label]').forEach(n=>{n.textContent=ready?'Device saving available':'Session only';n.classList.toggle('unavailable',!ready);});
  if ($('storage-message')) $('storage-message').textContent = ready ? 'Saved changes and drafts stay in this browser. Download a backup before moving to another device.' : storageReason;
  if ($('storage-warning')) { $('storage-warning').hidden=ready; $('storage-warning').textContent=storageReason; }
  if ($('retry-storage')) $('retry-storage').textContent=storageMode==='invalid'?'Keep stored copy · continue session':'Retry device storage';
  if ($('storage-feedback')) $('storage-feedback').textContent = ready ? (writeVerified ? 'Device write and readback succeeded.' : 'Stored workspace checked. New changes are verified when saved.') : storageReason;
  const totalDrafts=Object.keys(state.drafts).length;
  if ($('draft-total')) $('draft-total').textContent=totalDrafts?`${totalDrafts} unsaved ${totalDrafts===1?'draft':'drafts'}`:'No unsaved drafts';
}
function renderSummary() {
  const counts=countsFor(recordsFor(state));
  for(const s of STATUSES) if($(`total-${s.toLowerCase()}`)) $(`total-${s.toLowerCase()}`).textContent=String(counts[s]).padStart(2,'0');
}
function row(record, compact=false) {
  const button=el('button', compact?'peer-record':'record'); button.type='button'; button.dataset.recordId=record.id;
  if(record.id===state.selectedId){button.classList.add('selected');button.setAttribute('aria-current','true');}
  button.append(el('span','record-id',record.id));
  const name=el('span','record-name',record.species); name.append(el('small','',record.location)); button.append(name);
  if(!compact) { const date=el('span','record-date',record.inspected); date.append(el('small','','Last inspected')); button.append(date); }
  button.append(badge(record.status));
  if(state.drafts[record.id]) { const draft=el('span','draft-marker','Draft'); button.append(draft); }
  button.addEventListener('click',()=>selectRecord(record.id,true)); return button;
}
function renderCollection() {
  if(!$('record-list'))return;
  const results=filteredRecords(state), counts=countsFor(queryRecords(state));
  $('result-count').textContent=`${results.length} of 9 records`;
  $('record-list').replaceChildren(...results.map(r=>row(r)));
  $('empty-results').hidden=results.length>0;
  $('empty-description').textContent=state.query.trim()?`No ${state.filter==='All'?'':state.filter.toLowerCase()+' '}records match “${state.query.trim()}”.`:`There are no records with status ${state.filter}.`;
  for(const s of ['All',...STATUSES]) {
    const b=document.querySelector(`[data-filter="${s}"]`); b.setAttribute('aria-pressed',String(state.filter===s));b.classList.toggle('active',state.filter===s);b.querySelector('.filter-count').textContent=counts[s];
  }
  $('clear-filters').hidden=!state.query && state.filter==='All';
  const shown=results.some(r=>r.id===state.selectedId);
  if($('outside-results')) { $('outside-results').hidden=shown; $('outside-results').textContent=`${state.selectedId} remains selected outside these results.`; }
}
function renderCompanions() {
  if(!$('companion-list'))return;
  const record=recordFor(state), matches=companions(state);
  $('companion-title').textContent=matches.length?`Also on ${record.place}`:'Compare quarter records';
  $('companion-context').textContent=matches.length?'These records share the same named road. No distance or route is implied.':'No other record shares this named place. Choose a quarter record to compare its saved facts.';
  const candidates=matches.length?matches:recordsFor(state).filter(r=>r.id!==record.id).slice(0,3);
  $('companion-list').replaceChildren(...candidates.map(r=>{
    const card=el('article','peer-comparison');
    const button=row(r,true);button.setAttribute('aria-label',`Open ${r.id}, ${r.species}`);card.append(button);
    const facts=el('dl','peer-facts');const group=el('div');group.append(el('dt','','Last inspected'),el('dd','',r.inspected));facts.append(group);card.append(facts);
    const note=el('p','peer-note',r.note.trim()||'No inspection note recorded.');
    if(r.note.length>220){const disclosure=el('details','peer-note-expansion');disclosure.append(el('summary','','Read saved note'),note);card.append(disclosure);}else card.append(note);
    return card;
  }));
}
function setTextareaHeight() {const a=$('inspection-note');if(!a)return;a.style.height='auto';a.style.height=`${Math.max(144,a.scrollHeight+2)}px`;}
function renderInspector() {
  if(!$('inspector'))return;
  const r=recordFor(state), draft=state.drafts[r.id];
  editing=editing || !!draft;
  $('selected-id').textContent=r.id; $('selected-species').textContent=r.species; $('selected-location').textContent=r.location;
  $('selected-status').replaceChildren(badge(r.status));
  $('last-inspected').textContent=r.inspected; $('local-edit').textContent=formatTime(r.editedAt);
  $('saved-note').textContent=r.note.trim()?r.note:'No inspection note recorded.';
  $('saved-label').textContent=r.editedAt?'Saved inspection note':'Inspection note';
  $('saved-note').classList.toggle('empty-note',!r.note.trim());
  $('editor').hidden=!editing; $('edit-button').hidden=editing;
  $('inspection-status').value=draft?.status ?? r.status;
  $('inspection-note').value=draft?.note ?? r.note;
  $('note-count').textContent=`${$('inspection-note').value.length.toLocaleString('en-GB')} / 4,000`;
  $('draft-state').textContent=draft?(storageMode==='ready'?'Unsaved draft · kept on this device':'Unsaved draft · this session only'):'Changes are saved only when you choose Save changes.';
  $('edit-record-id').textContent=r.id;
  $('inspector').dataset.selectedId=r.id;
  $('inspection-feedback').textContent=message; $('inspection-feedback').dataset.tone=messageTone;
  renderCompanions(); setTextareaHeight();
  if(page==='record')document.title=`${r.id} · ${r.species} — CANOPY`;
}
function renderAll() {routeLinks();renderStorage();renderSummary();renderCollection();renderInspector();}
function writeURL() { const u=new URL(location.href);u.searchParams.set('id',state.selectedId);history.replaceState(null,'',u); }
function focusInspector() { if(!$('inspector'))return; $('selected-species').focus({preventScroll:true});$('inspector').scrollIntoView({block:'start',behavior:'instant'}); }
function selectRecord(id,user=false) {
  state.selectedId=id; editing=!!state.drafts[id]; message='';persist();writeURL();renderAll();
  if(user && (page==='record'||matchMedia('(max-width: 800px)').matches))focusInspector();
}
function inputDraft() {
  state=setDraft(state,state.selectedId,{status:$('inspection-status').value,note:$('inspection-note').value});
  persist();message='';$('inspection-feedback').textContent='';
  $('note-count').textContent=`${$('inspection-note').value.length.toLocaleString('en-GB')} / 4,000`;
  $('draft-state').textContent=storageMode==='ready'?'Unsaved draft · kept on this device':'Unsaved draft · this session only';
  renderCollection();renderStorage();setTextareaHeight();
}
function beginEdit() {
  editing=true;message='';renderInspector();$('inspection-note').focus();$('editor').scrollIntoView({block:'nearest',behavior:'instant'});
}
if($('record-search')) {
  $('record-search').value=state.query;
  $('record-search').addEventListener('input',e=>{state.query=e.target.value.slice(0,120);persist();renderCollection();renderStorage();});
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;persist();renderCollection();renderStorage();}));
  const clear=()=>{state.query='';state.filter='All';$('record-search').value='';persist();renderCollection();renderStorage();$('record-search').focus();};
  $('clear-filters').addEventListener('click',clear);$('empty-clear').addEventListener('click',clear);
}
if($('edit-button')) {
  $('edit-button').addEventListener('click',beginEdit);
  $('edit-jump')?.addEventListener('click',e=>{e.preventDefault();beginEdit();});
  $('inspection-note').addEventListener('input',inputDraft);$('inspection-status').addEventListener('change',inputDraft);
  $('editor').addEventListener('submit',e=>{
    e.preventDefault();
    try {
      state=setDraft(state,state.selectedId,{status:$('inspection-status').value,note:$('inspection-note').value});
      state=saveDraft(state,state.selectedId);const saved=persist();editing=false;
      message=saved?`${state.selectedId} saved on this device. Note and status updated.`:`${state.selectedId} updated for this session. Device saving failed; download a backup before leaving.`;
      messageTone=saved?'success':'warning';renderAll();$('saved-note').focus({preventScroll:true});$('saved-section').scrollIntoView({block:'nearest',behavior:'instant'});
    } catch(error){message=error.message;messageTone='warning';$('inspection-feedback').textContent=message;}
  });
  $('cancel-edit').addEventListener('click',()=>{state=cancelDraft(state,state.selectedId);editing=false;const saved=persist();message=`Draft discarded. The saved note and status are unchanged.${saved?'':' Device storage is unavailable.'}`;messageTone='';renderAll();$('edit-button').focus();});
}
if($('current-jump'))$('current-jump').addEventListener('click',e=>{e.preventDefault();focusInspector();});
if($('retry-storage'))$('retry-storage').addEventListener('click',()=>{
  if(storageMode==='invalid'){ $('recovery-feedback').textContent='The unrecognized stored copy is preserved. Download this session or choose Reset sample records to replace it.';return; }
  const ok=persist();renderStorage();$('recovery-feedback').textContent=ok?'This session was saved and verified on this device.':'Storage is still unavailable. Your session work is still here.';
});
if($('download-backup'))$('download-backup').addEventListener('click',()=>{
  let url;
  try {parseState(JSON.stringify(state));const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='canopy-workspace-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('recovery-feedback').textContent='Backup download requested. It contains all saved records, drafts and your current selection.';}
  catch{$('recovery-feedback').textContent='The backup could not be prepared. Keep this tab open and try again.';if(url)URL.revokeObjectURL(url);}
});
if($('restore-backup'))$('restore-backup').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try {
    if(f.size>MAX_BACKUP_BYTES)throw new Error(`Choose a CANOPY JSON backup no larger than ${MAX_BACKUP_BYTES / 1024} KiB.`);
    const restored=parseState(await f.text());state=restored;storageMode='ready';editing=!!state.drafts[state.selectedId];const ok=persist();message='';writeURL();if($('record-search'))$('record-search').value=state.query;renderAll();
    $('recovery-feedback').textContent=ok?'Backup restored and verified on this device.': 'Backup restored for this session. Device storage remains unavailable.';
  }catch(error){$('recovery-feedback').textContent=`Could not restore: ${error.message} Current work is unchanged.`;}
  e.target.value='';
});
if($('reset-sample')) {
  $('reset-sample').addEventListener('click',()=>{$('reset-confirm').hidden=false;$('confirm-reset').focus();});
  $('cancel-reset').addEventListener('click',()=>{$('reset-confirm').hidden=true;$('reset-sample').focus();});
  $('confirm-reset').addEventListener('click',()=>{state=initialState();storageMode='ready';editing=false;message='';const ok=persist();writeURL();if($('record-search'))$('record-search').value='';$('reset-confirm').hidden=true;renderAll();$('recovery-feedback').textContent=ok?'The nine original sample records were restored and saved.':'The nine original sample records were restored for this session. Device storage remains unavailable.';});
}
window.addEventListener('pageshow',()=>{if($('inspection-note'))setTextareaHeight();});
renderAll();
if(location.hash==='#edit' && $('edit-button'))beginEdit();
