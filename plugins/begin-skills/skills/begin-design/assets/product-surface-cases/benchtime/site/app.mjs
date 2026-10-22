import {DAYS,MACHINES,OCCUPIED,money,time,parseTime,overlaps,cost,validate,readDraft,csv} from './model.mjs';
const $=id=>document.getElementById(id);
const WORK='benchtime-working-v1',SAVED='benchtime-saved-v1';
let current={day:'2026-11-07',machine:'laser',start:600,end:660,purpose:''},segments=[],editingId=null,storageFailed=false;
let startupMessage='';
try{const raw=sessionStorage.getItem(WORK);if(raw){const r=readDraft(raw);current=r.current;segments=r.segments;editingId=r.editingId;}}catch{startupMessage='The tab’s working draft could not be restored. Your saved checkpoint, if available, is separate.';}
const params=new URLSearchParams(location.search);
if(Object.hasOwn(DAYS,params.get('day')))current.day=params.get('day');
if(Object.hasOwn(MACHINES,params.get('machine')))current.machine=params.get('machine');
const queryStart=parseTime(params.get('start')),queryEnd=parseTime(params.get('end'));
if(queryStart>=540&&queryStart<1080&&queryStart%30===0)current.start=queryStart;
if(queryEnd>540&&queryEnd<=1080&&queryEnd%30===0)current.end=queryEnd;
if(params.get('example')==='saturday'){current={day:'2026-11-07',machine:'laser',start:600,end:660,purpose:'Market stall sign for Róisín O’Connell'};editingId=null;startupMessage='Saturday at the laser is ready to shape. Check the hour and add it to your request.';}
for(let m=540;m<1080;m+=30)$('start').add(new Option(time(m),time(m)));
for(let m=570;m<=1080;m+=30)$('end').add(new Option(time(m),time(m)));
function pack(){return {version:1,current,segments,editingId,savedAt:new Date().toISOString()};}
function feedback(message,error=false){$('operation-feedback').textContent=message;$('operation-feedback').className='operation-feedback'+(error?' error':'');}
function persist(){try{const raw=JSON.stringify(pack());sessionStorage.setItem(WORK,raw);if(sessionStorage.getItem(WORK)!==raw)throw Error('Unverified');storageFailed=false;}catch{storageFailed=true;feedback('Working changes could not be kept for this tab. Export your request before leaving the planner.',true);}}
function url(){const p=new URLSearchParams({day:current.day,machine:current.machine,start:time(current.start),end:time(current.end)});history.replaceState(null,'',location.pathname+'?'+p.toString()+location.hash);}
function syncForm(){$('start').value=time(current.start);$('end').value=time(current.end);$('purpose').value=current.purpose;}
function readForm(){current.start=parseTime($('start').value);current.end=parseTime($('end').value);current.purpose=$('purpose').value;}
function duration(minutes){const h=Math.floor(minutes/60),m=minutes%60;return [h?`${h} ${h===1?'hour':'hours'}`:'',m?`${m} minutes`:''].filter(Boolean).join(' ');}
function renderSchedule(){
 const f=MACHINES[current.machine];$('availability-title').textContent=f.name;$('rate').textContent='€'+f.cents/100;$('view-facts').textContent=DAYS[current.day].full+' · 09:00–18:00';
 document.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.day===current.day)));
 document.querySelectorAll('[data-machine]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.machine===current.machine)));
 $('schedule').replaceChildren();
 for(const [label,start] of [['Morning',540],['Midday',720],['Afternoon',900]]){
  const group=document.createElement('div');group.className='time-group';const h=document.createElement('h3');h.textContent=label;group.append(h);
  for(let t=start;t<start+180;t+=30){
   const interval={start:t,end:t+30};const busy=OCCUPIED.some(b=>b.day===current.day&&b.machine===current.machine&&overlaps(interval,b));const added=segments.some(b=>b.day===current.day&&b.machine===current.machine&&overlaps(interval,b));const selected=overlaps(interval,current);
   const status=busy?'Occupied':added?'In request':selected?'Selected':'Available';const button=document.createElement('button');button.type='button';button.className=(busy?'occupied':added?'added':selected?'selected':'available')+(selected?' current-selection':'');button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-label',`${time(t)} to ${time(t+30)}, ${status}${selected&&status!=='Selected'?', selected':''}, ${f.name}, ${DAYS[current.day].short}`);
   const stamp=document.createElement('span');stamp.className='slot-time';stamp.textContent=time(t)+'–'+time(t+30);const state=document.createElement('span');state.className='slot-state';state.textContent=status;button.append(stamp,state);
   button.addEventListener('click',()=>{readForm();current.start=t;current.end=t+30;syncForm();update();focusEditor();});group.append(button);
  }$('schedule').append(group);
 }
}
function focusEditor(){if(matchMedia('(max-width:760px)').matches)$('session-form').scrollIntoView({block:'start',behavior:'instant'});$('start').focus();}
function backToTimes(){const tile=$('schedule').querySelector('button[aria-pressed=true]')||$('schedule').querySelector('button');tile.scrollIntoView({block:'center',behavior:'instant'});tile.focus({preventScroll:true});}
function renderCheckpoint(){
 try{
  const raw=localStorage.getItem(SAVED);if(!raw){$('saved-fact').textContent='No saved checkpoint in this browser. Save draft to make one.';return;}
  let saved;try{saved=readDraft(raw);}catch{$('saved-fact').textContent='The saved checkpoint could not be read. Current work is unchanged; save a new checkpoint or export a file.';return;}
  const signature=d=>JSON.stringify([d.segments.map(s=>[s.id,s.day,s.machine,s.start,s.end,s.purpose]),[d.current.day,d.current.machine,d.current.start,d.current.end,d.current.purpose],d.editingId||null]);
  const date=new Date(saved.savedAt),stamp=saved.savedAt&&!Number.isNaN(date.valueOf())?new Intl.DateTimeFormat('en-IE',{timeZone:'Europe/Dublin',dateStyle:'medium',timeStyle:'short'}).format(date)+' Dublin':'saved time unavailable';
  const same=signature(saved)===signature({segments,current,editingId});
  $('saved-fact').textContent=`Saved checkpoint: ${saved.segments.length} ${saved.segments.length===1?'session':'sessions'} · ${stamp}. `+(same?'Working draft matches this checkpoint.':'Working changes differ. Restore replaces the current request and selection.');
 }catch{$('saved-fact').textContent='Saved checkpoints are unavailable in this browser. Keep an exported file if you need a copy.';}
}
function renderValidation(){
 const error=validate(current,segments,editingId);const mins=current.end-current.start;const inRequest=!editingId&&segments.some(s=>s.day===current.day&&s.machine===current.machine&&s.start===current.start&&s.end===current.end);
 $('duration').textContent=mins>0?duration(mins)+' · estimate':'Choose an end time';$('session-cost').textContent=mins>0?money(cost(current)):'—';$('purpose-count').textContent=current.purpose.length;$('confirm-machine').textContent=MACHINES[current.machine].name;$('confirm-day').textContent=DAYS[current.day].short+' 2026 · Dublin';$('confirm-time').textContent=time(current.start)+'–'+time(current.end);
 const purposeOnly=error.startsWith('Add a short purpose');$('validation').textContent=inRequest?'This time is in your request. Use Edit below to change it, or choose another time.':error||(editingId?'This update fits. Your original stays until you update it.':'This time is free and fits your plan.');$('validation').className='validation '+(error&&!purposeOnly&&!inRequest?'error':'ok');$('add-session').disabled=inRequest;
 $('editor-title').textContent=editingId?'Edit your session':'Shape your session';$('add-session').replaceChildren(document.createTextNode(editingId?'Update session':'Add to request'));const arrow=document.createElement('span');arrow.className='arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent=editingId?'↗':'+';$('add-session').append(arrow);$('cancel-edit').hidden=!editingId;
}
function renderRequest(){
 $('jump-count').textContent=' '+segments.length+' / 3';$('request-count').textContent=segments.length+' / 3';
 $('request-description').textContent=editingId?'You’re editing a session. Choose Update session to apply your changes.':segments.length?'Prepared locally — not submitted. Check every session before you export or discuss it with staff.':'Add your first session above. You can prepare up to three, across either day.';
 if(!segments.length){$('request-list').innerHTML='<div class="empty-request"><svg viewBox="0 0 50 50" aria-hidden="true"><path d="M6 13h38v32H6ZM6 22h38M15 5v15M35 5v15M16 31h6M28 31h6M16 37h6" fill="none" stroke="currentColor" stroke-width="2"/></svg><p>A clear plan starts with one free hour. Choose a time and tell the staff what you’re making.</p></div>';}
 else{$('request-list').replaceChildren();segments.forEach((s,i)=>{
  const row=document.createElement('article');row.className='request-row';row.setAttribute('aria-label',`Session ${i+1}: ${MACHINES[s.machine].name}`);
  const num=document.createElement('span');num.className='request-num';num.textContent=String(i+1).padStart(2,'0');
  const info=document.createElement('div');info.className='request-info';const date=document.createElement('p');date.className='request-date';date.textContent=DAYS[s.day].full;const title=document.createElement('h3');title.textContent=MACHINES[s.machine].name;const times=document.createElement('p');times.className='request-time';times.textContent=time(s.start)+'–'+time(s.end);info.append(date,title,times);
  const purpose=document.createElement('p');purpose.className='request-purpose';purpose.textContent=s.purpose;
  const price=document.createElement('div');price.className='row-price';price.textContent=money(cost(s));const priceFacts=document.createElement('small');priceFacts.textContent=duration(s.end-s.start)+' at '+money(MACHINES[s.machine].cents)+'/h';price.append(priceFacts);
  const actions=document.createElement('div');actions.className='row-actions';for(const action of ['edit','remove']){const b=document.createElement('button');b.type='button';b.dataset.action=action;b.textContent=action==='edit'?'Edit':'Remove';b.setAttribute('aria-label',`${b.textContent} session ${i+1}, ${MACHINES[s.machine].name}`);b.addEventListener('click',()=>action==='edit'?edit(s.id):remove(s.id));actions.append(b);}row.append(num,info,purpose,price,actions);$('request-list').append(row);
 });}
 const mins=segments.reduce((n,s)=>n+s.end-s.start,0),total=segments.reduce((n,s)=>n+cost(s),0);$('total-cost').textContent=money(total);$('total-hours').replaceChildren(document.createTextNode(segments.length?`${segments.length} ${segments.length===1?'session':'sessions'} · ${duration(mins)}`:'No sessions yet'));const note=document.createElement('small');note.textContent='Estimates only · no payment is taken';$('total-hours').append(note);
 $('export-csv').disabled=$('export-html').disabled=!segments.length;
}
function update(){renderSchedule();renderValidation();renderRequest();persist();renderCheckpoint();url();}
function edit(id){readForm();const s=segments.find(s=>s.id===id);current={day:s.day,machine:s.machine,start:s.start,end:s.end,purpose:s.purpose};editingId=id;syncForm();feedback('Editing this session. The original remains in your request until you update it.');update();$('session-form').scrollIntoView({block:'start',behavior:'instant'});$('start').focus();}
function remove(id){const index=segments.findIndex(s=>s.id===id);segments=segments.filter(s=>s.id!==id);if(editingId===id)editingId=null;update();feedback(`Session ${index+1} removed from the working request. A saved checkpoint is unchanged.`);}
$('session-form').addEventListener('submit',event=>{event.preventDefault();readForm();const error=validate(current,segments,editingId);if(error){renderValidation();$('validation').textContent=error;$('validation').className='validation error';return;}
 const s={...current,purpose:current.purpose.trim(),id:editingId||'bt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)};const changed=!!editingId;if(changed)segments=segments.map(old=>old.id===editingId?s:old);else segments.push(s);editingId=null;current.purpose=s.purpose;syncForm();update();feedback(changed?'Session updated in your local request.':'Session added to your local request. Nothing has been reserved or sent.');if(matchMedia('(max-width:760px)').matches){$('request').scrollIntoView({block:'start'});$('request-title').focus({preventScroll:true});}});
$('back-to-times').addEventListener('click',backToTimes);
$('cancel-edit').addEventListener('click',()=>{editingId=null;update();feedback('Edit cancelled. The original session remains in your request.');});
for(const id of ['start','end'])$(id).addEventListener('change',()=>{readForm();update();});
$('purpose').addEventListener('input',()=>{readForm();renderValidation();persist();renderCheckpoint();});
for(const b of document.querySelectorAll('[data-day]'))b.addEventListener('click',()=>{readForm();current.day=b.dataset.day;update();});
for(const b of document.querySelectorAll('[data-machine]'))b.addEventListener('click',()=>{readForm();current.machine=b.dataset.machine;update();});
$('save').addEventListener('click',()=>{readForm();try{const data=JSON.stringify(pack());localStorage.setItem(SAVED,data);if(localStorage.getItem(SAVED)!==data)throw Error('Save unverified');feedback(`Draft saved in this browser with ${segments.length} ${segments.length===1?'session':'sessions'}.`);renderCheckpoint();}catch{feedback('This browser could not save the draft. Your current work is still here; export a file to keep it.',true);}});
$('restore').addEventListener('click',()=>{try{const raw=localStorage.getItem(SAVED);if(!raw){feedback('There is no saved checkpoint in this browser yet. Use Save draft first.',true);return;}const restored=readDraft(raw);current=restored.current;segments=restored.segments;editingId=restored.editingId;syncForm();update();feedback(`Saved draft restored with ${segments.length} ${segments.length===1?'session':'sessions'}. It replaces the working request.`);}catch{feedback('The saved draft is unavailable or invalid. Your current work has been kept; you can save a new checkpoint or export it.',true);}});
function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function exportHTML(){const total=segments.reduce((n,s)=>n+cost(s),0);return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BENCHTIME prepared request</title><style>*{box-sizing:border-box}body{font:17px/1.6 system-ui,sans-serif;max-width:850px;margin:40px auto;padding:0 22px;color:#173e35;background:#f4f1e5}h1{font-size:42px;line-height:1.1}h2{line-height:1.2;margin-bottom:10px}article{border-top:1px solid;padding:20px 0}p{overflow-wrap:anywhere}.facts{font-family:monospace;font-size:15px}.total{font-size:27px;border-top:2px solid;padding-top:20px}.note{border-left:4px solid #d94f30;padding-left:15px}@media print{body{background:white;margin:0 auto}}</style><body><p>BENCHTIME / PREPARED REQUEST</p><h1>A little making time</h1><p class="note"><strong>Prepared locally — not submitted or booked.</strong><br>No staff member has received this request, no payment has been taken and no time has been reserved.</p><p>All dates and times are local to Dublin (Europe/Dublin). Workshop hours: 09:00–18:00. Estimates in EUR.</p>'+segments.map((s,i)=>'<article><p class="facts">SESSION '+(i+1)+' · '+escape(DAYS[s.day].full)+'</p><h2>'+MACHINES[s.machine].name+'</h2><p class="facts">'+time(s.start)+'–'+time(s.end)+' · '+duration(s.end-s.start)+' · '+money(MACHINES[s.machine].cents)+'/hour</p><p>'+escape(s.purpose)+'</p><strong>Estimated '+money(cost(s))+'</strong></article>').join('')+'<p class="total">'+segments.length+' '+(segments.length===1?'session':'sessions')+' · Total estimate '+money(total)+'</p><p>Keep this plan to discuss with workshop staff. An approved reservation is outside this fictional demo.</p></body></html>';}
function download(kind){if(!segments.length){feedback('Add a valid session before exporting your request.',true);return;}if(editingId){feedback('Update or cancel the session edit before exporting the complete request.',true);return;}const text=kind==='csv'?csv(segments):exportHTML();const blob=new Blob([text],{type:kind==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8'});const target=URL.createObjectURL(blob);const a=document.createElement('a');a.href=target;a.download='benchtime-request.'+kind;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(target),30000);feedback(`${kind==='csv'?'CSV':'Readable HTML'} request exported with ${segments.length} ${segments.length===1?'session':'sessions'}. The request has not been submitted.`);}
$('export-csv').addEventListener('click',()=>download('csv'));$('export-html').addEventListener('click',()=>download('html'));
// Protect all ordinary links if this browser cannot retain the working tab copy.
document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(a&&storageFailed&&(segments.length||current.purpose.trim())&&!a.getAttribute('href').startsWith('#')){if(!confirm('This browser could not keep the working draft. Export it before leaving if you need a copy. Leave this page now?'))event.preventDefault();}});
window.addEventListener('storage',event=>{if(event.key===SAVED)renderCheckpoint();});
syncForm();update();if(startupMessage)feedback(startupMessage);
