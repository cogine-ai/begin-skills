(function(){
  'use strict';
  const core=window.OpenForm;
  const form=document.querySelector('#route-form');
  const title=document.querySelector('#route-title');
  const note=document.querySelector('#route-note');
  const feedback=document.querySelector('#feedback');
  const result=document.querySelector('#result');
  const state=document.querySelector('#result-status');
  const resultTitle=document.querySelector('#result-title');
  const summary=document.querySelector('#result-summary');
  const text=document.querySelector('#prepared-text');
  const keep=document.querySelector('#keep-route');
  const download=document.querySelector('#download-route');
  const recover=document.querySelector('#recover-route');
  const forget=document.querySelector('#forget-route');
  const storageStatus=document.querySelector('#storage-status');
  const key='open-form-route-v1';
  let prepared=null;
  function input(){return {title:title.value,note:note.value,selected:[...form.querySelectorAll('input[name=session]:checked')].map(e=>e.value)};}
  function message(value,error=false){feedback.textContent=value;feedback.dataset.error=String(error);}
  function current(){return prepared&&prepared.basis===core.fingerprint(input());}
  function readKeep(){try{const raw=localStorage.getItem(key);if(!raw)return null;const saved=JSON.parse(raw);const checked=core.prepare(saved);return checked.ok&&checked.text===saved.text?checked:null;}catch{return null;}}
  function updateStorage(){const kept=readKeep();recover.disabled=!kept;forget.disabled=!kept;storageStatus.textContent=kept?`Kept in this browser: ${kept.title} (${kept.count} sessions). Recover replaces the open choices; Forget only removes this kept copy.`:'No kept route. Keep stores one current route in this browser on this site. Nothing is sent to the workshop team.';}
  function render(){
    const v=input();document.querySelector('#selected-count').textContent=`${v.selected.length} of 5 sessions selected`;
    const check=core.validate(v);document.querySelector('#selection-status').textContent=check.clashes.length?check.errors.filter(e=>e.includes('overlap')).join(' '):'';
    result.hidden=!prepared;
    if(prepared){const active=current();state.textContent=active?'Current':'Earlier choices';state.classList.toggle('stale',!active);resultTitle.textContent=prepared.title;summary.textContent=`${prepared.count} sessions · ${prepared.duration} workshop min · ${prepared.gap} gap min · ${prepared.start}–${prepared.end}`;text.textContent=prepared.text;keep.disabled=!active;download.disabled=!active;document.querySelector('#result-note').textContent=active?'Your current personal route. No place is booked.':'The text below keeps your earlier route. Prepare again to use the changed choices.';}
    updateStorage();
  }
  function apply(v){title.value=v.title;note.value=v.note;for(const e of form.querySelectorAll('input[name=session]'))e.checked=v.selected.includes(e.value);}
  form.addEventListener('input',()=>{message(prepared&&!current()?'Choices changed. Prepare again before keeping or downloading.':'');render();});
  form.addEventListener('submit',e=>{e.preventDefault();const next=core.prepare(input());if(!next.ok){message(next.errors.join(' '),true);render();return;}prepared=next;render();message('Route prepared. You can keep or download this current copy.');result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  keep.addEventListener('click',()=>{if(!current())return;try{localStorage.setItem(key,JSON.stringify(prepared));message('Route kept in this browser.');updateStorage();}catch{message('This browser could not keep the route. Download a text copy instead.',true);}});
  recover.addEventListener('click',()=>{const saved=readKeep();if(!saved){message('No readable kept route was found.',true);updateStorage();return;}apply(saved);prepared=saved;render();message('Kept route recovered. It replaces the open choices.');result.scrollIntoView({behavior:'auto',block:'start'});});
  forget.addEventListener('click',()=>{try{localStorage.removeItem(key);message('Kept copy removed. Your open choices and prepared text remain.');updateStorage();}catch{message('The browser could not remove the kept copy.',true);}});
  document.querySelector('#reset-route').addEventListener('click',()=>{apply({title:'My Open Form route',note:'',selected:[]});prepared=null;render();message('Open choices reset. A kept copy, if present, remains available.');form.scrollIntoView({behavior:'auto',block:'start'});});
  download.addEventListener('click',()=>{if(!current())return;const blob=new Blob([prepared.text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='open-form-route.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Text copy downloaded.');});
  render();
})();
