import {createSession,getMatches,setScore,markInvalid,prepare,canUsePrepared,serializeKept,recoverKept,exportText} from './model.mjs';
import {buildBracket,syncBracket,renderReport,STORAGE_KEY} from './view.mjs';
let session=createSession();
const form=document.querySelector('#score-form'),bracket=document.querySelector('#bracket'),report=document.querySelector('#report');
const editFeedback=document.querySelector('#edit-feedback'),keepFeedback=document.querySelector('#keep-feedback');
const keep=document.querySelector('#keep'),download=document.querySelector('#download'),recover=document.querySelector('#recover'),forget=document.querySelector('#forget');
buildBracket(bracket,session,true);
function say(text){editFeedback.textContent=text;}
function nativeValid(){return [...form.querySelectorAll('input')].every(input=>input.disabled||input.validity.valid);}
function sync(){
  syncBracket(bracket,session,true);
  renderReport(report,session.prepared,!canUsePrepared(session),session.invalid);
  document.querySelector('#prepared-state').textContent=session.invalid?'Correct the invalid score. The previous prepared record is retained.':!session.prepared?'Prepare after edits to make a current record.':canUsePrepared(session)?'Current report prepared. You can keep or download it.':'Scores changed. Prepare again before keeping or downloading.';
  keep.disabled=download.disabled=!canUsePrepared(session);
  const raw=document.querySelector('#raw-record');raw.hidden=!session.prepared;if(session.prepared)document.querySelector('#record-text').textContent=session.prepared.text;
}
function storageInfo(){
  try{const raw=localStorage.getItem(STORAGE_KEY);recover.disabled=forget.disabled=!raw;keepFeedback.textContent=raw?'A kept record is available. Recover it to replace the working sample or edits.':'No record has been kept in this browser.';}
  catch{recover.disabled=forget.disabled=true;keepFeedback.textContent='Browser storage is unavailable. You can still prepare and download a record.';}
}
function replaceWorking(sample){session=createSession(sample);syncBracket(bracket,session,true,true);sync();storageInfo();say(sample?'Sample scores loaded as working scores. Prepare to make their report.':'Fresh bracket started. Quarterfinal scores are empty. Your kept record is still available.');}
form.addEventListener('input',event=>{
  const input=event.target;if(!(input instanceof HTMLInputElement))return;
  if(!input.validity.valid){session=markInvalid(session);sync();storageInfo();say('Use a whole score from 0 to 9. The last valid bracket and prepared record are retained.');return;}
  const before=getMatches(session),id=input.dataset.match,side=Number(input.dataset.side);
  session=setScore(session,id,side,input.value===''?null:Number(input.value));
  syncBracket(bracket,session,true);
  session=markInvalid(session,!nativeValid());
  const cleared=before.filter(m=>session.scores[m.id].every(v=>v===null)&&m.scores.some(v=>v!==null)).map(m=>m.label);
  sync();storageInfo();say(cleared.length?`${cleared.join(' and ')} scores cleared because an earlier winner changed. Prepare the revised report.`:'Working scores changed. Prepare again to update the report.');
});
form.addEventListener('invalid',()=>{session=markInvalid(session);sync();say('Correct the highlighted score: use a whole number from 0 to 9. The previous prepared record is retained.');},true);
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;session=markInvalid(session,false);session=prepare(session);sync();say('Round report prepared with the current scores. Review it below.');});
function eligible(){if(!form.reportValidity()){session=markInvalid(session);sync();return false;}if(!canUsePrepared(session)){say('Prepare the current valid scores before keeping or downloading.');return false;}return true;}
keep.addEventListener('click',()=>{if(!eligible())return;try{const raw=serializeKept(session);localStorage.setItem(STORAGE_KEY,raw);if(localStorage.getItem(STORAGE_KEY)!==raw)throw new Error('Readback failed');recover.disabled=forget.disabled=false;keepFeedback.textContent='Current report kept in this browser. Open or reload the spectator page to see this snapshot.';}catch{keepFeedback.textContent='The keep failed because browser storage is unavailable. Download the prepared record to take a copy.';}});
download.addEventListener('click',()=>{if(!eligible())return;const blob=new Blob([exportText(session)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gridshift-round-report.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);keepFeedback.textContent='The prepared UTF-8 text was handed to your browser for download. Your kept record was not changed.';});
document.querySelector('#load-sample').addEventListener('click',()=>replaceWorking(true));
document.querySelector('#reset').addEventListener('click',()=>replaceWorking(false));
recover.addEventListener('click',()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)throw new Error('No kept record');session=recoverKept(raw);syncBracket(bracket,session,true,true);sync();say('Kept scores recovered. Their complete report is current and ready to download.');keepFeedback.textContent='The kept record remains stored in this browser.';}catch{keepFeedback.textContent='The kept record could not be recovered. Your current working scores are unchanged. You can forget the unreadable stored copy.';}});
forget.addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);if(localStorage.getItem(STORAGE_KEY)!==null)throw new Error('Removal failed');recover.disabled=forget.disabled=true;keepFeedback.textContent='Kept record forgotten. Current working scores and report remain on screen.';}catch{keepFeedback.textContent='The stored record could not be removed. Current working scores remain unchanged.';}});
storageInfo();sync();
