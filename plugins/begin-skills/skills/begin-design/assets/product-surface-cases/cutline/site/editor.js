'use strict';
(() => {
  const DRAFT_KEY = 'cutline.draft.v1';
  const CHECKPOINT_KEY = 'cutline.checkpoint.v1';
  const seeds = {
    'last-ferry': { title: 'The last ferry', art: 'art/ferry.svg', alt: 'Original illustration of a ferry crossing evening water', length: 9500, cues: [
      {id:'ferry-1',start:'00:00:00,000',end:'00:00:03,000',text:'Its the last boat home.'},
      {id:'ferry-2',start:'00:00:03,200',end:'00:00:06,000',text:'Maëlle waits by the water.'},
      {id:'ferry-3',start:'00:00:06,500',end:'00:00:09,500',text:'We leave when the light turns blue.'}
    ]},
    glasshouse: { title: 'Glasshouse morning', art:'art/glasshouse.svg', alt:'Original illustration of an open glasshouse in the morning', length:10000, cues:[
      {id:'glass-1',start:'00:00:00,000',end:'00:00:03,500',text:'Every window catches a different sky.'},
      {id:'glass-2',start:'00:00:04,000',end:'00:00:07,000',text:'Noé opens the doors at seven.'},
      {id:'glass-3',start:'00:00:07,500',end:'00:00:10,000',text:'The city comes in quietly.'}
    ]}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const el = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,'0');
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const newClip = id => ({cues:clone(seeds[id].cues),selected:seeds[id].cues[0].id,revision:1,reviewed:[],approval:null,suggestion:id==='last-ferry'?'pending':'none',undo:null});
  const fresh = () => ({schema:1,active:'last-ferry',clips:Object.fromEntries(Object.keys(seeds).map(id=>[id,newClip(id)])),savedAt:null});
  const fingerprint = clip => JSON.stringify({cues:clip.cues.map(c=>({id:c.id,start:c.start,end:c.end,text:c.text})),suggestion:clip.suggestion});
  const parseTime = value => {
    if(!/^\d{2}:[0-5]\d:[0-5]\d,\d{3}$/.test(value)) return null;
    const [h,m,s,ms]=value.split(/[:,]/).map(Number);
    return ((h*60+m)*60+s)*1000+ms;
  };
  const formatTime = value => {
    const ms=Math.max(0,Math.round(value));
    return `${pad(Math.floor(ms/3600000))}:${pad(Math.floor(ms/60000)%60)}:${pad(Math.floor(ms/1000)%60)},${String(ms%1000).padStart(3,'0')}`;
  };
  const validate = clip => {
    const errors=[];
    clip.cues.forEach((cue,i)=>{
      const start=parseTime(cue.start),end=parseTime(cue.end),number=pad(i+1);
      if(start===null) errors.push({cue:cue.id,field:'start',message:`Cue ${number}: start must use HH:MM:SS,mmm with valid minutes and seconds.`});
      if(end===null) errors.push({cue:cue.id,field:'end',message:`Cue ${number}: end must use HH:MM:SS,mmm with valid minutes and seconds.`});
      if(start!==null&&end!==null&&end<=start) errors.push({cue:cue.id,field:'end',message:`Cue ${number}: end must be later than start.`});
      if(!cue.text.trim()) errors.push({cue:cue.id,field:'text',message:`Cue ${number}: subtitle text cannot be empty.`});
      if(cue.text.trim()&&cue.text.replace(/\r\n?/g,'\n').split('\n').some(line=>!line.trim())) errors.push({cue:cue.id,field:'text',message:`Cue ${number}: remove empty subtitle lines. SRT uses a blank line to separate cues.`});
      if(cue.text.includes('\u0000')) errors.push({cue:cue.id,field:'text',message:`Cue ${number}: remove the unsupported null character.`});
      if(i>0){
        const previous=clip.cues[i-1],previousEnd=parseTime(previous.end);
        if(previousEnd!==null&&start!==null&&start<previousEnd) errors.push({cue:cue.id,other:previous.id,field:'start',message:`Cues ${pad(i)} and ${number} overlap. Cue ${number} must start at or after ${previous.end}.`});
      }
    });
    return errors;
  };
  // Recovery accepts only known clips/cue identities and bounded plain data.
  function normalize(input){
    if(!input||input.schema!==1||!Object.hasOwn(seeds,input.active)||!input.clips) throw new Error('Unsupported draft');
    const result=fresh(); result.active=input.active;
    if(input.savedAt!==null&&typeof input.savedAt==='string'&&!Number.isNaN(Date.parse(input.savedAt))) result.savedAt=input.savedAt;
    for(const id of Object.keys(seeds)){
      const source=input.clips[id],target=result.clips[id];
      if(!source||!Array.isArray(source.cues)||source.cues.length!==3||!Number.isSafeInteger(source.revision)||source.revision<1||source.revision>1000000) throw new Error('Invalid clip');
      target.cues=source.cues.map((cue,i)=>{
        if(!cue||cue.id!==seeds[id].cues[i].id||typeof cue.start!=='string'||cue.start.length>12||typeof cue.end!=='string'||cue.end.length>12||typeof cue.text!=='string'||cue.text.length>2000) throw new Error('Invalid cue');
        return {id:cue.id,start:cue.start,end:cue.end,text:cue.text};
      });
      target.revision=source.revision;
      target.selected=target.cues.some(c=>c.id===source.selected)?source.selected:target.cues[0].id;
      const allowed=id==='last-ferry'?['pending','accepted','rejected','edited']:['none'];
      target.suggestion=allowed.includes(source.suggestion)?source.suggestion:target.suggestion;
      if(id==='last-ferry'){
        if(target.suggestion==='accepted'&&target.cues[0].text!=='It’s the last boat home.')target.suggestion='edited';
        if(target.suggestion==='pending'&&target.cues[0].text!=='Its the last boat home.')target.suggestion='edited';
      }
      target.reviewed=Array.isArray(source.reviewed)?[...new Set(source.reviewed.filter(cid=>target.cues.some(c=>c.id===cid)))]:[];
      if(source.approval&&source.approval.revision===target.revision&&source.approval.fingerprint===fingerprint(target)&&target.reviewed.length===3&&validate(target).length===0&&target.suggestion!=='pending') target.approval={revision:target.revision,fingerprint:fingerprint(target)};
      if(source.undo&&['accepted','rejected'].includes(target.suggestion)&&typeof source.undo.before==='string'&&source.undo.before.length<=2000&&typeof source.undo.after==='string'&&source.undo.after.length<=2000)target.undo={before:source.undo.before,after:source.undo.after};
    }
    return result;
  }
  let state=fresh(),checkpoint=null,storageAvailable=true,editToken=null,lastExport=null,recovered=false,recoveryNotice='';
  try{
    const stored=localStorage.getItem(DRAFT_KEY);
    if(stored){try{state=normalize(JSON.parse(stored));recovered=true;}catch{recoveryNotice='The stored draft was not compatible. Original samples are open; save a checkpoint to keep new work.';}}
    const kept=localStorage.getItem(CHECKPOINT_KEY);
    if(kept){try{checkpoint=normalize(JSON.parse(kept));}catch{recoveryNotice+=' The stored checkpoint could not be read.';}}
  }catch{storageAvailable=false;recoveryNotice='Browser storage is unavailable. Work stays in this tab; keep it open until you download.';}
  const query=new URLSearchParams(location.search),requested=query.get('clip');
  if(Object.hasOwn(seeds,requested)) state.active=requested;
  if(state.clips[state.active].cues.some(c=>c.id===query.get('cue')))state.clips[state.active].selected=query.get('cue');
  const active=()=>state.clips[state.active];
  const current=()=>active().cues.find(c=>c.id===active().selected);
  function announce(message){el('live-note').textContent=message;}
  function save(){
    state.savedAt=new Date().toISOString();
    try{
      const serialized=JSON.stringify(state); localStorage.setItem(DRAFT_KEY,serialized);
      if(localStorage.getItem(DRAFT_KEY)!==serialized)throw new Error('Unconfirmed write');
      storageAvailable=true;
    }catch{storageAvailable=false;}
    renderStorage();
  }
  function renderStorage(){
    const when=state.savedAt?new Date(state.savedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'';
    el('draft-status').textContent=storageAvailable?`${recovered?'Recovered draft · ':''}Autosaved in this browser${when?' at '+when:''}.`:'Browser storage unavailable. Keep this tab open; current work is not saved.';
    el('draft-status').style.color=storageAvailable?'':'var(--error)';
    el('checkpoint-status').textContent=checkpoint?`Checkpoint saved ${new Date(checkpoint.savedAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · both clips`:'No checkpoint saved yet';
    el('restore-checkpoint').disabled=!checkpoint;
  }
  function isApproved(clip){return clip.approval&&clip.approval.revision===clip.revision&&clip.approval.fingerprint===fingerprint(clip);}
  function mutate(operation,token=null){
    const clip=active(); const before=fingerprint(clip); operation(clip);
    if(fingerprint(clip)!==before){
      if(!token||editToken!==token)clip.revision++;
      editToken=token;clip.reviewed=[];clip.approval=null;lastExport=null;
    }
    save();render(false);
  }
  function selectCue(id,scroll=false,focus=false){
    const clip=active();if(!clip.cues.some(c=>c.id===id))return;
    clip.selected=id;editToken=null;history.replaceState(null,'',`editor.html?clip=${state.active}&cue=${id}`);save();render(true);
    if(scroll&&(focus||matchMedia('(max-width:760px)').matches))el('edit-cue').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    if(focus)el('cue-heading').focus({preventScroll:true});
  }
  function suggestionMarkup(clip){
    if(state.active!=='last-ferry'||current().id!=='ferry-1')return '';
    const pending=clip.suggestion==='pending';
    let message='',detail='';
    if(pending){message='“Its” → “It’s”';detail='This sample line means “It is.” A local example rule suggests the apostrophe. You decide whether it belongs.';}
    if(clip.suggestion==='accepted'){message='Sample suggestion accepted';detail='The cue now reads “It’s the last boat home.” This changed revision needs your review.';}
    if(clip.suggestion==='rejected'){message='Sample suggestion rejected';detail='The original wording was kept. You can still review and approve it as a deliberate choice.';}
    if(clip.suggestion==='edited'){message='You edited this line';detail='The sample rule no longer applies to this wording. Review your own text and timing.';}
    const undoAllowed=clip.undo&&current().text===clip.undo.after;
    return `<aside class="suggestion-box"><div class="eyebrow">Sample suggestion · local rule</div><h3>${escape(message)}</h3><p>${escape(detail)}</p><div class="suggestion-actions">${pending?'<button type="button" class="button small-button" data-suggestion="accept">Accept suggestion</button><button type="button" class="button secondary small-button" data-suggestion="reject">Reject</button>':undoAllowed?'<button type="button" class="button secondary small-button" data-suggestion="undo">Undo decision</button>':''}</div></aside>`;
  }
  function render(fillFields=true){
    const id=state.active,clip=active(),seed=seeds[id],cue=current(),index=clip.cues.indexOf(cue),errors=validate(clip),valid=errors.length===0,approved=Boolean(isApproved(clip)),allReviewed=clip.reviewed.length===3,resolved=clip.suggestion!=='pending';
    el('clip-title').textContent=seed.title;el('clip-select').value=id;el('revision-label').textContent=`REVISION ${pad(clip.revision)}`;document.title=`${seed.title} — CUTLINE`;
    el('approval-status').textContent=approved?'Approved for export':!valid?'Timing or text needs attention':'Needs review';
    el('approval-status').className=`status${approved?' approved':!valid?' error':''}`;
    el('scene-image').src=seed.art;el('scene-image').alt=seed.alt;
    el('frame-identity').textContent=`${seed.title.toUpperCase()} / CUE ${pad(index+1)}`;
    el('scene-subtitle').textContent=cue.text.trim()?cue.text:'[Empty cue]';
    const start=parseTime(cue.start),end=parseTime(cue.end);
    el('frame-time').textContent=start!==null&&end!==null&&end>start?formatTime((start+end)/2):'TIMING INVALID';
    const maxEnd=Math.max(seed.length,...clip.cues.map(c=>parseTime(c.end)||0)),timelineMax=Math.max(10000,Math.ceil(maxEnd/1000)*1000);
    el('scene-duration').textContent=`${(maxEnd/1000).toFixed(3)} s / 3 cues`;
    el('timeline-end').textContent=formatTime(timelineMax).slice(3,8);el('timeline-middle').textContent=formatTime(timelineMax/2).slice(3,8);
    el('timeline-rail').innerHTML=clip.cues.map((c,i)=>{const a=parseTime(c.start),b=parseTime(c.end);if(a===null||b===null||b<=a)return '';return `<button aria-label="Select cue ${pad(i+1)}: ${escape(c.text)}" aria-pressed="${c.id===cue.id}" data-cue="${c.id}" style="left:${a/timelineMax*100}%;width:${(b-a)/timelineMax*100}%">${pad(i+1)}</button>`;}).join('');
    el('cue-list').innerHTML=clip.cues.map((c,i)=>`<button class="cue-row" data-cue="${c.id}" aria-pressed="${c.id===cue.id}" aria-label="Edit cue ${pad(i+1)}${clip.reviewed.includes(c.id)?', reviewed':''}: ${escape(c.text)}"><span class="cue-number">${pad(i+1)}</span><span><span class="cue-time"><span class="cue-boundary"><span class="cue-time-label">IN</span><time>${escape(c.start)}</time></span><span class="cue-boundary"><span class="cue-time-label">OUT</span><time>${escape(c.end)}</time></span></span><span class="cue-line">${escape(c.text||'[Empty cue]')}</span></span><span class="cue-check" aria-hidden="true">${clip.reviewed.includes(c.id)?'✓':'·'}</span></button>`).join('');
    el('cue-sheet-count').textContent=`${clip.reviewed.length} of 3 reviewed`;
    el('cue-heading').innerHTML=`<span class="cue-current">Cue ${pad(index+1)}</span><span class="cue-total">of 03</span>`;
    el('cue-heading').setAttribute('aria-label',`Cue ${pad(index+1)} of 03, ${seed.title}, revision ${pad(clip.revision)}`);
    el('cue-context').textContent=`${seed.title} / Revision ${pad(clip.revision)}`;
    el('previous-cue').disabled=index===0;el('next-cue').disabled=index===2;
    if(fillFields){el('cue-text').value=cue.text;el('cue-start').value=cue.start;el('cue-end').value=cue.end;}
    el('cue-duration').textContent=start!==null&&end!==null&&end>start?`${((end-start)/1000).toFixed(3)} s on screen`:'Check this cue’s timing';
    el('character-count').textContent=`${Array.from(cue.text).length} characters`;
    const relevantErrors=errors.filter(e=>e.cue===cue.id||e.other===cue.id);
    for(const field of ['text','start','end'])el('cue-'+field).setAttribute('aria-invalid',String(relevantErrors.some(e=>e.field===field||e.other===cue.id)));
    el('validation').hidden=errors.length===0;
    el('validation').innerHTML=errors.length?`<strong>Export is blocked until these are fixed</strong><ul>${errors.map(e=>`<li>${escape(e.message)}</li>`).join('')}</ul>`:'';
    el('suggestion').innerHTML=suggestionMarkup(clip);
    const reviewed=clip.reviewed.includes(cue.id);
    el('mark-reviewed').innerHTML=reviewed?`Cue ${pad(index+1)} reviewed <span aria-hidden="true">✓</span>`:`Mark cue ${pad(index+1)} reviewed <span aria-hidden="true">✓</span>`;
    el('mark-reviewed').className=`button${reviewed?' secondary':''}`;
    el('mark-reviewed').disabled=!valid||(id==='last-ferry'&&cue.id==='ferry-1'&&!resolved);
    el('cue-review-note').textContent=!valid?'Correct the listed errors before marking cues reviewed.':id==='last-ferry'&&cue.id==='ferry-1'&&!resolved?'Accept or reject the sample suggestion before reviewing this cue.':reviewed?`Checked in revision ${pad(clip.revision)}. Select the next cue, or click again to remove the review mark.`:'Review the complete words and timing before marking this cue.';
    el('review-scope').textContent=`${seed.title} / Revision ${pad(clip.revision)}`;
    el('review-heading').textContent=approved?'This revision is approved':'Stand behind this revision';
    el('review-explanation').textContent=approved?`You approved all 3 cues in revision ${pad(clip.revision)} of ${seed.title}. The download will contain exactly these words and timings. Any further edit needs a fresh review.`:`Read every cue${id==='last-ferry'?', resolve the sample suggestion':''}, then approve the whole clip. The SRT will contain all three cues in this exact revision.`;
    el('review-heading').setAttribute('aria-label',`Revision review, ${seed.title}, revision ${pad(clip.revision)}`);
    el('review-progress').innerHTML=clip.cues.map((c,i)=>`<button type="button" class="review-chip${clip.reviewed.includes(c.id)?' done':''}" data-cue="${c.id}" aria-label="Open cue ${pad(i+1)} of ${escape(seed.title)}, ${clip.reviewed.includes(c.id)?'reviewed':'needs review'}"><span class="review-chip-name">${clip.reviewed.includes(c.id)?'✓':'○'} CUE ${pad(i+1)}</span><span class="review-chip-state">${clip.reviewed.includes(c.id)?'Reviewed':'Needs review'} <span aria-hidden="true">↗</span></span></button>`).join('');
    el('approve-revision').textContent=approved?`Revision ${pad(clip.revision)} approved ✓`:`Approve revision ${pad(clip.revision)}`;
    el('approve-revision').disabled=approved||!valid||!resolved||!allReviewed;
    el('export-srt').disabled=!approved||!valid;
    el('export-condition').textContent=!valid?'Export blocked: fix the timing or text errors above.':!resolved?'Resolve the sample suggestion, then review all 3 cues.':!allReviewed?`${3-clip.reviewed.length} cue${3-clip.reviewed.length===1?'':'s'} still need review in revision ${pad(clip.revision)}.`:!approved?'All 3 cues reviewed. Approve this revision to enable the download.':`UTF-8 SRT · 3 complete cues · ${id}-r${pad(clip.revision)}.srt`;
    el('export-result').hidden=!lastExport||lastExport.clip!==id||lastExport.revision!==clip.revision;
    if(!el('export-result').hidden)el('export-result').textContent=lastExport.message;
    renderStorage();
  }
  el('clip-select').addEventListener('change',event=>{state.active=event.target.value;editToken=null;lastExport=null;history.replaceState(null,'',`editor.html?clip=${state.active}`);save();render(true);announce(`Opened ${seeds[state.active].title}. Selection and review belong to this clip.`);});
  document.addEventListener('click',event=>{
    const choice=event.target.closest('[data-cue]');if(choice)selectCue(choice.dataset.cue,choice.classList.contains('cue-row')||choice.classList.contains('review-chip'),choice.classList.contains('review-chip'));
    const suggestion=event.target.closest('[data-suggestion]');if(!suggestion)return;
    const action=suggestion.dataset.suggestion;
    if(action==='accept'&&active().suggestion==='pending'){
      mutate(clip=>{const c=clip.cues[0];clip.undo={before:c.text,after:'It’s the last boat home.'};c.text='It’s the last boat home.';clip.suggestion='accepted';});render(true);announce('Sample suggestion accepted. Cue 01 changed; this revision needs a fresh review.');
    }
    if(action==='reject'&&active().suggestion==='pending'){
      mutate(clip=>{clip.undo={before:clip.cues[0].text,after:clip.cues[0].text};clip.suggestion='rejected';});render(true);announce('Sample suggestion rejected. Original words kept as your decision.');
    }
    if(action==='undo'&&active().undo&&active().cues[0].text===active().undo.after){
      mutate(clip=>{clip.cues[0].text=clip.undo.before;clip.suggestion='pending';clip.undo=null;});render(true);announce('Suggestion decision undone. The original words and pending choice are restored.');
    }
  });
  for(const field of ['text','start','end']){
    el('cue-'+field).addEventListener('input',event=>{
      const token=active().selected+':'+field;
      mutate(clip=>{const cue=current();cue[field]=event.target.value;if(cue.id==='ferry-1'&&field==='text'){clip.suggestion=cue.text==='Its the last boat home.'?'pending':'edited';clip.undo=null;}},token);
    });
    el('cue-'+field).addEventListener('blur',()=>{editToken=null;});
  }
  el('return-review').addEventListener('click',()=>{
    el('review').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    el('review-heading').focus({preventScroll:true});
  });
  el('previous-cue').addEventListener('click',()=>{const clip=active(),i=clip.cues.findIndex(c=>c.id===clip.selected);if(i>0)selectCue(clip.cues[i-1].id);});
  el('next-cue').addEventListener('click',()=>{const clip=active(),i=clip.cues.findIndex(c=>c.id===clip.selected);if(i<2)selectCue(clip.cues[i+1].id);});
  el('mark-reviewed').addEventListener('click',()=>{
    const clip=active(),cue=current();if(validate(clip).length||(cue.id==='ferry-1'&&clip.suggestion==='pending'))return;
    if(clip.reviewed.includes(cue.id)){clip.reviewed=clip.reviewed.filter(id=>id!==cue.id);clip.approval=null;lastExport=null;announce(`Cue ${pad(clip.cues.indexOf(cue)+1)} review mark removed. Revision needs approval again.`);}
    else{clip.reviewed.push(cue.id);announce(`Cue ${pad(clip.cues.indexOf(cue)+1)} reviewed. ${clip.reviewed.length} of 3 cues checked in this revision.`);}
    save();render(false);
  });
  el('approve-revision').addEventListener('click',()=>{
    const clip=active();if(validate(clip).length||clip.suggestion==='pending'||clip.reviewed.length!==3)return;
    clip.approval={revision:clip.revision,fingerprint:fingerprint(clip)};save();render(false);announce(`Revision ${pad(clip.revision)} of ${seeds[state.active].title} approved for a local SRT download.`);
  });
  el('export-srt').addEventListener('click',()=>{
    const clip=active();if(!isApproved(clip)||validate(clip).length){render(false);announce('Export blocked. Review and approve a valid current revision.');return;}
    const srt=clip.cues.map((cue,i)=>`${i+1}\r\n${cue.start} --> ${cue.end}\r\n${cue.text.replace(/\r\n?/g,'\n').replace(/\n/g,'\r\n')}`).join('\r\n\r\n')+'\r\n';
    const blob=new Blob([srt],{type:'application/x-subrip;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    const name=`${state.active}-r${pad(clip.revision)}.srt`;link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    lastExport={clip:state.active,revision:clip.revision,message:`Created ${name} · all 3 cues. Check your browser’s downloads.`};render(false);announce('SRT file created locally. No media was uploaded or published.');
  });
  el('save-checkpoint').addEventListener('click',()=>{
    save();const snapshot=clone(state);snapshot.savedAt=new Date().toISOString();
    try{const raw=JSON.stringify(snapshot);localStorage.setItem(CHECKPOINT_KEY,raw);if(localStorage.getItem(CHECKPOINT_KEY)!==raw)throw new Error('Unconfirmed checkpoint');checkpoint=snapshot;renderStorage();announce('Checkpoint saved for both clips in this browser.');}
    catch{announce('Checkpoint could not be saved. Current work is still open; keep this tab open.');}
  });
  el('restore-checkpoint').addEventListener('click',()=>{if(checkpoint)el('restore-dialog').showModal();});
  el('cancel-restore').addEventListener('click',()=>el('restore-dialog').close());
  el('confirm-restore').addEventListener('click',()=>{
    if(!checkpoint)return;state=normalize(clone(checkpoint));editToken=null;lastExport=null;el('restore-dialog').close();save();render(true);announce('Saved checkpoint restored for both clips, including its exact words, timing and review state.');
  });
  el('reset-clip').addEventListener('click',()=>{el('reset-heading').textContent=`Reset ${seeds[state.active].title}?`;el('reset-description').textContent='This restores the three original sample cues and clears this clip’s edits, suggestion decisions, review marks and approval. The other clip and your saved checkpoint stay available.';el('reset-dialog').showModal();});
  el('cancel-reset').addEventListener('click',()=>el('reset-dialog').close());
  el('confirm-reset').addEventListener('click',()=>{state.clips[state.active]=newClip(state.active);editToken=null;lastExport=null;el('reset-dialog').close();save();render(true);announce(`${seeds[state.active].title} reset to its original sample. Other clip and checkpoint preserved.`);});
  // Protect every navigation route if the current working copy cannot be recovered.
  document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link||storageAvailable||link.getAttribute('href').startsWith('#'))return;if(!confirm('Browser storage is unavailable. Leaving this editor can lose the current work. Stay here to finish and download, or choose OK to leave.'))event.preventDefault();});
  window.addEventListener('beforeunload',event=>{if(!storageAvailable){event.preventDefault();event.returnValue='';}});
  save();render(true);if(recoveryNotice)announce(recoveryNotice);else if(recovered)announce('Your local draft has been restored. Continue from the selected clip and cue.');
})();
