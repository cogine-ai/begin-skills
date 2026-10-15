export const CLOCK = '2026-10-15';
export const STORAGE_KEY = 'checkout.media-lab.kept.v1';
export const FIXTURES = Object.freeze([
  {id:'C01',name:'Sony FX30 camera',category:'Camera',status:'available',member:'',dueDate:'',loanDate:'',note:''},
  {id:'C02',name:'Sennheiser MKH 416 microphone',category:'Microphone',status:'out',member:'Élise Renard',dueDate:'2026-10-16',loanDate:'',note:'Windscreen included'},
  {id:'C03',name:'Aputure 300d II light',category:'Light',status:'maintenance',member:'',dueDate:'',loanDate:'',note:'Power cable inspection'},
  {id:'C04',name:'Zoom F6 field recorder',category:'Recorder',status:'available',member:'',dueDate:'',loanDate:'',note:''},
  {id:'C05',name:'Manfrotto 055 tripod',category:'Tripod',status:'out',member:'Mara Ellery',dueDate:'2026-10-14',loanDate:'',note:'Plate packed'},
  {id:'C06',name:'Blackmagic Video Assist monitor',category:'Monitor',status:'available',member:'',dueDate:'',loanDate:'',note:''}
].map(Object.freeze));
const clone = value => JSON.parse(JSON.stringify(value));
export function validISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d]=value.split('-').map(Number);
  const leap=y%4===0 && (y%100!==0 || y%400===0);
  return y>=1 && m>=1 && m<=12 && d>=1 && d<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
}
export function overdueDays(item) {
  if(item.status!=='out' || !validISODate(item.dueDate) || item.dueDate>=CLOCK) return 0;
  return Math.round((Date.parse(CLOCK+'T00:00:00Z')-Date.parse(item.dueDate+'T00:00:00Z'))/86400000);
}
export function counts(state) {
  return {total:state.items.length,available:state.items.filter(i=>i.status==='available').length,out:state.items.filter(i=>i.status==='out').length,maintenance:state.items.filter(i=>i.status==='maintenance').length,overdue:state.items.filter(i=>overdueDays(i)>0).length};
}
export function createState() {
  const items=clone(FIXTURES);
  return {schemaVersion:1,clock:CLOCK,revision:0,title:'Community media lab — equipment report',operatorNote:'',items,events:items.map((i,n)=>({id:`E${String(n+1).padStart(3,'0')}`,kind:'snapshot',date:'',itemId:i.id,itemName:i.name,fromStatus:'',toStatus:i.status,member:i.member,loanDate:i.loanDate,dueDate:i.dueDate,note:i.note})),draft:null,prepared:null};
}
export function draftFor(state,itemId,kind) {
  const item=state.items.find(i=>i.id===itemId);
  if(!item) throw new Error('Unknown equipment ID.');
  return {itemId,kind,member:'',dueDate:kind==='checkout'?CLOCK:'',note:'',dirty:false};
}
export function validateAction(state,draft=state.draft) {
  const errors={};
  if(!draft) return errors;
  const item=state.items.find(i=>i.id===draft.itemId);
  if(!item) return {action:'Choose an item from the inventory.'};
  if(draft.kind==='checkout') {
    if(item.status!=='available') errors.action='Only an available item can be checked out.';
    if(typeof draft.member!=='string' || !draft.member.trim()) errors.member='Enter the member’s full name.';
    else if(draft.member.length>160) errors.member='Use 160 characters or fewer for the member name.';
    if(!validISODate(draft.dueDate)) errors.dueDate='Enter a real date as YYYY-MM-DD, for example 2026-10-16.';
    else if(draft.dueDate<CLOCK) errors.dueDate='The due date must be 2026-10-15 or later.';
  } else if(draft.kind==='return') {
    if(item.status!=='out') errors.action='Only an item currently out can be returned.';
    if(typeof draft.note!=='string' || !draft.note.trim()) errors.note='Describe the condition at return.';
  } else if(draft.kind==='maintenance') {
    if(item.status!=='available') errors.action='Return an active loan before setting maintenance.';
    if(typeof draft.note!=='string' || !draft.note.trim()) errors.note='Enter the maintenance reason.';
  } else if(draft.kind==='restore') {
    if(item.status!=='maintenance') errors.action='Only an item in maintenance can be restored.';
    if(typeof draft.note!=='string' || !draft.note.trim()) errors.note='Record the inspection or repair outcome.';
  } else errors.action='Choose a supported action.';
  if(typeof draft.note!=='string' || draft.note.length>2000) errors.note='Use 2000 characters or fewer for the note.';
  return errors;
}
export function validationErrors(state) {
  const errors={};
  if(typeof state.title!=='string' || !state.title.trim()) errors.title='Give the report a title.';
  else if(state.title.length>160) errors.title='Use 160 characters or fewer for the report title.';
  if(typeof state.operatorNote!=='string' || state.operatorNote.length>2000) errors.operatorNote='Use 2000 characters or fewer for the operator note.';
  if(state.draft?.dirty) Object.assign(errors,validateAction(state));
  return errors;
}
export function selectDraft(state,itemId,kind) { return {...state,draft:draftFor(state,itemId,kind)}; }
export function editDraft(state,fields) {
  if(!state.draft) throw new Error('Choose an action first.');
  const draft={...state.draft,...fields,dirty:true};
  const next={...state,draft};
  return {...next,revision:state.revision+(Object.keys(validationErrors(next)).length===0?1:0)};
}
export function cancelDraft(state) { return {...state,draft:null}; }
export function editMetadata(state,field,value) {
  if(!['title','operatorNote'].includes(field)) throw new Error('Unsupported report field.');
  const next={...state,[field]:value};
  return {...next,revision:state.revision+(Object.keys(validationErrors(next)).length===0?1:0)};
}
export function applyAction(state) {
  const errors=validateAction(state);
  if(!state.draft || Object.keys(errors).length) return {ok:false,state,errors:state.draft?errors:{action:'Choose an action first.'}};
  const draft=state.draft;
  const old=state.items.find(i=>i.id===draft.itemId);
  const note=draft.note.trim();
  let item={...old};
  if(draft.kind==='checkout') item={...item,status:'out',member:draft.member.trim(),dueDate:draft.dueDate,loanDate:CLOCK,note};
  else if(draft.kind==='return') item={...item,status:'available',member:'',dueDate:'',loanDate:'',note};
  else if(draft.kind==='maintenance') item={...item,status:'maintenance',note};
  else if(draft.kind==='restore') item={...item,status:'available',note};
  const event={id:`E${String(state.events.length+1).padStart(3,'0')}`,kind:draft.kind,date:CLOCK,itemId:old.id,itemName:old.name,fromStatus:old.status,toStatus:item.status,member:draft.kind==='checkout'?item.member:old.member,loanDate:draft.kind==='checkout'?item.loanDate:old.loanDate,dueDate:draft.kind==='checkout'?item.dueDate:old.dueDate,note};
  return {ok:true,errors:{},state:{...state,revision:state.revision+1,items:state.items.map(i=>i.id===item.id?item:i),events:[...state.events,event],draft:null}};
}
export function reportGate(state) {
  const errors=validationErrors(state);
  if(Object.keys(errors).length) return {ok:false,reason:'Correct the invalid fields. The last prepared report is retained.',errors};
  if(state.draft?.dirty) return {ok:false,reason:'Complete or cancel the open action before preparing or using the report.',errors:{}};
  return {ok:true,reason:'',errors:{}};
}
export function reportIsCurrent(state) { return !!state.prepared && reportGate(state).ok && state.prepared.revision===state.revision; }
const statusText = item => item.status==='available'?'Available':item.status==='maintenance'?'Maintenance':overdueDays(item)?`Out — overdue ${overdueDays(item)} day${overdueDays(item)===1?'':'s'}`:'Out';
export function reportText(state) {
  const c=counts(state);
  let out=`${state.title.trim()}\nCHECKOUT / Fictional community media lab\nSimulated clock: ${CLOCK}\nThis report records local demonstration data only.\n\nSUMMARY\n${c.total} items | ${c.available} available | ${c.out} out | ${c.maintenance} in maintenance | ${c.overdue} overdue\n\nOPERATOR NOTE\n${state.operatorNote || '(No operator note)'}\n\nCOMPLETE INVENTORY\n`;
  for(const item of state.items) {
    out+=`\n${item.id} | ${item.name}\nStatus: ${statusText(item)}\nMember: ${item.member || '(None)'}\nLoan date: ${item.loanDate || (item.status==='out'?'Not supplied in opening snapshot':'(None)')}\nDue date: ${item.dueDate || '(None)'}\nNote: ${item.note || '(No note)'}\n`;
  }
  out+='\nCOMPLETE CUSTODY HISTORY\nOpening snapshot dates were not supplied. All added event dates use the simulated clock.\n';
  for(const event of state.events) {
    out+=`\n${event.id} | ${event.kind.toUpperCase()} | ${event.itemId} | ${event.itemName}\nEvent date: ${event.date || 'Opening snapshot — date not supplied'}\nStatus: ${event.fromStatus || '(Opening)'} -> ${event.toStatus}\nMember: ${event.member || '(None)'}\nLoan date: ${event.loanDate || (event.member?'Not supplied in opening snapshot':'(None)')}\nDue date: ${event.dueDate || '(None)'}\nNote: ${event.note || '(No note)'}\n`;
  }
  return out;
}
export function prepareReport(state) {
  const gate=reportGate(state);
  if(!gate.ok) return {ok:false,state,...gate};
  return {ok:true,state:{...state,prepared:{revision:state.revision,text:reportText(state),title:state.title.trim(),operatorNote:state.operatorNote,items:clone(state.items),events:clone(state.events),counts:counts(state)}}};
}
export function downloadText(state) {
  if(!reportIsCurrent(state)) throw new Error('Prepare a valid current report before downloading.');
  return state.prepared.text;
}
export function serializeKeep(state) {
  if(!reportIsCurrent(state)) throw new Error('Prepare a valid current report before keeping.');
  return JSON.stringify({version:1,state:{...clone(state),draft:null}});
}
export function recoverKeep(raw) {
  let data;
  try { data=JSON.parse(raw); } catch { throw new Error('The kept copy could not be read. The current desk is unchanged.'); }
  const s=data?.state;
  const fail=()=>{throw new Error('The kept copy is incomplete or incompatible. The current desk is unchanged.');};
  if(data?.version!==1 || !s || s.schemaVersion!==1 || s.clock!==CLOCK || !Number.isInteger(s.revision) || s.revision<0 || !Array.isArray(s.items) || s.items.length!==6 || !Array.isArray(s.events) || s.events.length<6 || !s.prepared || s.draft!==null) fail();
  if(Object.keys(validationErrors(s)).length) fail();
  const initial=createState();
  for(let n=0;n<6;n++) {
    const i=s.items[n],f=FIXTURES[n];
    if(!i || i.id!==f.id || i.name!==f.name || i.category!==f.category || !['available','out','maintenance'].includes(i.status) || typeof i.note!=='string' || i.note.length>2000 || typeof i.member!=='string' || typeof i.dueDate!=='string' || typeof i.loanDate!=='string') fail();
    if(i.status==='out' && (!i.member.trim() || !validISODate(i.dueDate) || (i.loanDate && !validISODate(i.loanDate)))) fail();
    if(i.status!=='out' && (i.member || i.dueDate || i.loanDate)) fail();
    if(JSON.stringify(s.events[n])!==JSON.stringify(initial.events[n])) fail();
  }
  const replay=clone(FIXTURES);
  for(let n=6;n<s.events.length;n++) {
    const e=s.events[n];
    if(!e || typeof e!=='object') fail();
    const i=replay.find(x=>x.id===e.itemId);
    if(!i || e.id!==`E${String(n+1).padStart(3,'0')}` || e.itemName!==i.name || e.date!==CLOCK || e.fromStatus!==i.status || typeof e.note!=='string' || e.note.length>2000) fail();
    if(e.kind==='checkout') {
      if(i.status!=='available' || e.toStatus!=='out' || !e.member?.trim() || !validISODate(e.dueDate) || e.dueDate<CLOCK || e.loanDate!==CLOCK) fail();
      Object.assign(i,{status:'out',member:e.member,dueDate:e.dueDate,loanDate:e.loanDate,note:e.note});
    } else if(e.kind==='return') {
      if(i.status!=='out' || e.toStatus!=='available' || e.member!==i.member || e.dueDate!==i.dueDate || e.loanDate!==i.loanDate || !e.note.trim()) fail();
      Object.assign(i,{status:'available',member:'',dueDate:'',loanDate:'',note:e.note});
    } else if(['maintenance','restore'].includes(e.kind)) {
      const from=e.kind==='maintenance'?'available':'maintenance',to=e.kind==='maintenance'?'maintenance':'available';
      if(i.status!==from || e.toStatus!==to || e.member || e.dueDate || e.loanDate || !e.note.trim()) fail();
      Object.assign(i,{status:to,note:e.note});
    } else fail();
  }
  if(JSON.stringify(replay)!==JSON.stringify(s.items) || s.prepared.revision!==s.revision || s.prepared.text!==reportText(s) || JSON.stringify(s.prepared.items)!==JSON.stringify(s.items) || JSON.stringify(s.prepared.events)!==JSON.stringify(s.events) || JSON.stringify(s.prepared.counts)!==JSON.stringify(counts(s)) || s.prepared.title!==s.title.trim() || s.prepared.operatorNote!==s.operatorNote) fail();
  return clone(s);
}
export function resetWork() { return createState(); }
export function keepToStorage(state,storage) { const raw=serializeKeep(state); storage.setItem(STORAGE_KEY,raw); return raw; }
export function recoverFromStorage(storage) {
  const raw=storage.getItem(STORAGE_KEY);
  if(!raw) throw new Error('There is no kept copy in this browser.');
  return recoverKeep(raw);
}
export function forgetFromStorage(storage) { storage.removeItem(STORAGE_KEY); }
