import { DEFAULT_QUERY, STORAGE_KEY, initialState, changeQuery, prepareState, canRetain, selectRoute, stopName, serviceName, formatClock, exportText, encodeKept, decodeKept } from './coremodel.mjs';
const byId=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rawFromForm=()=>({origin:byId('origin').value,destination:byId('destination').value,earliest:byId('earliest').value});
let state=initialState(DEFAULT_QUERY);
let savedText=null;
let savedRecord=null;
let storageReadable=true;
function writeForm() {for(const key of ['origin','destination','earliest'])byId(key).value=state.raw[key];}
function clearFeedback() {byId('local-feedback').textContent='';byId('keep-feedback').textContent='';byId('download-feedback').textContent='';}
function refreshSaved() {
  try {savedText=localStorage.getItem(STORAGE_KEY);savedRecord=savedText?decodeKept(savedText):null;storageReadable=true;}
  catch {savedText=null;savedRecord=null;storageReadable=false;}
  byId('recover-card').disabled=!savedRecord?.valid;
  byId('forget-card').disabled=!savedText;
  if(!storageReadable)byId('saved-description').textContent='This browser is blocking access to local storage. A current card can still be downloaded.';
  else if(savedRecord?.valid){const q=savedRecord.state.prepared.query;byId('saved-description').textContent=`A kept card is available: ${stopName(q.origin)} to ${stopName(q.destination)}, earliest ${formatClock(q.earliestMinute)}. Recover it deliberately.`;}
  else if(savedRecord)byId('saved-description').textContent=savedRecord.error;
  else byId('saved-description').textContent='No card has been kept here. Keeping stores this full query and all prepared options on this browser only.';
}
function renderStatus() {
  for(const key of ['origin','destination','earliest']) {
    const error=state.errors[key];byId(`${key}-error`).textContent=error??'';byId(`${key}-error`).hidden=!error;
    byId(key).setAttribute('aria-invalid',error?'true':'false');
  }
  const status=byId('query-status');status.className=`status ${state.status}`;
  const old=byId('old-card-notice');old.hidden=state.status==='ready';
  if(state.status==='invalid') {
    status.textContent='Correct the field error, then prepare again. Your previous complete result is preserved.';
    old.textContent='Previous result — current inputs are invalid. Keeping and downloading are blocked until a valid preparation.';
  } else if(state.status==='stale') {
    status.textContent='Inputs changed. Prepare again to make a current card.';
    old.textContent='Previous result — inputs changed. These cards still describe the prepared query shown above. Prepare again before keeping or downloading.';
  } else {
    status.textContent=state.prepared.routes.length?`${state.prepared.routes.length} current options prepared. Select a card to keep.`:'Valid query prepared. No route is available in this fixed schedule.';
  }
  const allowed=canRetain(state);
  byId('keep-card').disabled=!allowed;byId('download-card').disabled=!allowed;byId('active-card').disabled=!allowed;
  byId('retention-help').textContent=allowed?'Current cards are ready to keep or download.':state.status==='ready'?'There is no available route to keep for this query. Choose another query and prepare again.':'The previous result stays readable. Prepare valid current inputs to enable keeping and downloading.';
  document.querySelectorAll('[data-select-route]').forEach(radio=>radio.disabled=state.status!=='ready');
}
function renderRoutes() {
  const prepared=state.prepared;
  if(!prepared)return;
  const q=prepared.query;
  byId('prepared-query').textContent=`${stopName(q.origin)} → ${stopName(q.destination)} · earliest ${formatClock(q.earliestMinute)}`;
  byId('option-count').textContent=`${prepared.routes.length} ${prepared.routes.length===1?'option':'options'}`;
  byId('active-card').innerHTML=prepared.routes.length?prepared.routes.map((route,index)=>`<option value="${escape(route.id)}"${state.selectedRouteId===route.id?' selected':''}>${String(index+1).padStart(2,'0')} — ${formatClock(route.arrivalMinute)}</option>`).join(''):'<option>No current route</option>';
  const active=prepared.routes.find(route=>route.id===state.selectedRouteId);
  const activeIndex=prepared.routes.findIndex(route=>route.id===state.selectedRouteId);
  byId('active-card-summary').textContent=active?`Option ${String(activeIndex+1).padStart(2,'0')} · ${active.transfers} ${active.transfers===1?'transfer':'transfers'} · ${active.journeyMinutes} min journey`:'';
  byId('read-selected-card').hidden=!active;byId('read-selected-card').href=active?`#option-${activeIndex}`:'#route-options';

  const container=byId('route-options');
  if(!prepared.routes.length) {
    container.innerHTML='<div class="empty"><h3>No route for this evening.</h3><p>No listed service reaches that destination after your earliest departure. The schedule has no implied return services.</p><p>Try Musée des Ondes → West Observatory at 18:00 for a direct route, or <a href="guide.html#schedule">read the complete schedule</a>.</p></div>';
    return;
  }
  container.innerHTML=prepared.routes.map((route,index)=> {
    const selected=state.selectedRouteId===route.id;
    const number=String(index+1).padStart(2,'0');
    const arrival=formatClock(route.arrivalMinute).split(' ');
    const legs=route.legs.map((leg,legIndex)=>{
      const departure=formatClock(leg.departureMinute).split(' ');
      const transfer=legIndex?`<p class="transfer"><strong>${leg.waitMinutes} min transfer</strong> at ${escape(stopName(leg.origin))}</p>`:'';
      return `${transfer}<div class="leg"><div class="leg-time">${departure[0]}<span> ${leg.departureMinute>=1440?'Next day departure':'Departure'}</span></div><div><h4>${escape(stopName(leg.origin))} → ${escape(stopName(leg.destination))}</h4><p class="service-name"><strong>${escape(leg.serviceId)} · ${escape(serviceName(leg.serviceId))}</strong></p><p class="leg-facts"><span>Arrive <strong>${formatClock(leg.arrivalMinute)}</strong></span><span>${legIndex?'Transfer wait':'Wait before boarding'}: <strong>${leg.waitMinutes} min</strong></span><span>Travel on board: <strong>${leg.rideMinutes} min</strong></span></p></div><details class="calls"><summary>Scheduled calls · leg ${legIndex+1}</summary><ul>${leg.calls.map(call=>`<li>${escape(stopName(call.stopId))} — ${formatClock(call.minute)}</li>`).join('')}</ul></details></div>`;
    }).join('');
    return `<article class="travel-card${selected?' chosen':''}" aria-labelledby="option-${index}"><div class="card-top"><h3 class="card-title" id="option-${index}">Option ${number}${index===0?' · earliest arrival':''}</h3><label class="selection" for="route-${index}"><input type="radio" name="selected-card" id="route-${index}" data-select-route="${escape(route.id)}" value="${escape(route.id)}"${selected?' checked':''}>${selected?'Selected card':'Select this card'}</label></div><dl class="summary"><div><dt>Final arrival</dt><dd>${arrival[0]}${route.arrivalMinute>=1440?'<span class="day"> next day</span>':''}</dd></div><div><dt>Journey from earliest time</dt><dd>${route.journeyMinutes} min</dd></div><div><dt>Transfers</dt><dd>${route.transfers}</dd></div></dl>${legs}<p class="card-end"><span>Total waiting: <strong>${route.totalWaitMinutes} min</strong></span><span>Total on board: <strong>${route.totalRideMinutes} min</strong></span><a class="return-controls" href="#card-controls">Back to card controls ↑</a></p></article>`;
  }).join('');
}
function render() {renderRoutes();renderStatus();}
byId('query-form').addEventListener('input',()=>{clearFeedback();state=changeQuery(state,rawFromForm());renderStatus();});
byId('query-form').addEventListener('change',()=>{clearFeedback();state=changeQuery(state,rawFromForm());renderStatus();});
byId('query-form').addEventListener('submit',event=> {
  event.preventDefault();clearFeedback();state=prepareState(changeQuery(state,rawFromForm()));render();
  if(state.status==='invalid'){const first=['origin','destination','earliest'].find(key=>state.errors[key]);byId(first).focus();}
});
byId('route-options').addEventListener('change',event=> {
  const radio=event.target.closest('[data-select-route]');
  if(!radio||state.status!=='ready')return;
  state=selectRoute(state,radio.dataset.selectRoute);clearFeedback();const focusedId=radio.id;render();byId(focusedId)?.focus();
});
byId('active-card').addEventListener('change',()=> {
  if(!canRetain(state))return;
  state=selectRoute(state,byId('active-card').value);clearFeedback();render();byId('active-card').focus();
});
byId('keep-card').addEventListener('click',()=> {
  if(!canRetain(state))return;
  clearFeedback();
  try {localStorage.setItem(STORAGE_KEY,encodeKept(state));refreshSaved();byId('keep-feedback').textContent='Card kept in this browser. The full query, every option and your selected card are saved. Use Recover after a reload.';}
  catch {byId('keep-feedback').textContent='This browser could not keep the card. Your current result is intact; download the text card if you want a copy.';}
});
byId('recover-card').addEventListener('click',()=> {
  refreshSaved();
  if(!savedRecord?.valid)return;
  clearFeedback();state=savedRecord.state;writeForm();render();byId('local-feedback').textContent='Kept card recovered and verified against this demonstration schedule. It is current and ready to keep or download.';
});
byId('forget-card').addEventListener('click',()=> {
  clearFeedback();
  try {localStorage.removeItem(STORAGE_KEY);refreshSaved();byId('local-feedback').textContent='Kept browser card forgotten. Your current on-screen result remains available. Downloaded files are unchanged.';}
  catch {byId('local-feedback').textContent='This browser could not remove its kept card. Your current on-screen result is intact.';}
});
byId('download-card').addEventListener('click',()=> {
  if(!canRetain(state))return;
  clearFeedback();
  const blob=new Blob([exportText(state.prepared,state.selectedRouteId)],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='nightbus-travel-card.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  byId('download-feedback').textContent='Travel card download prepared: nightbus-travel-card.txt. It contains the full query and every prepared route option.';
});
writeForm();refreshSaved();render();
